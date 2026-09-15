const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  getActiveChallengesController,
  getChallengeController,
  createChallengeController,
  joinChallengeController,
  getUserChallengesController,
  getUserChallengeProgressController,
  updateProgressController,
  getLeaderboardController,
  abandonChallengeController,
} = require('../controllers/challenge.controller');

const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/challenges
 * List active challenges with filters
 */
router.get(
  '/',
  validate([
    query('category').optional().isString().trim(),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
  ]),
  getActiveChallengesController
);

/**
 * POST /api/v1/challenges
 * Create new challenge (admin only in future)
 */
router.post(
  '/',
  validate([
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be 1-200 characters'),
    body('description')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Description must be 1-2000 characters'),
    body('category').trim().isLength({ min: 1, max: 50 }),
    body('durationDays').isInt({ min: 1 }).withMessage('Duration days must be positive'),
    body('goal').isInt({ min: 1 }).withMessage('Goal must be positive'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard']),
    body('isRecurring').optional().isBoolean(),
  ]),
  createChallengeController
);

/**
 * GET /api/v1/challenges/my
 * Get user's challenges
 */
router.get(
  '/my',
  validate([
    query('status').optional().isIn(['active', 'completed', 'abandoned']),
  ]),
  getUserChallengesController
);

/**
 * GET /api/v1/challenges/:id
 * Get specific challenge
 */
router.get(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid challenge ID')]),
  getChallengeController
);

/**
 * POST /api/v1/challenges/:id/join
 * Join a challenge
 */
router.post(
  '/:id/join',
  validate([param('id').isMongoId().withMessage('Invalid challenge ID')]),
  joinChallengeController
);

/**
 * GET /api/v1/challenges/:id/my-progress
 * Get user's progress on specific challenge
 */
router.get(
  '/:id/my-progress',
  validate([param('id').isMongoId().withMessage('Invalid challenge ID')]),
  getUserChallengeProgressController
);

/**
 * POST /api/v1/challenges/:id/progress
 * Update progress
 */
router.post(
  '/:id/progress',
  validate([
    param('id').isMongoId().withMessage('Invalid challenge ID'),
    body('progressDelta')
      .isInt({ min: 0 })
      .withMessage('Progress delta must be non-negative'),
  ]),
  updateProgressController
);

/**
 * GET /api/v1/challenges/:id/leaderboard
 * Get challenge leaderboard
 */
router.get(
  '/:id/leaderboard',
  validate([
    param('id').isMongoId().withMessage('Invalid challenge ID'),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
  ]),
  getLeaderboardController
);

/**
 * PATCH /api/v1/challenges/:id/abandon
 * Abandon a challenge
 */
router.patch(
  '/:id/abandon',
  validate([param('id').isMongoId().withMessage('Invalid challenge ID')]),
  abandonChallengeController
);

module.exports = router;
