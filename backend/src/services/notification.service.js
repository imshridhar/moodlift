/**
 * Notification Service
 * Manages reminders, motivational nudges, and system notifications
 */

const { Notification, UserProfile } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { serialize } = require('../utils/serialize');
const { setCache, getCache, deleteCachePattern } = require('../config/redis');
const { logger } = require('../utils/logger');

const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data,
      is_read: false,
    });

    await deleteCachePattern(`notifications:${userId}:*`);
    return notification.toObject();
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const cacheKey = `notifications:${userId}:${page}:${limit}:${unread_only || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const filter = { user_id: userId };
    if (unread_only === 'true') {filter.is_read = false;}

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user_id: userId, is_read: false }),
    ]);

    const data = {
      notifications: serialize(notifications),
      unread_count: unreadCount,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };

    await setCache(cacheKey, data, 300);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id, is_read: false },
      { $set: { is_read: true, read_at: new Date() } },
      { returnDocument: 'after' }
    ).lean();

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    await deleteCachePattern(`notifications:${req.user.id}:*`);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { $set: { is_read: true, read_at: new Date() } }
    );

    await deleteCachePattern(`notifications:${req.user.id}:*`);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    await deleteCachePattern(`notifications:${req.user.id}:*`);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

const scheduleDailyReminder = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ user_id: userId }).lean();
    const reminderTime = profile?.preferred_checkin_time || '09:00';

    await createNotification(
      userId,
      'daily_reminder',
      'Daily Check-in Reminder',
      'Take a moment to check in with yourself. How are you feeling today?',
      { reminder_time: reminderTime }
    );
  } catch (error) {
    logger.error('Error scheduling daily reminder:', error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  scheduleDailyReminder,
};
