const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  getPlaybooksController,
  getPlaybookController,
  enrollPlaybookController,
  getUserPlaybooksController,
  getUserPlaybookProgressController,
  completeLessonController,
  abandonPlaybookController,
  getLessonController,
} = require('../controllers/playbook.controller');

const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/playbooks
 * List all active playbooks with filters
 */
router.get(
  '/',
  validate([
    query('category').optional().isString().trim(),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
  ]),
  getPlaybooksController
);

/**
 * GET /api/v1/playbooks/my
 * Get user's playbooks
 */
router.get(
  '/my',
  validate([
    query('status').optional().isIn(['active', 'completed', 'abandoned']),
  ]),
  getUserPlaybooksController
);

/**
 * GET /api/v1/playbooks/:id
 * Get specific playbook with lessons
 */
router.get(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid playbook ID')]),
  getPlaybookController
);

/**
 * POST /api/v1/playbooks/:id/enroll
 * Enroll in a playbook
 */
router.post(
  '/:id/enroll',
  validate([param('id').isMongoId().withMessage('Invalid playbook ID')]),
  enrollPlaybookController
);

/**
 * GET /api/v1/playbooks/:id/my-progress
 * Get user's progress on specific playbook
 */
router.get(
  '/:id/my-progress',
  validate([param('id').isMongoId().withMessage('Invalid playbook ID')]),
  getUserPlaybookProgressController
);

/**
 * POST /api/v1/playbooks/:id/lessons/:day/complete
 * Mark lesson as complete
 */
router.post(
  '/:id/lessons/:day/complete',
  validate([
    param('id').isMongoId().withMessage('Invalid playbook ID'),
    param('day').isInt({ min: 1 }).withMessage('Day must be a positive integer'),
  ]),
  completeLessonController
);

/**
 * GET /api/v1/playbooks/:id/lessons/:day
 * Get specific lesson
 */
router.get(
  '/:id/lessons/:day',
  validate([
    param('id').isMongoId().withMessage('Invalid playbook ID'),
    param('day').isInt({ min: 1 }).withMessage('Day must be a positive integer'),
  ]),
  getLessonController
);

/**
 * PATCH /api/v1/playbooks/:id/abandon
 * Abandon a playbook
 */
router.patch(
  '/:id/abandon',
  validate([param('id').isMongoId().withMessage('Invalid playbook ID')]),
  abandonPlaybookController
);

module.exports = router;
