const challengeService = require('../services/challenge.service');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

/**
 * Get active challenges
 */
async function getActiveChallengesController(req, res, next) {
  try {
    const { category, difficulty, limit, skip } = req.query;

    const challenges = await challengeService.getActiveChallenges({
      category,
      difficulty,
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0,
    });

    res.json({
      success: true,
      data: challenges.map(c => serialize(c)),
    });
  } catch (error) {
    logger.error('Error in getActiveChallengesController:', error);
    next(error);
  }
}

/**
 * Get specific challenge
 */
async function getChallengeController(req, res, next) {
  try {
    const challengeId = req.params.id;
    const challenge = await challengeService.getChallenge(challengeId);

    res.json({
      success: true,
      data: serialize(challenge),
    });
  } catch (error) {
    logger.error('Error in getChallengeController:', error);
    next(error);
  }
}

/**
 * Create new challenge
 */
async function createChallengeController(req, res, next) {
  try {
    const { title, description, category, durationDays, goal, difficulty, isRecurring, reward } = req.body;
    const creatorId = req.user.id;

    const challenge = await challengeService.createChallenge(creatorId, {
      title,
      description,
      category,
      durationDays,
      goal,
      difficulty,
      isRecurring,
      reward,
    });

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: serialize(challenge),
    });
  } catch (error) {
    logger.error('Error in createChallengeController:', error);
    next(error);
  }
}

/**
 * Join challenge
 */
async function joinChallengeController(req, res, next) {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    const participant = await challengeService.joinChallenge(userId, challengeId);

    res.status(201).json({
      success: true,
      message: 'Successfully joined challenge',
      data: serialize(participant),
    });
  } catch (error) {
    logger.error('Error in joinChallengeController:', error);
    next(error);
  }
}

/**
 * Get user's challenges
 */
async function getUserChallengesController(req, res, next) {
  try {
    const userId = req.user.id;
    const status = req.query.status;

    const challenges = await challengeService.getUserChallenges(userId, status);

    res.json({
      success: true,
      data: challenges.map(c => ({
        ...serialize(c),
        challenge: serialize(c.challenge_id),
      })),
    });
  } catch (error) {
    logger.error('Error in getUserChallengesController:', error);
    next(error);
  }
}

/**
 * Get user's progress on challenge
 */
async function getUserChallengeProgressController(req, res, next) {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    const progress = await challengeService.getUserChallengeProgress(userId, challengeId);

    res.json({
      success: true,
      data: {
        ...serialize(progress),
        challenge: serialize(progress.challenge_id),
      },
    });
  } catch (error) {
    logger.error('Error in getUserChallengeProgressController:', error);
    next(error);
  }
}

/**
 * Update progress
 */
async function updateProgressController(req, res, next) {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;
    const { progressDelta } = req.body;

    const updated = await challengeService.updateProgress(userId, challengeId, progressDelta);

    res.json({
      success: true,
      message: 'Progress updated',
      data: serialize(updated),
    });
  } catch (error) {
    logger.error('Error in updateProgressController:', error);
    next(error);
  }
}

/**
 * Get leaderboard
 */
async function getLeaderboardController(req, res, next) {
  try {
    const challengeId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

    const leaderboard = await challengeService.getLeaderboard(challengeId, limit);

    // Get user's rank
    let userRank = null;
    try {
      userRank = await challengeService.getUserRank(req.user.id, challengeId);
    } catch (e) {
      // User might not be participating
    }

    res.json({
      success: true,
      data: leaderboard.map(entry => ({
        ...serialize(entry),
        user: serialize(entry.user_id),
      })),
      user_rank: userRank,
    });
  } catch (error) {
    logger.error('Error in getLeaderboardController:', error);
    next(error);
  }
}

/**
 * Abandon challenge
 */
async function abandonChallengeController(req, res, next) {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    const updated = await challengeService.abandonChallenge(userId, challengeId);

    res.json({
      success: true,
      message: 'Challenge abandoned',
      data: serialize(updated),
    });
  } catch (error) {
    logger.error('Error in abandonChallengeController:', error);
    next(error);
  }
}

module.exports = {
  getActiveChallengesController,
  getChallengeController,
  createChallengeController,
  joinChallengeController,
  getUserChallengesController,
  getUserChallengeProgressController,
  updateProgressController,
  getLeaderboardController,
  abandonChallengeController,
};
