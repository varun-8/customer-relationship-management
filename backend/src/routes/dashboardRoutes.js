const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard Routes
router.get('/metrics', dashboardController.getDashboardMetrics);
router.put('/targets', dashboardController.updateSalesTargets);

module.exports = router;
