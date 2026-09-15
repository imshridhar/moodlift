/**
 * File Storage Controller
 */

const storageService = require('../services/storage.service');

module.exports = {
  uploadFile: storageService.uploadFile,
  getFiles: storageService.getFiles,
  deleteFile: storageService.deleteFile,
};
