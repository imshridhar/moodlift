/**
 * Admin Dashboard Service
 * Internal monitoring and moderation tools
 */

const { User, MoodEntry, RiskFlag, Conversation, Challenge, Playbook } = require('../models');
const { serialize } = require('../utils/serialize');
const { AuthorizationError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const requireAdmin = (req, res, next) => {
  if (!req.user?.roles?.includes('admin')) {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};

const getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ is_active: true });
    const verifiedUsers = await User.countDocuments({ is_verified: true });
    const premiumUsers = await User.countDocuments({ is_premium: true });

    const newUsersLast7Days = await User.countDocuments({
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const newUsersLast30Days = await User.countDocuments({
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const users = await User.find()
      .select('email username full_name is_active is_verified is_premium streak_count created_at last_check_in')
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: {
        stats: {
          total_users: totalUsers,
          active_users: activeUsers,
          verified_users: verifiedUsers,
          premium_users: premiumUsers,
          new_users_last_7_days: newUsersLast7Days,
          new_users_last_30_days: newUsersLast30Days,
        },
        users: serialize(users),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMoodEntries,
      totalConversations,
      totalRiskFlags,
      unreviewedFlags,
      totalChallenges,
      totalPlaybooks,
    ] = await Promise.all([
      User.countDocuments({ is_active: true }),
      MoodEntry.countDocuments(),
      Conversation.countDocuments(),
      RiskFlag.countDocuments(),
      RiskFlag.countDocuments({ reviewed: false }),
      Challenge.countDocuments({ is_active: true }),
      Playbook.countDocuments({ is_active: true }),
    ]);

    const moodEntriesLast7Days = await MoodEntry.countDocuments({
      checked_in_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const avgMoodAgg = await MoodEntry.aggregate([
      { $match: { checked_in_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: null, avg_mood: { $avg: '$mood_score' } } },
    ]);

    const avgMood = avgMoodAgg[0]?.avg_mood ? Math.round(avgMoodAgg[0].avg_mood * 100) / 100 : null;

    res.json({
      success: true,
      data: {
        active_users: totalUsers,
        mood_entries_total: totalMoodEntries,
        mood_entries_last_7_days: moodEntriesLast7Days,
        avg_mood_last_7_days: avgMood,
        total_conversations: totalConversations,
        total_risk_flags: totalRiskFlags,
        unreviewed_flags: unreviewedFlags,
        active_challenges: totalChallenges,
        active_playbooks: totalPlaybooks,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCrisisOverview = async (req, res, next) => {
  try {
    const { limit = 20, severity } = req.query;

    const query = { reviewed: false };
    if (severity) {query.severity = severity;}

    const flags = await RiskFlag.find(query)
      .populate('user_id', 'email username full_name')
      .sort({ created_at: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    const stats = {
      high_severity: await RiskFlag.countDocuments({ severity: 'high', reviewed: false }),
      medium_severity: await RiskFlag.countDocuments({ severity: 'medium', reviewed: false }),
      low_severity: await RiskFlag.countDocuments({ severity: 'low', reviewed: false }),
      total_unreviewed: await RiskFlag.countDocuments({ reviewed: false }),
    };

    res.json({
      success: true,
      data: {
        flags: serialize(flags),
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

const reviewRiskFlag = async (req, res, next) => {
  try {
    const { action } = req.body;

    const flag = await RiskFlag.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          reviewed: true,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          action_taken: action,
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!flag) {
      throw new Error('Risk flag not found');
    }

    logger.info(`Admin ${req.user.id} reviewed risk flag ${req.params.id}`);

    res.json({ success: true, data: { flag: serialize(flag) } });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { is_active } },
      { returnDocument: 'after' }
    ).select('-password_hash -refresh_token_hash').lean();

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`Admin ${req.user.id} toggled user ${req.params.id} active status to ${is_active}`);

    res.json({ success: true, data: { user: serialize(user) } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAdmin,
  getUserStats,
  getDashboardStats,
  getCrisisOverview,
  reviewRiskFlag,
  toggleUserStatus,
};
