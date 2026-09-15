/**
 * Analytics Routes
 */
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/events', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('event_type').optional().trim(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
], validate, analyticsController.getUserEvents);

router.get('/stats', [
  query('days').optional().isInt({ min: 1, max: 365 }),
], validate, analyticsController.getEventStats);

module.exports = router;
