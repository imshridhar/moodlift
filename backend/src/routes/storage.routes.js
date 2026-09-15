/**
 * File Storage Routes
 */
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const storageController = require('../controllers/storage.controller');
const storageService = require('../services/storage.service');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post(
  '/',
  storageService.upload.single('file'),
  storageController.uploadFile
);

router.get('/', storageController.getFiles);

router.delete('/:id', [
  param('id').isMongoId(),
], validate, storageController.deleteFile);

module.exports = router;
