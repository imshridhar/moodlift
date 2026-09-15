/**
 * User Profile Service
 * Manages user preferences, goals, and personalization data
 */

const { UserProfile } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { serialize } = require('../utils/serialize');
const { setCache, getCache, deleteCache } = require('../config/redis');
const { logger } = require('../utils/logger');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `profile:${userId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: { profile: cached }, cached: true });
    }

    let profile = await UserProfile.findOne({ user_id: userId }).lean();

    if (!profile) {
      profile = await UserProfile.create({
        user_id: userId,
        name: req.user.full_name || null,
        timezone: req.user.timezone || 'UTC',
      });
    }

    const serialized = serialize(profile);
    await setCache(cacheKey, serialized, 3600);

    res.json({ success: true, data: { profile: serialized } });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const allowedFields = ['name', 'goals', 'preferred_checkin_time', 'timezone', 'settings', 'avatar_url', 'date_of_birth', 'gender'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    if (updates.settings) {
      const existing = await UserProfile.findOne({ user_id: userId }).lean();
      updates.settings = { ...(existing?.settings || {}), ...updates.settings };
    }

    const profile = await UserProfile.findOneAndUpdate(
      { user_id: userId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true, upsert: true }
    ).lean();

    await deleteCache(`profile:${userId}`);

    logger.info(`Profile updated for user ${userId}`);

    res.json({ success: true, data: { profile: serialize(profile) } });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await UserProfile.findOneAndDelete({ user_id: userId });
    await deleteCache(`profile:${userId}`);

    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
};
