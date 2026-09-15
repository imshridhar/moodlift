/**
 * Intervention Library Routes
 */
const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const interventionController = require('../controllers/intervention.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['breathing', 'meditation', 'grounding', 'visualization', 'journaling', 'movement']),
  query('category').optional().trim(),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
], validate, optionalAuth, interventionController.getInterventions);

router.get('/:id', [
  param('id').isMongoId(),
], validate, optionalAuth, interventionController.getIntervention);

module.exports = router;
