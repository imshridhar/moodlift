/**
 * Admin Dashboard Routes
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../services/admin.service');
const validate = require('../middleware/validate');

router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUserStats);
router.get('/crisis', adminController.getCrisisOverview);

router.patch('/flags/:id/review', [
  param('id').isMongoId(),
  body('action').notEmpty().isString(),
], validate, adminController.reviewRiskFlag);

router.patch('/users/:id/status', [
  param('id').isMongoId(),
  body('is_active').isBoolean(),
], validate, adminController.toggleUserStatus);

module.exports = router;
