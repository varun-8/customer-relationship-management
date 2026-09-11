const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// POST /api/settings/wipe-data
router.post('/wipe-data', settingsController.wipeDatabase);

// GET /api/settings/mobile-pairing
router.get('/mobile-pairing', settingsController.getMobilePairingInfo);

// POST /api/settings/device-heartbeat
router.post('/device-heartbeat', settingsController.recordDeviceHeartbeat);

// GET /api/settings/connected-devices
router.get('/connected-devices', settingsController.getConnectedDevices);

// DELETE /api/settings/connected-devices/:deviceId
router.delete('/connected-devices/:deviceId', settingsController.disconnectDevice);

// AI Intelligence Configuration (Developer Mode)
router.get('/ai-config', settingsController.getAiConfig);
router.post('/ai-config', settingsController.updateAiConfig);
router.post('/ai-config/test', settingsController.testAiConfig);

module.exports = router;

