/**
 * Contextual Trigger Engine Service
 * Triggers interventions at the right moment based on context events
 */

const { ContextEvent, MoodEntry, Notification, Intervention } = require('../models');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

const recordContextEvent = async (userId, eventType, metadata = {}) => {
  try {
    const event = await ContextEvent.create({
      user_id: userId,
      event_type: eventType,
      metadata,
      trigger_fired: false,
    });

    await evaluateTriggers(userId, event._id);

    return event.toObject();
  } catch (error) {
    logger.error('Error recording context event:', error);
    throw error;
  }
};

const evaluateTriggers = async (userId, contextEventId) => {
  try {
    const contextEvent = await ContextEvent.findById(contextEventId).lean();
    if (!contextEvent || contextEvent.trigger_fired) {return;}

    let interventionId = null;
    let notificationTitle = '';
    let notificationMessage = '';

    switch (contextEvent.event_type) {
      case 'calendar_event': {
        const timeUntilEvent = contextEvent.metadata?.minutesUntil;
        if (timeUntilEvent === 10) {
          const breathingIntervention = await Intervention.findOne({
            type: 'breathing',
            is_active: true,
          }).lean();

          interventionId = breathingIntervention?._id;
          notificationTitle = 'Upcoming Event';
          notificationMessage = 'You have a meeting in 10 minutes. Try a quick breathing exercise to center yourself.';
        }
        break;
      }

      case 'mood_drop': {
        const recentMoods = await MoodEntry.find({ user_id: userId })
          .sort({ checked_in_at: -1 })
          .limit(3)
          .lean();

        if (recentMoods.length >= 2) {
          const avgRecent = recentMoods.reduce((sum, m) => sum + m.mood_score, 0) / recentMoods.length;
          if (avgRecent < 4) {
            const groundingIntervention = await Intervention.findOne({
              type: 'grounding',
              is_active: true,
            }).lean();

            interventionId = groundingIntervention?._id;
            notificationTitle = 'We Notice You Might Be Struggling';
            notificationMessage = 'Would you like to try a grounding exercise? It only takes a few minutes.';
          }
        }
        break;
      }

      case 'inactivity': {
        const lastMood = await MoodEntry.findOne({ user_id: userId })
          .sort({ checked_in_at: -1 })
          .lean();

        if (lastMood) {
          const daysSinceCheckin = (Date.now() - new Date(lastMood.checked_in_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCheckin >= 2) {
            notificationTitle = 'We Miss You!';
            notificationMessage = 'It\'s been a few days. Take a moment to check in with yourself.';
          }
        }
        break;
      }

      case 'time_based': {
        notificationTitle = 'Daily Check-in Time';
        notificationMessage = 'How are you feeling right now? Take a moment to check in.';
        break;
      }

      default:
        break;
    }

    if (notificationTitle) {
      await Notification.create({
        user_id: userId,
        type: 'contextual_trigger',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          context_event_id: contextEventId,
          intervention_id: interventionId,
        },
        is_read: false,
      });

      await ContextEvent.findByIdAndUpdate(contextEventId, {
        $set: {
          trigger_fired: true,
          triggered_intervention_id: interventionId,
        },
      });

      logger.info(`Contextual trigger fired for user ${userId}: ${contextEvent.event_type}`);
    }
  } catch (error) {
    logger.error('Error evaluating triggers:', error);
  }
};

const getContextEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, event_type } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const filter = { user_id: userId };
    if (event_type) {filter.event_type = event_type;}

    const [events, total] = await Promise.all([
      ContextEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      ContextEvent.countDocuments(filter),
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

module.exports = {
  recordContextEvent,
  evaluateTriggers,
  getContextEvents,
};
