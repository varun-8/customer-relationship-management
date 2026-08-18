const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');

// All KPI routes
router.post('/', kpiController.createOrUpdateKPI);
router.get('/', kpiController.getKPIList);
router.get('/summary', kpiController.getKPISummary);
router.get('/auto-fill', kpiController.getAutoFillFromCRM);
router.get('/day-performance', kpiController.getDayPerformance);
router.get('/daily-trends', kpiController.getDailyTrends);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;
