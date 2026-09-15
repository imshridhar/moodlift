const coachService = require('../services/coach.service');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

/**
 * Create a new coaching conversation
 */
async function createConversationController(req, res, next) {
  try {
    const { title, lastMoodScore, challenges } = req.body;
    const userId = req.user.id;

    const conversation = await coachService.createConversation(userId, {
      title,
      lastMoodScore,
      challenges,
    });

    res.status(201).json({
      success: true,
      data: serialize(conversation),
    });
  } catch (error) {
    logger.error('Error in createConversationController:', error);
    next(error);
  }
}

/**
 * Get user's conversations
 */
async function getConversationsController(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = parseInt(req.query.skip) || 0;

    const conversations = await coachService.getConversations(userId, { limit, skip });

    res.json({
      success: true,
      data: conversations.map(c => serialize(c)),
      pagination: { limit, skip, total: conversations.length },
    });
  } catch (error) {
    logger.error('Error in getConversationsController:', error);
    next(error);
  }
}

/**
 * Get specific conversation
 */
async function getConversationController(req, res, next) {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    const conversation = await coachService.getConversation(conversationId, userId);

    res.json({
      success: true,
      data: {
        ...serialize(conversation),
        messages: conversation.messages.map(m => serialize(m)),
      },
    });
  } catch (error) {
    logger.error('Error in getConversationController:', error);
    next(error);
  }
}

/**
 * Send a message in coaching conversation
 */
async function sendMessageController(req, res, next) {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    const result = await coachService.sendCoachMessage(conversationId, userId, content);

    // If high-risk content detected, include warning in response
    if (result.flagged && result.riskData?.severity === 'high') {
      res.status(200).json({
        success: true,
        data: {
          userMessage: serialize(result.userMessage),
          assistantResponse: serialize(result.assistantResponse),
        },
        warning: {
          type: 'risk_detected',
          message: 'High-risk content detected. Please reach out to a professional if you\'re in crisis.',
          severity: result.riskData.severity,
          resources: {
            us_suicide_prevention_lifeline: '988',
            crisis_text_line: 'Text HOME to 741741',
            international_association_for_suicide_prevention: 'https://www.iasp.info/resources/Crisis_Centres/',
          },
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          userMessage: serialize(result.userMessage),
          assistantResponse: serialize(result.assistantResponse),
        },
      });
    }
  } catch (error) {
    logger.error('Error in sendMessageController:', error);
    next(error);
  }
}

/**
 * Delete a conversation
 */
async function deleteConversationController(req, res, next) {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    await coachService.deleteConversation(conversationId, userId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteConversationController:', error);
    next(error);
  }
}

module.exports = {
  createConversationController,
  getConversationsController,
  getConversationController,
  sendMessageController,
  deleteConversationController,
};
