const express = require('express');
const router = express.Router();
const followupController = require('../controllers/followupController');

// Follow-ups Routes
router.get('/', followupController.getFollowupsList);
router.post('/:id/log', followupController.logFollowupActivity);

module.exports = router;
