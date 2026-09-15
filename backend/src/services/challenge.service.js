const { Challenge, ChallengeParticipant } = require('../models');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all active challenges
 * @param {object} filters - { category, difficulty, limit, skip }
 * @returns {array} - Challenges
 */
async function getActiveChallenges(filters = {}) {
  try {
    const { category, difficulty, limit = 20, skip = 0 } = filters;

    const query = { is_active: true };
    if (category) {query.category = category;}
    if (difficulty) {query.difficulty = difficulty;}

    const challenges = await Challenge.find(query)
      .populate('creator_id', 'full_name username avatar_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return challenges;
  } catch (error) {
    logger.error('Error getting active challenges:', error);
    throw error;
  }
}

/**
 * Get specific challenge with details
 * @param {string} challengeId - Challenge ID
 * @returns {object} - Challenge details
 */
async function getChallenge(challengeId) {
  try {
    const challenge = await Challenge.findById(challengeId)
      .populate('creator_id', 'full_name username avatar_url')
      .lean();

    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }

    return challenge;
  } catch (error) {
    logger.error('Error getting challenge:', error);
    throw error;
  }
}

/**
 * Create a new challenge
 * @param {string} creatorId - Creator user ID
 * @param {object} data - Challenge data
 * @returns {object} - Created challenge
 */
async function createChallenge(creatorId, data) {
  try {
    const {
      title,
      description,
      category,
      durationDays,
      goal,
      difficulty,
      isRecurring,
      reward,
    } = data;

    const challenge = await Challenge.create({
      title,
      description,
      category,
      duration_days: durationDays,
      goal,
      creator_id: creatorId,
      difficulty,
      is_recurring: isRecurring || false,
      reward,
      is_active: true,
      start_date: new Date(),
      end_date: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      participant_count: 0,
    });

    logger.info(`Challenge ${challenge._id} created by user ${creatorId}`);
    return challenge.toObject();
  } catch (error) {
    logger.error('Error creating challenge:', error);
    throw error;
  }
}

/**
 * Join a challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {object} - Challenge participant entry
 */
async function joinChallenge(userId, challengeId) {
  try {
    // Check if challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }

    // Check if already joined
    const existing = await ChallengeParticipant.findOne({
      user_id: userId,
      challenge_id: challengeId,
      status: 'active',
    });

    if (existing) {
      return existing.toObject();
    }

    // Create participant entry
    const participant = await ChallengeParticipant.create({
      challenge_id: challengeId,
      user_id: userId,
      progress: 0,
      progress_percent: 0,
      joined_at: new Date(),
      status: 'active',
    });

    // Update challenge participant count
    await Challenge.findByIdAndUpdate(
      challengeId,
      { participant_count: challenge.participant_count + 1 }
    );

    logger.info(`User ${userId} joined challenge ${challengeId}`);
    return participant.toObject();
  } catch (error) {
    logger.error('Error joining challenge:', error);
    throw error;
  }
}

/**
 * Get user's challenges
 * @param {string} userId - User ID
 * @param {string} status - Filter by status
 * @returns {array} - User's challenges
 */
async function getUserChallenges(userId, status = null) {
  try {
    const query = { user_id: userId };
    if (status) {query.status = status;}

    const userChallenges = await ChallengeParticipant.find(query)
      .populate('challenge_id')
      .sort({ joined_at: -1 })
      .lean()
      .exec();

    return userChallenges;
  } catch (error) {
    logger.error('Error getting user challenges:', error);
    throw error;
  }
}

/**
 * Get user's progress on a specific challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {object} - User's progress
 */
async function getUserChallengeProgress(userId, challengeId) {
  try {
    const participant = await ChallengeParticipant.findOne({
      user_id: userId,
      challenge_id: challengeId,
    })
      .populate('challenge_id')
      .lean();

    if (!participant) {
      throw new NotFoundError('User not participating in this challenge');
    }

    return participant;
  } catch (error) {
    logger.error('Error getting user challenge progress:', error);
    throw error;
  }
}

/**
 * Update challenge participant progress
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @param {number} progressDelta - Amount to add to progress
 * @returns {object} - Updated participant
 */
async function updateProgress(userId, challengeId, progressDelta) {
  try {
    const participant = await ChallengeParticipant.findOne({
      user_id: userId,
      challenge_id: challengeId,
      status: 'active',
    });

    if (!participant) {
      throw new NotFoundError('User not participating in this challenge');
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }

    // Update progress
    participant.progress += progressDelta;
    participant.progress_percent = Math.min(
      Math.round((participant.progress / challenge.goal) * 100),
      100
    );

    // Check if completed
    if (participant.progress >= challenge.goal) {
      participant.status = 'completed';
      participant.completed_at = new Date();
    }

    await participant.save();

    logger.info(`User ${userId} progress updated on challenge ${challengeId}`);
    return participant.toObject();
  } catch (error) {
    logger.error('Error updating progress:', error);
    throw error;
  }
}

/**
 * Get challenge leaderboard
 * @param {string} challengeId - Challenge ID
 * @param {number} limit - Number of top participants to return
 * @returns {array} - Leaderboard
 */
async function getLeaderboard(challengeId, limit = 100) {
  try {
    const leaderboard = await ChallengeParticipant.find({ challenge_id: challengeId })
      .populate('user_id', 'full_name username avatar_url')
      .sort({ progress_percent: -1, progress: -1, joined_at: 1 })
      .limit(limit)
      .lean()
      .exec();

    // Add rankings
    const ranked = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return ranked;
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    throw error;
  }
}

/**
 * Get user's rank on a challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {number} - User's rank
 */
async function getUserRank(userId, challengeId) {
  try {
    const user = await ChallengeParticipant.findOne({
      user_id: userId,
      challenge_id: challengeId,
    });

    if (!user) {
      throw new NotFoundError('User not participating in this challenge');
    }

    const betterCount = await ChallengeParticipant.countDocuments({
      challenge_id: challengeId,
      progress_percent: { $gt: user.progress_percent },
    });

    return betterCount + 1;
  } catch (error) {
    logger.error('Error getting user rank:', error);
    throw error;
  }
}

/**
 * Abandon a challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {object} - Updated participant
 */
async function abandonChallenge(userId, challengeId) {
  try {
    const participant = await ChallengeParticipant.findOneAndUpdate(
      {
        user_id: userId,
        challenge_id: challengeId,
        status: 'active',
      },
      {
        status: 'abandoned',
        updated_at: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!participant) {
      throw new NotFoundError('User not participating or already completed');
    }

    logger.info(`User ${userId} abandoned challenge ${challengeId}`);
    return participant.toObject();
  } catch (error) {
    logger.error('Error abandoning challenge:', error);
    throw error;
  }
}

module.exports = {
  getActiveChallenges,
  getChallenge,
  createChallenge,
  joinChallenge,
  getUserChallenges,
  getUserChallengeProgress,
  updateProgress,
  getLeaderboard,
  getUserRank,
  abandonChallenge,
};
