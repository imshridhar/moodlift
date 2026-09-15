const { detectRiskSignals } = require('../utils/keywords');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Middleware to check for crisis keywords in messages
 * Adds flagged_risk and risk_flags to the request
 */
function safetyCheckMiddleware(req, res, next) {
  // Only check message bodies with 'content' field
  if (req.body && req.body.content && typeof req.body.content === 'string') {
    const { severity, flagType, indicators, confidence } = detectRiskSignals(req.body.content);

    // Attach safety check results to request
    req.safetyCheck = {
      severity,
      flagType,
      indicators,
      confidence,
      isFlagged: severity !== 'low' || confidence > 0.5,
    };

    // Log suspected high-risk content for monitoring
    if (severity === 'high') {
      logger.warn(`High-risk content detected from user ${req.user?.id}`, {
        userId: req.user?.id,
        severity,
        confidence,
        indicators,
      });
    }
  }

  next();
}

module.exports = {
  safetyCheckMiddleware,
};
