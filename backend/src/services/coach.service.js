const { Conversation, Message } = require('../models');
const { detectAndFlagRisk } = require('./crisis.service');
const { callGeminiAPI } = require('./ai.service');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

/**
 * Create a new coaching conversation
 * @param {string} userId - User ID
 * @param {object} context - Initial context (lastMoodScore, challenges etc)
 * @returns {object} - Created conversation
 */
async function createConversation(userId, context = {}) {
  try {
    const conversation = await Conversation.create({
      user_id: userId,
      title: context.title || `Coaching Session - ${new Date().toLocaleDateString()}`,
      context: {
        last_mood_score: context.lastMoodScore,
        current_challenges: context.challenges || [],
      },
      message_count: 0,
      last_message_at: new Date(),
    });

    logger.info(`Coaching conversation created for user ${userId}`);
    return conversation.toObject();
  } catch (error) {
    logger.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Get user's conversations
 * @param {string} userId - User ID
 * @param {object} options - { limit, skip, status }
 * @returns {array} - List of conversations
 */
async function getConversations(userId, options = {}) {
  try {
    const { limit = 20, skip = 0 } = options;

    const conversations = await Conversation.find({ user_id: userId })
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return conversations;
  } catch (error) {
    logger.error('Error getting conversations:', error);
    throw error;
  }
}

/**
 * Get conversation with all messages
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 * @returns {object} - Conversation with messages
 */
async function getConversation(conversationId, userId) {
  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user_id: userId,
    }).lean();

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = await Message.find({ conversation_id: conversationId })
      .sort({ created_at: 1 })
      .lean()
      .exec();

    return { ...conversation, messages };
  } catch (error) {
    logger.error('Error getting conversation:', error);
    throw error;
  }
}

/**
 * Get message history for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {object} options - { limit, skip }
 * @returns {array} - Messages
 */
async function getMessageHistory(conversationId, options = {}) {
  try {
    const { limit = 50, skip = 0 } = options;

    const messages = await Message.find({ conversation_id: conversationId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    logger.error('Error getting message history:', error);
    throw error;
  }
}

/**
 * Build context-aware prompt for Gemini
 * @param {string} conversationId - Conversation ID
 * @param {string} userMessage - Latest user message
 * @param {object} userContext - User context (mood, challenges)
 * @returns {string} - Formatted prompt for Gemini
 */
async function buildCoachPrompt(conversationId, userMessage, userContext = {}) {
  try {
    // Get recent conversation history (last 5 messages)
    const recentMessages = await Message.find({ conversation_id: conversationId })
      .sort({ created_at: -1 })
      .limit(10)
      .lean()
      .exec();

    const conversationHistory = recentMessages
      .reverse()
      .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are MoodLift's AI Micro Coach, a compassionate and supportive emotional wellness coach. Your role is to:
- Provide empathetic listening and validation
- Help users understand their emotions and mood patterns
- Suggest practical coping strategies and wellness exercises
- Encourage positive steps while being realistic about challenges
- Know when to suggest professional help for serious concerns
- Be warm, encouraging, and genuine

User Context:
- Current Mood: ${userContext.lastMoodScore || 'Not specified'}/10
- Recent Challenges: ${(userContext.currentChallenges || []).join(', ') || 'None shared'}

Previous Conversation:
${conversationHistory || 'Start of new conversation'}

User's Latest Message:
${userMessage}

Guidelines:
- Keep responses concise (1-3 paragraphs max)
- Ask thoughtful follow-up questions when appropriate
- Validate emotions before suggesting solutions
- Avoid being preachy or judgmental
- If user shows severe distress, encourage seeking professional help and provide crisis resources`;

    return systemPrompt;
  } catch (error) {
    logger.error('Error building coach prompt:', error);
    throw error;
  }
}

/**
 * Send a message in coaching conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @param {string} userMessage - User's message
 * @returns {object} - { userMessage, assistantResponse, flagged, riskData }
 */
async function sendCoachMessage(conversationId, userId, userMessage) {
  try {
    // Verify user owns conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user_id: userId,
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check for risk content in user message
    let riskData = null;
    const riskCheck = await detectAndFlagRisk(userId, userMessage, 'chat');
    if (riskCheck.flagged) {
      riskData = riskCheck;
    }

    // Save user message
    const userMsgDoc = await Message.create({
      conversation_id: conversationId,
      user_id: userId,
      role: 'user',
      content: userMessage,
      flagged_risk: riskData ? true : false,
      risk_flags: riskData ? riskData.indicators : [],
    });

    // Build context-aware prompt
    const prompt = await buildCoachPrompt(conversationId, userMessage, conversation.context);

    // Get response from Gemini
    let assistantResponse;
    try {
      assistantResponse = await callGeminiAPI(prompt);
    } catch (error) {
      logger.error('Error calling Gemini API:', error);
      assistantResponse = 'I\'m here to listen and support you. I encountered a brief technical issue, but please know that your wellbeing matters. Could you tell me more about what you\'re feeling right now?';
    }

    // Save assistant message
    const assistantMsgDoc = await Message.create({
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: assistantResponse,
      flagged_risk: false,
      risk_flags: [],
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        message_count: conversation.message_count + 2,
        last_message_at: new Date(),
      }
    );

    logger.info(`Coach message sent in conversation ${conversationId}`);

    return {
      userMessage: userMsgDoc.toObject(),
      assistantResponse: assistantMsgDoc.toObject(),
      flagged: riskData ? true : false,
      riskData,
    };
  } catch (error) {
    logger.error('Error in sendCoachMessage:', error);
    throw error;
  }
}

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 */
async function deleteConversation(conversationId, userId) {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      user_id: userId,
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Delete all messages in conversation
    await Message.deleteMany({ conversation_id: conversationId });

    logger.info(`Conversation ${conversationId} deleted`);
  } catch (error) {
    logger.error('Error deleting conversation:', error);
    throw error;
  }
}

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  getMessageHistory,
  buildCoachPrompt,
  sendCoachMessage,
  deleteConversation,
};
