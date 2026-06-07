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

// Assign a project to an intern
router.post('/interns/:userId/assign-project', teamLeaderController.assignProjectToIntern);

// Get specific intern details
router.get('/interns/:userId', teamLeaderController.getInternDetails);

// Tasks (Kanban)
router.get('/tasks', teamLeaderController.getTeamTasks);
router.patch('/tasks/:userId/:taskId', teamLeaderController.updateTaskStatus);

// Attendance
router.get('/attendance', teamLeaderController.getTeamAttendance);

// Leaves
router.get('/leaves', teamLeaderController.getTeamLeaves);
router.patch('/leaves/:leaveId', teamLeaderController.reviewLeave);

// Reports
router.get('/reports', teamLeaderController.getTeamReports);

module.exports = router;
