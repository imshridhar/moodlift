/**
 * Notification Controller
 */

const notificationService = require('../services/notification.service');

module.exports = {
  getNotifications: notificationService.getNotifications,
  markAsRead: notificationService.markAsRead,
  markAllAsRead: notificationService.markAllAsRead,
  deleteNotification: notificationService.deleteNotification,
};
