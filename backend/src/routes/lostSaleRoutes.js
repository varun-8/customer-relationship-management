const express = require('express');
const router = express.Router();
const lostSaleController = require('../controllers/lostSaleController');

// Lost Sales Routes
router.post('/', lostSaleController.createLostSale);
router.get('/', lostSaleController.getLostSalesList);
router.get('/analytics', lostSaleController.getLostSalesAnalytics);
router.put('/:id', lostSaleController.updateLostSale);
router.post('/:id/reopen', lostSaleController.reopenLostSale);
router.delete('/:id', lostSaleController.deleteLostSale);

module.exports = router;
