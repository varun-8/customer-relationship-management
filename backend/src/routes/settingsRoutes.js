const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// POST /api/settings/wipe-data
router.post('/wipe-data', settingsController.wipeDatabase);

module.exports = router;
