/**
 * Search Routes
 */
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.get('/', [
  query('q').optional().trim().isLength({ min: 2 }),
  query('type').optional().isIn(['all', 'interventions', 'playbooks']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], validate, optionalAuth, searchController.search);

module.exports = router;
