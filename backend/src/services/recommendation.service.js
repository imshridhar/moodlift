/**
 * Recommendation Engine Service
 * Generates personalized motivation tasks based on user behavior
 */

const mongoose = require('mongoose');
const { Recommendation, MoodEntry, Intervention, UserPlaybook } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

const generateRecommendations = async (userId) => {
  try {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const recentMoods = await MoodEntry.find({ user_id: userId })
      .sort({ checked_in_at: -1 })
      .limit(7)
      .lean();

    const avgMood = recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + m.mood_score, 0) / recentMoods.length
      : 5;

    const activePlaybook = await UserPlaybook.findOne({
      user_id: userId,
      status: 'active',
    }).lean();

    const recommendations = [];

    if (avgMood < 4) {
      const breathingIntervention = await Intervention.findOne({
        type: 'breathing',
        is_active: true,
      }).lean();

      recommendations.push({
        user_id: userId,
        task_type: 'breathing',
        title: 'Take a Breathing Break',
        message: 'You\'ve been feeling low lately. Try a quick breathing exercise to reset.',
        duration: 120,
        intervention_id: breathingIntervention?._id,
        priority: 8,
        expires_at: expiresAt,
        score: 0.9,
      });
    }

    if (avgMood >= 4 && avgMood < 7) {
      const gratitudeIntervention = await Intervention.findOne({
        type: 'journaling',
        is_active: true,
      }).lean();

      recommendations.push({
        user_id: userId,
        task_type: 'gratitude',
        title: 'Gratitude Journal',
        message: 'Write down 3 things you\'re grateful for today.',
        duration: 300,
        intervention_id: gratitudeIntervention?._id,
        priority: 5,
        expires_at: expiresAt,
        score: 0.7,
      });
    }

    if (activePlaybook) {
      recommendations.push({
        user_id: userId,
        task_type: 'reflection',
        title: 'Continue Your Playbook',
        message: `You're on day ${activePlaybook.current_day} of your playbook. Keep going!`,
        duration: 600,
        priority: 7,
        expires_at: expiresAt,
        score: 0.8,
      });
    }

    recommendations.push({
      user_id: userId,
      task_type: 'movement',
      title: 'Quick Movement Break',
      message: 'Stand up, stretch, and take a short walk. Your body will thank you!',
      duration: 300,
      priority: 4,
      expires_at: expiresAt,
      score: 0.6,
    });

    if (recommendations.length > 0) {
      await Recommendation.insertMany(recommendations);
    }

    return serialize(recommendations);
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    throw error;
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { include_completed = 'false' } = req.query;

    const filter = { user_id: userId };
    if (include_completed !== 'true') {
      filter.completed = false;
      filter.dismissed = false;
    }

    const recommendations = await Recommendation.find(filter)
      .sort({ priority: -1, created_at: -1 })
      .limit(20)
      .lean();

    if (recommendations.length === 0) {
      const generated = await generateRecommendations(userId);
      return res.json({ success: true, data: { recommendations: generated || [], generated: true } });
    }

    res.json({ success: true, data: { recommendations: serialize(recommendations) } });
  } catch (error) {
    next(error);
  }
};

const completeRecommendation = async (req, res, next) => {
  try {
    const recommendation = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id, completed: false },
      { $set: { completed: true, completed_at: new Date() } },
      { returnDocument: 'after' }
    ).lean();

    if (!recommendation) {
      throw new NotFoundError('Recommendation');
    }

    res.json({ success: true, message: 'Recommendation marked as complete' });
  } catch (error) {
    next(error);
  }
};

const dismissRecommendation = async (req, res, next) => {
  try {
    const recommendation = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id, completed: false },
      { $set: { dismissed: true } },
      { returnDocument: 'after' }
    ).lean();

    if (!recommendation) {
      throw new NotFoundError('Recommendation');
    }

    res.json({ success: true, message: 'Recommendation dismissed' });
  } catch (error) {
    next(error);
  }
};

const clearExpiredRecommendations = async () => {
  try {
    await Recommendation.deleteMany({
      $or: [
        { expires_at: { $lt: new Date() } },
        { completed: true, updated_at: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    });
  } catch (error) {
    logger.error('Error clearing expired recommendations:', error);
  }
};

module.exports = {
  generateRecommendations,
  getRecommendations,
  completeRecommendation,
  dismissRecommendation,
  clearExpiredRecommendations,
};
