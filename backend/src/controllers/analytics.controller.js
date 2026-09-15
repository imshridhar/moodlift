/**
 * Analytics Controller
 */

const analyticsService = require('../services/analytics.service');

module.exports = {
  getUserEvents: analyticsService.getUserEvents,
  getEventStats: analyticsService.getEventStats,
};
