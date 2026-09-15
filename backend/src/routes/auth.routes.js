/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number');

router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username').isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters'),
  passwordRules,
  body('full_name').optional().trim().isLength({ max: 100 }),
], validate, authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, authController.login);

router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, authController.forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), passwordRules], validate, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);
router.get('/verify-email/:token', [param('token').isUUID()], validate, authController.verifyEmail);

module.exports = router;
