/**
 * Insights Routes
 */
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const insightsController = require('../controllers/insights.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/mood', [
  query('period').optional().isInt({ min: 1, max: 365 }),
], validate, insightsController.getMoodInsights);

router.get('/daily', [
  query('date').optional().isISO8601(),
  query('days').optional().isInt({ min: 1, max: 90 }),
], validate, insightsController.getDailyStats);

module.exports = router;
