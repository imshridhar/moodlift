const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  createConversationController,
  getConversationsController,
  getConversationController,
  sendMessageController,
  deleteConversationController,
} = require('../controllers/coach.controller');

const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { safetyCheckMiddleware } = require('../middleware/safety.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/coach/conversations
 * Create a new coaching conversation
 */
router.post(
  '/conversations',
  validate([
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('lastMoodScore').optional().isInt({ min: 1, max: 10 }),
    body('challenges').optional().isArray(),
  ]),
  createConversationController
);

/**
 * GET /api/v1/coach/conversations
 * List user's coaching conversations
 */
router.get(
  '/conversations',
  validate([
    // Pagination handled as query params, typically not validated with body
  ]),
  getConversationsController
);

/**
 * GET /api/v1/coach/conversations/:id
 * Get specific conversation with all messages
 */
router.get(
  '/conversations/:id',
  validate([param('id').isMongoId().withMessage('Invalid conversation ID')]),
  getConversationController
);

/**
 * POST /api/v1/coach/conversations/:id/messages
 * Send a message in a conversation
 */
router.post(
  '/conversations/:id/messages',
  validate([
    param('id').isMongoId().withMessage('Invalid conversation ID'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
  ]),
  safetyCheckMiddleware,
  sendMessageController
);

/**
 * DELETE /api/v1/coach/conversations/:id
 * Delete a conversation
 */
router.delete(
  '/conversations/:id',
  validate([param('id').isMongoId().withMessage('Invalid conversation ID')]),
  deleteConversationController
);

module.exports = router;
