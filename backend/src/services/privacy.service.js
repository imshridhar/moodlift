/**
 * Data Privacy Service
 * Provides data ownership features: export, delete account
 */

const { DataExport, User, MoodEntry, JournalEntry, Conversation, Message, Notification, UserProfile } = require('../models');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const EXPORT_DIR = process.env.EXPORT_DIR || './exports';

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const requestDataExport = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const existing = await DataExport.findOne({
      user_id: userId,
      status: { $in: ['pending', 'processing'] },
    });

    if (existing) {
      return res.json({
        success: true,
        data: { export: serialize(existing) },
        message: 'Export already in progress',
      });
    }

    const dataExport = await DataExport.create({
      user_id: userId,
      status: 'pending',
    });

    processExport(userId, dataExport._id).catch(error => {
      logger.error('Background export failed:', error);
    });

    res.status(202).json({
      success: true,
      data: { export: serialize(dataExport) },
      message: 'Data export started. You will be notified when ready.',
    });
  } catch (error) {
    next(error);
  }
};

const processExport = async (userId, exportId) => {
  try {
    await DataExport.findByIdAndUpdate(exportId, { $set: { status: 'processing' } });

    const userData = await User.findById(userId).lean();
    const profileData = await UserProfile.findOne({ user_id: userId }).lean();
    const moodEntries = await MoodEntry.find({ user_id: userId }).lean();
    const journalEntries = await JournalEntry.find({ user_id: userId }).lean();
    const conversations = await Conversation.find({ user_id: userId }).lean();
    const notifications = await Notification.find({ user_id: userId }).lean();

    const exportData = {
      user: userData,
      profile: profileData,
      mood_entries: moodEntries,
      journal_entries: journalEntries,
      conversations: conversations.map(c => ({
        ...c,
        messages: [],
      })),
      notifications: notifications,
      exported_at: new Date().toISOString(),
    };

    for (const conv of exportData.conversations) {
      conv.messages = await Message.find({ conversation_id: conv._id }).lean();
    }

    const fileName = `export_${userId}_${Date.now()}.json`;
    const filePath = path.join(EXPORT_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

    const fileUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/exports/${fileName}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await DataExport.findByIdAndUpdate(exportId, {
      $set: {
        status: 'completed',
        file_url: fileUrl,
        expires_at: expiresAt,
        completed_at: new Date(),
      },
    });

    logger.info(`Data export completed for user ${userId}`);
  } catch (error) {
    logger.error('Error processing export:', error);

    await DataExport.findByIdAndUpdate(exportId, {
      $set: { status: 'failed' },
    });
  }
};

const getExportStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const [exports, total] = await Promise.all([
      DataExport.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      DataExport.countDocuments({ user_id: userId }),
    ]);

    res.json({
      success: true,
      data: {
        exports: serialize(exports),
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

const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      MoodEntry.deleteMany({ user_id: userId }),
      JournalEntry.deleteMany({ user_id: userId }),
      Conversation.deleteMany({ user_id: userId }),
      Message.deleteMany({ user_id: userId }),
      Notification.deleteMany({ user_id: userId }),
      UserProfile.deleteMany({ user_id: userId }),
      DataExport.deleteMany({ user_id: userId }),
    ]);

    await User.findByIdAndUpdate(userId, {
      $set: {
        email: `deleted_${userId}@deleted.com`,
        username: `deleted_${userId}`,
        is_active: false,
        password_hash: null,
        full_name: 'Deleted User',
      },
    });

    logger.info(`Account deleted for user ${userId}`);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const cleanExpiredExports = async () => {
  try {
    const expired = await DataExport.find({
      expires_at: { $lt: new Date() },
      file_url: { $ne: null },
    }).lean();

    for (const exp of expired) {
      if (exp.file_url) {
        const fileName = exp.file_url.split('/').pop();
        const filePath = path.join(EXPORT_DIR, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await DataExport.deleteMany({ expires_at: { $lt: new Date() } });
    logger.info(`Cleaned up ${expired.length} expired exports`);
  } catch (error) {
    logger.error('Error cleaning expired exports:', error);
  }
};

module.exports = {
  requestDataExport,
  getExportStatus,
  deleteAccount,
  cleanExpiredExports,
};
