/**
 * Admin Dashboard Controller
 */

const adminService = require('../services/admin.service');

module.exports = {
  getUserStats: adminService.getUserStats,
  getDashboardStats: adminService.getDashboardStats,
  getCrisisOverview: adminService.getCrisisOverview,
  reviewRiskFlag: adminService.reviewRiskFlag,
  toggleUserStatus: adminService.toggleUserStatus,
};
