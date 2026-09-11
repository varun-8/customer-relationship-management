const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// GET /api/backup/config - Get backup directory, retention policy, and backup file list
router.get('/config', backupController.getBackupConfigInfo);

// POST /api/backup/config - Update backup directory storage path
router.post('/config', backupController.updateBackupConfig);

// POST /api/backup/run - Trigger daily auto-backup (runs once daily automatically, or force=true)
router.post('/run', backupController.runFullBackup);

// POST /api/backup/restore - Restore full database from backup JSON
router.post('/restore', backupController.restoreBackup);

// POST /api/backup/open-folder - Open configured backup directory in explorer
router.post('/open-folder', backupController.openBackupFolder);

module.exports = router;
