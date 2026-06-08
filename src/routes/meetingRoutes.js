const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const teamLeaderController = require('../controllers/teamLeaderController');

router.use(protect);

// Get all meetings for the logged-in user (host or attendee)
router.get('/', teamLeaderController.getMeetings);

module.exports = router;
