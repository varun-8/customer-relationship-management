const express = require('express');
const router = express.Router();
const { getBranding, updateBranding } = require('../controllers/brandingController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getBranding)
  .put(protect, updateBranding);

module.exports = router;
