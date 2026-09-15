/**
 * Mood Routes
 */
const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const moodController = require('../controllers/mood.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/', [
  body('mood_score').isInt({ min: 1, max: 10 }).withMessage('Mood score must be 1-10'),
  body('mood_label').notEmpty().isLength({ max: 50 }),
  body('mood_emoji').optional().isLength({ max: 10 }),
  body('energy_level').optional().isInt({ min: 1, max: 5 }),
  body('anxiety_level').optional().isInt({ min: 1, max: 5 }),
  body('sleep_hours').optional().isFloat({ min: 0, max: 24 }),
  body('activities').optional().isArray(),
  body('triggers').optional().isArray(),
  body('notes').optional().isLength({ max: 2000 }),
], validate, moodController.createMoodEntry);

router.get('/', moodController.getMoodHistory);
router.get('/today', moodController.getTodayMood);
router.get('/stats/summary', moodController.getMoodStats);
router.get('/:id', [param('id').isMongoId()], validate, moodController.getMoodEntry);
router.put('/:id', [param('id').isMongoId()], validate, moodController.updateMoodEntry);
router.delete('/:id', [param('id').isMongoId()], validate, moodController.deleteMoodEntry);

module.exports = router;
