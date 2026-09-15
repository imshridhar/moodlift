/**
 * Analytics Event Service
 * Tracks user behavior events for analysis
 */

const { AnalyticsEvent } = require('../models');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

const trackEvent = async (userId, eventType, metadata = {}, source = 'api') => {
  try {
    const event = await AnalyticsEvent.create({
      user_id: userId,
      event_type: eventType,
      metadata,
      source,
      timestamp: new Date(),
    });

    return event.toObject();
  } catch (error) {
    logger.error('Error tracking event:', error);
    throw error;
  }
};

const getUserEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, event_type, from, to } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const filter = { user_id: userId };
    if (event_type) {filter.event_type = event_type;}
    if (from || to) {
      filter.timestamp = {};
      if (from) {filter.timestamp.$gte = new Date(from);}
      if (to) {filter.timestamp.$lte = new Date(to);}
    }

    const [events, total] = await Promise.all([
      AnalyticsEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      AnalyticsEvent.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        events: serialize(events),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEventStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));

    const stats = await AnalyticsEvent.aggregate([
      { $match: { user_id: userId, timestamp: { $gte: sinceDate } } },
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalEvents = await AnalyticsEvent.countDocuments({
      user_id: userId,
      timestamp: { $gte: sinceDate },
    });

    res.json({
      success: true,
      data: {
        event_counts: stats.map(s => ({ event_type: s._id, count: s.count })),
        total_events: totalEvents,
        period_days: parseInt(days, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  trackEvent,
  getUserEvents,
  getEventStats,
};
