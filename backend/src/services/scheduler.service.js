/**
 * MoodLift Cron Scheduler
 * Background jobs for reminders, streak checks, and weekly insights
 */

const cron = require('node-cron');
const { User, MoodEntry, Notification } = require('../models');
const { sendStreakReminderEmail, sendWeeklyInsightEmail } = require('./email.service');
const { cleanExpiredExports } = require('./privacy.service');
const { clearExpiredRecommendations } = require('./recommendation.service');
const { logger } = require('../utils/logger');

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * Daily streak reminder - runs at 8PM user's local time (approximated to UTC)
 */
const streakReminderJob = cron.schedule('0 18 * * *', async () => {
  logger.info('Running streak reminder job...');
  try {
    const today = startOfToday();
    const usersAtRisk = await User.find({
      is_active: true,
      streak_count: { $gt: 0 },
      $or: [
        { last_check_in: null },
        { last_check_in: { $lt: today } },
      ],
      'notification_preferences.email': true,
      'notification_preferences.daily_reminder': true,
    }).select('email full_name streak_count').lean();

    logger.info(`Sending streak reminders to ${usersAtRisk.length} users`);

    for (const user of usersAtRisk) {
      await sendStreakReminderEmail(user.email, user.full_name, user.streak_count);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info(`Streak reminders sent to ${usersAtRisk.length} users`);
  } catch (error) {
    logger.error('Streak reminder job failed:', error);
  }
}, { scheduled: false });

/**
 * Weekly insights email - every Sunday at 9AM UTC
 */
const weeklyInsightJob = cron.schedule('0 9 * * 0', async () => {
  logger.info('Running weekly insight email job...');
  try {
    const since = daysAgo(7);
    const users = await User.find({
      is_active: true,
      'notification_preferences.email': true,
    }).select('email full_name streak_count').lean();

    let sentCount = 0;

    for (const user of users) {
      const [summary] = await MoodEntry.aggregate([
        {
          $match: {
            user_id: user._id,
            checked_in_at: { $gte: since },
          },
        },
        {
          $group: {
            _id: null,
            avg_mood: { $avg: '$mood_score' },
            total_entries: { $sum: 1 },
          },
        },
      ]);

      if (!summary?.total_entries) {
        continue;
      }

      await sendWeeklyInsightEmail(user.email, user.full_name, {
        avg_mood: Math.round(summary.avg_mood * 100) / 100,
        total_entries: summary.total_entries,
        streak: user.streak_count,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
      sentCount += 1;
    }

    logger.info(`Weekly insights sent to ${sentCount} users`);
  } catch (error) {
    logger.error('Weekly insight job failed:', error);
  }
}, { scheduled: false });

/**
 * Streak reset check - midnight UTC daily
 */
const streakResetJob = cron.schedule('5 0 * * *', async () => {
  logger.info('Running streak reset check...');
  try {
    const yesterdayStart = daysAgo(1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const result = await User.updateMany({
      is_active: true,
      streak_count: { $gt: 0 },
      last_check_in: { $ne: null, $lt: yesterdayStart },
    }, {
      $set: { streak_count: 0 },
    });

    logger.info(`Reset streaks for ${result.modifiedCount} users who missed yesterday`);
  } catch (error) {
    logger.error('Streak reset job failed:', error);
  }
}, { scheduled: false });

/**
 * Cleanup old notifications - weekly
 */
const notificationCleanupJob = cron.schedule('0 3 * * 1', async () => {
  try {
    const cutoff = daysAgo(30);
    const result = await Notification.deleteMany({
      is_read: true,
      read_at: { $lt: cutoff },
    });

    logger.info(`Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    logger.error('Notification cleanup failed:', error);
  }
}, { scheduled: false });

/**
 * Cleanup expired recommendations - daily
 */
const recommendationCleanupJob = cron.schedule('0 4 * * *', async () => {
  try {
    await clearExpiredRecommendations();
  } catch (error) {
    logger.error('Recommendation cleanup failed:', error);
  }
}, { scheduled: false });

/**
 * Cleanup expired data exports - weekly
 */
const exportCleanupJob = cron.schedule('0 5 * * 1', async () => {
  try {
    await cleanExpiredExports();
  } catch (error) {
    logger.error('Export cleanup failed:', error);
  }
}, { scheduled: false });

const startSchedulers = () => {
  if (process.env.NODE_ENV === 'production') {
    streakReminderJob.start();
    weeklyInsightJob.start();
    streakResetJob.start();
    notificationCleanupJob.start();
    recommendationCleanupJob.start();
    exportCleanupJob.start();
    logger.info('All cron jobs started');
  } else {
    logger.info('Cron jobs disabled in non-production environment');
  }
};

const stopSchedulers = () => {
  streakReminderJob.stop();
  weeklyInsightJob.stop();
  streakResetJob.stop();
  notificationCleanupJob.stop();
  recommendationCleanupJob.stop();
  exportCleanupJob.stop();
  logger.info('Cron jobs stopped');
};

module.exports = { startSchedulers, stopSchedulers };
