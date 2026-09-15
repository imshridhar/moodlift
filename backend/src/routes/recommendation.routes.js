/**
 * Recommendation Routes
 */
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const recommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', recommendationController.getRecommendations);

router.patch('/:id/complete', [
  param('id').isMongoId(),
], validate, recommendationController.completeRecommendation);

router.patch('/:id/dismiss', [
  param('id').isMongoId(),
], validate, recommendationController.dismissRecommendation);

module.exports = router;
