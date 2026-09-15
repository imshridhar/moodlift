/**
 * User Profile Routes
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', profileController.getProfile);

router.put('/', [
  body('name').optional().trim().isLength({ max: 100 }),
  body('goals').optional().isArray(),
  body('preferred_checkin_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('timezone').optional().trim(),
  body('settings').optional().isObject(),
  body('avatar_url').optional().trim().isURL(),
], validate, profileController.updateProfile);

router.delete('/', profileController.deleteProfile);

module.exports = router;
