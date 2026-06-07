const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const teamLeaderController = require('../controllers/teamLeaderController');

router.use(protect);
router.use(authorize('TEAM_LEADER', 'ADMIN', 'HR'));

// Get all interns mapped to the currently logged in Team Leader
router.get('/interns', teamLeaderController.getTeamInterns);

// Assign a task to an intern that belongs to the Team Leader
router.post('/interns/:userId/assign-task', teamLeaderController.assignTaskToIntern);

module.exports = router;
