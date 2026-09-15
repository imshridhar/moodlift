/**
 * Data Privacy Controller
 */

const privacyService = require('../services/privacy.service');

module.exports = {
  requestDataExport: privacyService.requestDataExport,
  getExportStatus: privacyService.getExportStatus,
  deleteAccount: privacyService.deleteAccount,
};
