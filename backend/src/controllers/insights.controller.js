/**
 * Insights Controller
 */

const insightsService = require('../services/insights.service');

module.exports = {
  getMoodInsights: insightsService.getMoodInsights,
  getDailyStats: insightsService.getDailyStats,
};
