/**
 * Contextual Trigger Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const triggerController = require('../controllers/trigger.controller');

router.use(authenticate);

router.get('/', triggerController.getContextEvents);

module.exports = router;
