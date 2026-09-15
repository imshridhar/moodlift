/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { User, MoodEntry, JournalEntry, Achievement, UserAchievement } = require('../models');
const { serialize } = require('../utils/serialize');
const { ValidationError } = require('../utils/errors');

router.use(authenticate);

// GET /users/profile
router.get('/profile', async (req, res, next) => {
  try {
    const [user, totalMoodEntries, totalJournalEntries, totalAchievements] = await Promise.all([
      User.findById(req.user.id).lean(),
      MoodEntry.countDocuments({ user_id: req.user.id }),
      JournalEntry.countDocuments({ user_id: req.user.id }),
      UserAchievement.countDocuments({ user_id: req.user.id }),
    ]);

    const serializedUser = serialize(user);
    delete serializedUser.password_hash;
    delete serializedUser.refresh_token_hash;
    delete serializedUser.password_reset_token;
    delete serializedUser.password_reset_expires;
    delete serializedUser.email_verification_token;

    res.json({
      success: true,
      data: {
        user: {
          ...serializedUser,
          total_mood_entries: totalMoodEntries,
          total_journal_entries: totalJournalEntries,
          total_achievements: totalAchievements,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /users/profile
router.patch('/profile', [
  body('full_name').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('timezone').optional().isLength({ max: 50 }),
  body('theme_preference').optional().isIn(['light', 'dark', 'system']),
], validate, async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = [
      'full_name',
      'bio',
      'timezone',
      'theme_preference',
      'language',
      'gender',
      'date_of_birth',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).lean();

    const serializedUser = serialize(user);

    res.json({
      success: true,
      data: {
        user: {
          id: serializedUser.id,
          email: serializedUser.email,
          username: serializedUser.username,
          full_name: serializedUser.full_name,
          bio: serializedUser.bio,
          timezone: serializedUser.timezone,
          theme_preference: serializedUser.theme_preference,
          avatar_url: serializedUser.avatar_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /users/password
router.patch('/password', [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const valid = await bcrypt.compare(req.body.current_password, user.password_hash);

    if (!valid) {
      return next(new ValidationError('Current password is incorrect'));
    }

    user.password_hash = await bcrypt.hash(req.body.new_password, 12);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /users/notifications
router.patch('/notifications', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { notification_preferences: req.body } },
      { returnDocument: 'after' }
    ).lean();

    res.json({
      success: true,
      data: { notification_preferences: serialize(user).notification_preferences },
    });
  } catch (err) {
    next(err);
  }
});

// GET /users/achievements
router.get('/achievements', async (req, res, next) => {
  try {
    const [achievements, earnedAchievements] = await Promise.all([
      Achievement.find({}).sort({ points: -1, created_at: 1 }).lean(),
      UserAchievement.find({ user_id: req.user.id }).lean(),
    ]);

    const earnedByAchievementId = new Map(
      earnedAchievements.map((item) => [String(item.achievement_id), item.earned_at])
    );

    const merged = serialize(achievements).map((achievement) => ({
      ...achievement,
      earned_at: earnedByAchievementId.get(achievement.id) || null,
    }));

    merged.sort((left, right) => {
      if (left.earned_at && right.earned_at) {
        return new Date(right.earned_at) - new Date(left.earned_at);
      }
      if (left.earned_at) {return -1;}
      if (right.earned_at) {return 1;}
      return (right.points || 0) - (left.points || 0);
    });

    res.json({ success: true, data: { achievements: merged } });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/account
router.delete('/account', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { is_active: false },
    });

    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
