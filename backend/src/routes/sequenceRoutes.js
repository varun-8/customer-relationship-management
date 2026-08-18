const express = require('express');
const router = express.Router();
const {
  getSequenceConfig,
  updateSequenceConfig,
} = require('../controllers/sequenceController');
const { protect } = require('../middlewares/authMiddleware');
const { requireEmployeeOrAbove } = require('../middlewares/roleMiddleware');

router.get('/customer-id', protect, getSequenceConfig);
router.put('/customer-id', protect, requireEmployeeOrAbove, updateSequenceConfig);

module.exports = router;
