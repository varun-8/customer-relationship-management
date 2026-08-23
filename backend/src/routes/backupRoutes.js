const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// GET /api/backup/config - Get backup directory, retention policy, and backup file list
router.get('/config', backupController.getBackupConfigInfo);

// POST /api/backup/config - Update backup directory storage path
router.post('/config', backupController.updateBackupConfig);

// POST /api/backup/run - Trigger daily auto-backup (runs once daily automatically, or force=true)
router.post('/run', backupController.runFullBackup);

module.exports = router;
