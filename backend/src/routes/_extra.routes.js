/**
 * Insights, Notifications, and Analytics Routes
 */
const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth.middleware');
const { User, MoodEntry, JournalEntry, Notification } = require('../models');
const { setCache, getCache } = require('../config/redis');
const { serialize } = require('../utils/serialize');

const round = (value) => (typeof value === 'number' ? Math.round(value * 100) / 100 : 0);
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const insightRouter = express.Router();
const notifRouter = express.Router();
const analyticsRouter = express.Router();

insightRouter.use(authenticate);
notifRouter.use(authenticate);
analyticsRouter.use(authenticate);

insightRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `insights:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const previousSevenDaysAgo = new Date();
    previousSevenDaysAgo.setDate(previousSevenDaysAgo.getDate() - 14);

    const [moodTrend, streakData, topActivities, thisWeekAgg, lastWeekAgg] = await Promise.all([
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: { $gte: fourteenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$checked_in_at' } },
            avg_score: { $avg: '$mood_score' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.findById(userId).select('streak_count longest_streak').lean(),
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: { $gte: thirtyDaysAgo },
          },
        },
        { $unwind: { path: '$activities', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$activities', frequency: { $sum: 1 } } },
        { $sort: { frequency: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            avg_score: { $avg: '$mood_score' },
          },
        },
      ]),
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: {
              $gte: previousSevenDaysAgo,
              $lt: sevenDaysAgo,
            },
          },
        },
        {
          $group: {
            _id: null,
            avg_score: { $avg: '$mood_score' },
          },
        },
      ]),
    ]);

    const thisWeek = round(thisWeekAgg[0]?.avg_score);
    const lastWeek = round(lastWeekAgg[0]?.avg_score);
    const weekChange = round(thisWeek - lastWeek);

    const serializedTrend = moodTrend.map((item) => ({
      date: item._id,
      avg_score: round(item.avg_score),
    }));

    const serializedActivities = topActivities.map((item) => ({
      activity: item._id,
      frequency: item.frequency,
    }));

    const insights = [
      ...(weekChange > 0.5 ? [{
        type: 'positive',
        icon: 'uptrend',
        title: 'Mood improving!',
        message: `Your mood is ${weekChange.toFixed(1)} points higher this week than last week. Keep it up!`,
      }] : []),
      ...(streakData?.streak_count >= 7 ? [{
        type: 'achievement',
        icon: 'streak',
        title: `${streakData.streak_count}-day streak!`,
        message: "You've been consistently checking in. That consistency builds self-awareness.",
      }] : []),
      ...(serializedActivities.length > 0 ? [{
        type: 'info',
        icon: 'activity',
        title: 'Your top mood-booster',
        message: `"${serializedActivities[0].activity}" appears most often in your recent entries.`,
      }] : []),
    ];

    const data = {
      insights,
      moodTrend: serializedTrend,
      streak: serialize(streakData),
      weeklyComparison: {
        this_week: thisWeek,
        last_week: lastWeek,
      },
    };

    await setCache(cacheKey, data, 1800);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

notifRouter.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    const filter = { user_id: req.user.id };

    if (unread_only === 'true') {
      filter.is_read = false;
    }

    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      Notification.countDocuments({ user_id: req.user.id }),
      Notification.countDocuments({ user_id: req.user.id, is_read: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications: serialize(notifications),
        total,
        unread,
      },
    });
  } catch (err) {
    next(err);
  }
});

notifRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $set: { is_read: true, read_at: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

notifRouter.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { $set: { is_read: true, read_at: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `analytics:${userId}:overview`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [userStats, moodByDayOfWeekAgg, moodByTimeOfDayAgg, journalCount] = await Promise.all([
      User.findById(userId).select('streak_count longest_streak last_check_in').lean(),
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: { $gte: ninetyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $subtract: [{ $dayOfWeek: '$checked_in_at' }, 1] },
            avg_mood: { $avg: '$mood_score' },
            entries: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: { $gte: ninetyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $hour: '$checked_in_at' },
            avg_mood: { $avg: '$mood_score' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      JournalEntry.countDocuments({ user_id: userId }),
    ]);

    const data = {
      streak: serialize(userStats),
      moodByDayOfWeek: moodByDayOfWeekAgg.map((item) => ({
        day_name: dayNames[item._id],
        day_num: item._id,
        avg_mood: round(item.avg_mood),
        entries: item.entries,
      })),
      moodByTimeOfDay: moodByTimeOfDayAgg.map((item) => ({
        hour: item._id,
        avg_mood: round(item.avg_mood),
      })),
      totalJournalEntries: journalCount,
    };

    await setCache(cacheKey, data, 900);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = { insightRouter, notifRouter, analyticsRouter };
