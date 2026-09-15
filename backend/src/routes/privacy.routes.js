/**
 * Data Privacy Routes
 */
const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacy.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/export', privacyController.requestDataExport);
router.get('/exports', privacyController.getExportStatus);
router.delete('/account', privacyController.deleteAccount);

module.exports = router;
