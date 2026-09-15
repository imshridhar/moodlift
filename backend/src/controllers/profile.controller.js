/**
 * User Profile Controller
 */

const profileService = require('../services/profile.service');

module.exports = {
  getProfile: profileService.getProfile,
  updateProfile: profileService.updateProfile,
  deleteProfile: profileService.deleteProfile,
};
