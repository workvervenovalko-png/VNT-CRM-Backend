/**
 * Authentication Routes
 * Defines all auth-related endpoints
 */

const express = require('express');
const router = express.Router();
const {
    registerAdmin,
    login,
    getMe,
    logout,
    registerValidation,
    loginValidation
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../utils/upload');
const { loginLimiter, registerLimiter } = require('../utils/rateLimiter');

/**
 * @route   POST /api/auth/register
 * @desc    Register new admin with company
 * @access  Public (but only creates ADMIN role)
 */
router.post(
    '/register',
    registerLimiter,
    upload.single('companyLogo'),
    handleUploadError,
    registerValidation,
    registerAdmin
);

/**
 * @route   POST /api/auth/login
 * @desc    Unified login (Admin & Employee)
 * @access  Public
 */
router.post(
    '/login',
    loginLimiter,
    loginValidation,
    login
);

// Backward compatibility routes (both point to unified login)
router.post('/admin/login', loginLimiter, loginValidation, login);
router.post('/employee/login', loginLimiter, loginValidation, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;