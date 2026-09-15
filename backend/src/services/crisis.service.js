const { RiskFlag } = require('../models');
const { detectRiskSignals } = require('../utils/keywords');
const { logger } = require('../utils/logger');

/**
 * Detect risk signals in text and create a risk flag if high-risk content detected
 * @param {string} userId - User ID
 * @param {string} text - Text to analyze
 * @param {string} source - Source of text ('chat', 'mood_entry', 'journal')
 * @returns {object} - { flagged, severity, flagId }
 */
async function detectAndFlagRisk(userId, text, source = 'chat') {
  try {
    const { severity, flagType, indicators, confidence } = detectRiskSignals(text);

    if (severity === 'low' && confidence < 0.3) {
      return { flagged: false, severity: 'low' };
    }

    // Create risk flag
    const riskFlag = await RiskFlag.create({
      user_id: userId,
      severity,
      source,
      flag_type: flagType,
      message: text.substring(0, 1000), // Truncate long messages
      indicators,
      confidence,
      reviewed: false,
    });

    logger.warn(`Risk flag created for user ${userId}: ${severity} severity from ${source}`, {
      flagId: riskFlag._id,
      confidence,
      indicators,
    });

    return {
      flagged: true,
      severity,
      flagType,
      flagId: riskFlag._id,
      indicators,
    };
  } catch (error) {
    logger.error('Error in detectAndFlagRisk:', error);
    throw error;
  }
}

/**
 * Get risk flags for a user
 * @param {string} userId - User ID
 * @param {object} options - { limit, severity, reviewed }
 * @returns {array} - Risk flags
 */
async function getRiskFlags(userId, options = {}) {
  try {
    const { limit = 50, severity = null, reviewed = false } = options;

    const query = { user_id: userId };
    if (severity) {query.severity = severity;}
    if (typeof reviewed !== 'undefined') {query.reviewed = reviewed;}

    const flags = await RiskFlag.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .exec();

    return flags;
  } catch (error) {
    logger.error('Error in getRiskFlags:', error);
    throw error;
  }
}

/**
 * Get all unreviewed risk flags (for admin)
 * @param {object} options - { limit, severity }
 * @returns {array} - Unreviewed risk flags
 */
async function getUnreviewedFlags(options = {}) {
  try {
    const { limit = 100, severity = null } = options;

    const query = { reviewed: false };
    if (severity) {query.severity = severity;}

    const flags = await RiskFlag.find(query)
      .populate('user_id', 'email full_name username')
      .sort({ created_at: -1 })
      .limit(limit)
      .exec();

    return flags;
  } catch (error) {
    logger.error('Error in getUnreviewedFlags:', error);
    throw error;
  }
}

/**
 * Mark a risk flag as reviewed by admin
 * @param {string} flagId - Risk flag ID
 * @param {string} adminUserId - Admin user ID
 * @param {string} action - Action taken
 * @returns {object} - Updated risk flag
 */
async function reviewFlag(flagId, adminUserId, action) {
  try {
    const flag = await RiskFlag.findByIdAndUpdate(
      flagId,
      {
        reviewed: true,
        reviewed_by: adminUserId,
        reviewed_at: new Date(),
        action_taken: action,
      },
      { returnDocument: 'after' }
    );

    logger.info(`Risk flag ${flagId} reviewed by admin ${adminUserId}`);
    return flag;
  } catch (error) {
    logger.error('Error in reviewFlag:', error);
    throw error;
  }
}

/**
 * Get risk statistics for admin dashboard
 * @returns {object} - Statistics including total flags, by severity, unreviewed count
 */
async function getRiskStatistics() {
  try {
    const total = await RiskFlag.countDocuments();
    const highSeverity = await RiskFlag.countDocuments({ severity: 'high' });
    const mediumSeverity = await RiskFlag.countDocuments({ severity: 'medium' });
    const lowSeverity = await RiskFlag.countDocuments({ severity: 'low' });
    const unreviewed = await RiskFlag.countDocuments({ reviewed: false });

    // Get recent high-severity flags
    const recentHighSeverity = await RiskFlag.find({ severity: 'high', reviewed: false })
      .populate('user_id', 'email full_name username')
      .sort({ created_at: -1 })
      .limit(10)
      .exec();

    return {
      total,
      by_severity: { high: highSeverity, medium: mediumSeverity, low: lowSeverity },
      unreviewed,
      recent_high_severity: recentHighSeverity,
    };
  } catch (error) {
    logger.error('Error in getRiskStatistics:', error);
    throw error;
  }
}

module.exports = {
  detectAndFlagRisk,
  getRiskFlags,
  getUnreviewedFlags,
  reviewFlag,
  getRiskStatistics,
};
