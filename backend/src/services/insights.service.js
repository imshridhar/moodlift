/**
 * Insights Service
 * Analyzes behavioral patterns and mood trends
 */

const mongoose = require('mongoose');
const { MoodEntry, JournalEntry, DailyStats } = require('../models');
const { serialize } = require('../utils/serialize');
const { setCache, getCache } = require('../config/redis');
const { logger } = require('../utils/logger');

const getMoodInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;
    const days = parseInt(period, 10);

    const cacheKey = `insights:${userId}:mood:${period}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const [moodTrend, moodDistribution, topTriggers, topActivities, weeklyPattern] = await Promise.all([
      MoodEntry.aggregate([
        { $match: { user_id: objectUserId, checked_in_at: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$checked_in_at' } },
            avg_mood: { $avg: '$mood_score' },
            avg_energy: { $avg: '$energy_level' },
            avg_anxiety: { $avg: '$anxiety_level' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MoodEntry.aggregate([
        { $match: { user_id: objectUserId, checked_in_at: { $gte: sinceDate } } },
        { $group: { _id: '$mood_score', count: { $sum: 1 }, avg_energy: { $avg: '$energy_level' } } },
        { $sort: { _id: 1 } },
      ]),
      MoodEntry.aggregate([
        { $match: { user_id: objectUserId, checked_in_at: { $gte: sinceDate } } },
        { $unwind: { path: '$triggers', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$triggers', count: { $sum: 1 }, avg_mood: { $avg: '$mood_score' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      MoodEntry.aggregate([
        { $match: { user_id: objectUserId, checked_in_at: { $gte: sinceDate } } },
        { $unwind: { path: '$activities', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$activities', count: { $sum: 1 }, avg_mood: { $avg: '$mood_score' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      MoodEntry.aggregate([
        { $match: { user_id: objectUserId, checked_in_at: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dayOfWeek: '$checked_in_at' },
            avg_mood: { $avg: '$mood_score' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const data = {
      mood_trend: moodTrend.map(t => ({
        date: t._id,
        avg_mood: Math.round(t.avg_mood * 100) / 100,
        avg_energy: t.avg_energy ? Math.round(t.avg_energy * 100) / 100 : null,
        avg_anxiety: t.avg_anxiety ? Math.round(t.avg_anxiety * 100) / 100 : null,
        count: t.count,
      })),
      mood_distribution: moodDistribution.map(d => ({
        mood_score: d._id,
        count: d.count,
        avg_energy: d.avg_energy ? Math.round(d.avg_energy * 100) / 100 : null,
      })),
      top_triggers: topTriggers.map(t => ({
        trigger: t._id,
        count: t.count,
        avg_mood: Math.round(t.avg_mood * 100) / 100,
      })),
      top_activities: topActivities.map(a => ({
        activity: a._id,
        count: a.count,
        avg_mood: Math.round(a.avg_mood * 100) / 100,
      })),
      weekly_pattern: weeklyPattern.map(w => ({
        day_of_week: w._id,
        avg_mood: Math.round(w.avg_mood * 100) / 100,
        count: w.count,
      })),
      period_days: days,
    };

    await setCache(cacheKey, data, 600);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDailyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
      const { days = 7 } = req.query;
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));

      const stats = await DailyStats.find({
        user_id: userId,
        date: { $gte: sinceDate.toISOString().split('T')[0] },
      })
        .sort({ date: -1 })
        .lean();

      return res.json({ success: true, data: { stats: serialize(stats) } });
    }

    const stat = await DailyStats.findOne({ user_id: userId, date }).lean();

    res.json({ success: true, data: { stat: serialize(stat) } });
  } catch (error) {
    next(error);
  }
};

const computeDailyStats = async (userId, dateStr) => {
  try {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [moodStats, journalCount] = await Promise.all([
      MoodEntry.aggregate([
        {
          $match: {
            user_id: objectUserId,
            checked_in_at: { $gte: dayStart, $lt: dayEnd },
          },
        },
        {
          $group: {
            _id: null,
            avg_mood: { $avg: '$mood_score' },
            count: { $sum: 1 },
          },
        },
      ]),
      JournalEntry.countDocuments({
        user_id: userId,
        created_at: { $gte: dayStart, $lt: dayEnd },
      }),
    ]);

    const avgMood = moodStats[0]?.avg_mood || null;
    const moodCount = moodStats[0]?.count || 0;

    await DailyStats.findOneAndUpdate(
      { user_id: userId, date: dateStr },
      {
        $set: {
          avg_mood: avgMood ? Math.round(avgMood * 100) / 100 : null,
          mood_entries_count: moodCount,
          journal_count: journalCount,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    logger.error('Error computing daily stats:', error);
  }
};

module.exports = {
  getMoodInsights,
  getDailyStats,
  computeDailyStats,
};
