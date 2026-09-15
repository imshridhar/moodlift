/**
 * Notification Routes
 */
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', async (req, res, next) => {
  try {
    const { Notification } = require('../models');
    const count = await Notification.countDocuments({ user_id: req.user.id, is_read: false });
    res.json({ success: true, data: { unread_count: count } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', [
  param('id').isMongoId(),
], validate, notificationController.markAsRead);

router.patch('/read-all', notificationController.markAllAsRead);

router.delete('/:id', [
  param('id').isMongoId(),
], validate, notificationController.deleteNotification);

module.exports = router;
