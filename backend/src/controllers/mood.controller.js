/**
 * Mood Entries Controller
 */

const mongoose = require('mongoose');
const { MoodEntry, User } = require('../models');
const { setCache, getCache, deleteCachePattern } = require('../config/redis');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { analyzeMoodEntry } = require('../services/ai.service');
const { serialize } = require('../utils/serialize');

const round = (value) => (typeof value === 'number' ? Math.round(value * 100) / 100 : null);

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const endOfToday = () => {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
};

/**
 * POST /moods - Create mood entry
 */
const createMoodEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      mood_score, mood_label, mood_emoji, energy_level, anxiety_level,
      sleep_hours, activities, triggers, notes, location_context, weather_context,
    } = req.body;

    const aiAnalysis = await analyzeMoodEntry({
      mood_score,
      mood_label,
      energy_level,
      anxiety_level,
      sleep_hours,
      activities,
      triggers,
      notes,
    });

    const entry = await MoodEntry.create({
      user_id: userId,
      mood_score,
      mood_label,
      mood_emoji,
      energy_level,
      anxiety_level,
      sleep_hours,
      activities: activities || [],
      triggers: triggers || [],
      notes,
      location_context,
      weather_context,
      ai_analysis: aiAnalysis || undefined,
    });

    await updateStreak(userId);
    await checkMoodAchievements(userId);
    await deleteCachePattern(`mood:${userId}:*`);
    await deleteCachePattern(`analytics:${userId}:*`);
    await deleteCachePattern(`insights:${userId}`);

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      data: { entry: serialize(entry) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /moods - Get user's mood history
 */
const getMoodHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, from, to, mood_score } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const cacheKey = `mood:${userId}:history:${page}:${limit}:${from}:${to}:${mood_score || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const filter = { user_id: userId };

    if (from || to) {
      filter.checked_in_at = {};
      if (from) {filter.checked_in_at.$gte = new Date(from);}
      if (to) {filter.checked_in_at.$lte = new Date(to);}
    }

    if (mood_score) {
      filter.mood_score = parseInt(mood_score, 10);
    }

    const [entries, total] = await Promise.all([
      MoodEntry.find(filter)
        .sort({ checked_in_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      MoodEntry.countDocuments(filter),
    ]);

    const data = {
      entries: serialize(entries),
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

/**
 * GET /moods/today - Get today's mood entry
 */
const getTodayMood = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findOne({
      user_id: req.user.id,
      checked_in_at: {
        $gte: startOfToday(),
        $lt: endOfToday(),
      },
    })
      .sort({ checked_in_at: -1 })
      .lean();

    res.json({ success: true, data: { entry: serialize(entry) } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /moods/:id - Get single mood entry
 */
const getMoodEntry = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!entry) {
      throw new NotFoundError('Mood entry');
    }

    res.json({ success: true, data: { entry: serialize(entry) } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /moods/:id - Update mood entry
 */
const updateMoodEntry = async (req, res, next) => {
  try {
    const fields = [
      'mood_score',
      'mood_label',
      'mood_emoji',
      'energy_level',
      'anxiety_level',
      'sleep_hours',
      'activities',
      'triggers',
      'notes',
      'location_context',
      'weather_context',
    ];

    const updates = {};
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (!Object.keys(updates).length) {
      throw new ValidationError('No valid fields to update');
    }

    const entry = await MoodEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.user.id,
      },
      { $set: updates },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).lean();

    if (!entry) {
      throw new NotFoundError('Mood entry');
    }

    await deleteCachePattern(`mood:${req.user.id}:*`);
    await deleteCachePattern(`analytics:${req.user.id}:*`);
    await deleteCachePattern(`insights:${req.user.id}`);

    res.json({ success: true, data: { entry: serialize(entry) } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /moods/:id
 */
const deleteMoodEntry = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!entry) {
      throw new NotFoundError('Mood entry');
    }

    await deleteCachePattern(`mood:${req.user.id}:*`);
    await deleteCachePattern(`analytics:${req.user.id}:*`);
    await deleteCachePattern(`insights:${req.user.id}`);

    res.json({ success: true, message: 'Mood entry deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /moods/stats/summary - Mood statistics
 */
const getMoodStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;

    const cacheKey = `mood:${userId}:stats:${period}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const days = parseInt(period, 10);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const baseMatch = {
      user_id: objectUserId,
      checked_in_at: { $gte: sinceDate },
    };

    const [summaryAgg, distributionAgg, trendAgg, activityAgg] = await Promise.all([
      MoodEntry.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            avg_mood: { $avg: '$mood_score' },
            min_mood: { $min: '$mood_score' },
            max_mood: { $max: '$mood_score' },
            avg_energy: { $avg: '$energy_level' },
            avg_anxiety: { $avg: '$anxiety_level' },
            total_entries: { $sum: 1 },
          },
        },
      ]),
      MoodEntry.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$mood_score', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      MoodEntry.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$checked_in_at' },
            },
            avg_mood: { $avg: '$mood_score' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MoodEntry.aggregate([
        { $match: baseMatch },
        { $unwind: { path: '$activities', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$activities', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 },
      ]),
    ]);

    const summary = summaryAgg[0] ? {
      avg_mood: round(summaryAgg[0].avg_mood),
      min_mood: summaryAgg[0].min_mood ?? null,
      max_mood: summaryAgg[0].max_mood ?? null,
      avg_energy: round(summaryAgg[0].avg_energy),
      avg_anxiety: round(summaryAgg[0].avg_anxiety),
      total_entries: summaryAgg[0].total_entries || 0,
    } : {
      avg_mood: null,
      min_mood: null,
      max_mood: null,
      avg_energy: null,
      avg_anxiety: null,
      total_entries: 0,
    };

    const data = {
      summary,
      distribution: distributionAgg.map((item) => ({
        mood_score: item._id,
        count: item.count,
      })),
      trend: trendAgg.map((item) => ({
        date: item._id,
        avg_mood: round(item.avg_mood),
      })),
      topActivities: activityAgg.map((item) => ({
        activity: item._id,
        count: item.count,
      })),
      period: days,
    };

    await setCache(cacheKey, data, 600);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const today = startOfToday();
  const lastCheckIn = user.last_check_in ? new Date(user.last_check_in) : null;
  const lastCheckInStart = lastCheckIn
    ? new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())
    : null;

  let newStreak = 1;

  if (lastCheckInStart) {
    const diffDays = Math.round((today - lastCheckInStart) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      newStreak = user.streak_count;
    } else if (diffDays === 1) {
      newStreak = user.streak_count + 1;
    }
  }

  user.streak_count = newStreak;
  user.longest_streak = Math.max(newStreak, user.longest_streak || 0);
  user.last_check_in = new Date();
  await user.save();
};

const checkMoodAchievements = async () => {
  // Achievements remain optional during the storage migration.
};

module.exports = {
  createMoodEntry,
  getMoodHistory,
  getTodayMood,
  getMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
  getMoodStats,
};
