/**
 * Admin Routes
 * All admin-related API endpoints
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const { writeLimiter, searchLimiter, exportLimiter, adminLimiter } = require('../utils/rateLimiter');

// Import controllers
const adminController = require('../controllers/adminController');
const attendanceController = require('../controllers/attendanceController');
const workReportController = require('../controllers/workReportController');
const exportController = require('../controllers/exportController');
const settingsController = require('../controllers/settingsController');
const geoController = require('../controllers/geoLocationController');

// All routes require authentication
router.use(protect);

// ==================== DASHBOARD ====================
router.get('/dashboard', authorize('ADMIN', 'HR', 'PARTNER'), adminController.getDashboardStats);

// ==================== USER MANAGEMENT ====================
router.get('/users', searchLimiter, authorize('ADMIN', 'HR', 'PARTNER'), adminController.getUsers);
router.post('/users', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), adminController.createUser);
router.put('/users/:id', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), adminController.updateUser);
router.patch('/users/:id/toggle-status', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), adminController.toggleUserStatus);
router.delete('/users/:id', writeLimiter, authorize('ADMIN', 'PARTNER'), adminController.deleteUser);

// ==================== INTERN MANAGEMENT ====================
router.get('/interns/:userId', adminLimiter, authorize('ADMIN', 'HR', 'PARTNER'), adminController.getInternDetails);
router.put('/interns/:userId', writeLimiter, authorize('ADMIN', 'HR'), adminController.updateInternByAdmin);
router.post('/interns/:userId/assign-task', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), adminController.assignTaskToIntern);

// ==================== ATTENDANCE ====================
router.get('/attendance', searchLimiter, authorize('ADMIN', 'HR', 'PARTNER'), attendanceController.getAttendance);
router.get('/attendance/summary', authorize('ADMIN', 'HR', 'PARTNER'), attendanceController.getAttendanceSummary);
router.get('/attendance/geo-logs', searchLimiter, authorize('ADMIN', 'HR', 'PARTNER'), attendanceController.getGeoLogs);
router.post('/attendance/manual', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), attendanceController.createManualAttendance);
router.put('/attendance/:id', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), attendanceController.updateAttendance);
router.delete('/attendance/:id', writeLimiter, authorize('ADMIN', 'PARTNER'), attendanceController.deleteAttendance);

// ==================== WORK REPORTS ====================
router.get('/reports', searchLimiter, authorize('ADMIN', 'HR', 'PARTNER'), workReportController.getWorkReports);
router.get('/reports/pending-count', authorize('ADMIN', 'HR', 'PARTNER'), workReportController.getPendingCount);
router.get('/reports/:id', authorize('ADMIN', 'HR', 'PARTNER'), workReportController.getWorkReportById);
router.put('/reports/:id/review', writeLimiter, authorize('ADMIN', 'HR', 'PARTNER'), workReportController.reviewWorkReport);
router.delete('/reports/:id', writeLimiter, authorize('ADMIN', 'PARTNER'), workReportController.deleteWorkReport);

// ==================== EXPORT ====================
router.post('/export', exportLimiter, authorize('ADMIN', 'HR', 'PARTNER'), exportController.exportData);

// ==================== SETTINGS ====================
router.get('/settings', authorize('ADMIN', 'PARTNER'), settingsController.getSettings);
router.put('/settings', writeLimiter, authorize('ADMIN', 'PARTNER'), settingsController.updateSettings);
router.get('/settings/holidays', authorize('ADMIN', 'HR', 'PARTNER'), settingsController.getHolidays);
router.post('/settings/holidays', writeLimiter, authorize('ADMIN', 'PARTNER'), settingsController.addHoliday);
router.delete('/settings/holidays/:date', writeLimiter, authorize('ADMIN', 'PARTNER'), settingsController.deleteHoliday);

// ==================== GEO-LOCATION LOGS ====================
router.get('/geo-logs', authorize('ADMIN', 'HR', 'PARTNER'), geoController.getGeoLogs);
router.get('/geo-logs/stats', authorize('ADMIN', 'HR', 'PARTNER'), geoController.getGeoStats);
router.get('/geo-logs/outside-office', authorize('ADMIN', 'HR', 'PARTNER'), geoController.getUsersOutsideOffice);
router.get('/geo-logs/user/:userId', authorize('ADMIN', 'HR', 'PARTNER'), geoController.getUserLocationHistory);
router.get('/geo-logs/:id', authorize('ADMIN', 'HR', 'PARTNER'), geoController.getGeoLogById);
router.post('/geo-logs/export', authorize('ADMIN', 'HR', 'PARTNER'), geoController.exportGeoLogs);
router.post('/geo-logs/verify-location', authorize('ADMIN', 'HR', 'PARTNER'), geoController.verifyLocation);

module.exports = router;
