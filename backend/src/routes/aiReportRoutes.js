const express = require('express');
const router = express.Router();
const aiReportController = require('../controllers/aiReportController');

// Status & quota lock check
router.get('/status', aiReportController.getReportStatus);

// Generate report (monthly / yearly)
router.post('/generate', aiReportController.generateReport);

// History & Archive list
router.get('/history', aiReportController.getReportsHistory);

// Single report details
router.get('/:id', aiReportController.getReportById);

module.exports = router;
