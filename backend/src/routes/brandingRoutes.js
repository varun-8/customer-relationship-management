const express = require('express');
const router = express.Router();
const { getBranding, updateBranding } = require('../controllers/brandingController');

router.route('/')
  .get(getBranding)
  .put(updateBranding);

module.exports = router;
