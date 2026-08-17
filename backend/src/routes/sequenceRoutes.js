const express = require('express');
const router = express.Router();
const {
  getSequenceConfig,
  updateSequenceConfig,
} = require('../controllers/sequenceController');
const { protect } = require('../middlewares/authMiddleware');
const { requireOwnerOrAdmin } = require('../middlewares/roleMiddleware');

router.get('/customer-id', protect, getSequenceConfig);
router.put('/customer-id', protect, requireOwnerOrAdmin, updateSequenceConfig);

module.exports = router;
