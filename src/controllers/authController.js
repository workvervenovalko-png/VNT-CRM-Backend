/**
 * Authentication Controller
 * Handles admin registration and dual login (Admin & Employee)
 */

const User = require('../models/User');
const Company = require('../models/Company');
const { ROLES } = require('../models/User');
const { validationResult, body } = require('express-validator');
const { escapeRegex, sanitizeEmail } = require('../utils/securityUtils');

/**
 * Validation rules for admin registration
 */
const registerValidation = [
    body('companyName')
        .trim()
        .notEmpty().withMessage('Company name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Company name must be 2-100 characters'),
    body('fullName')
        .trim()
        .notEmpty().withMessage('Admin full name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail({ gmail_remove_dots: false }),
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid mobile number'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    body('officeAddress')
        .trim()
        .notEmpty().withMessage('Office address is required'),
    body('timezone')
        .trim()
        .notEmpty().withMessage('Timezone is required'),
    body('workingHoursStart')
        .trim()
        .notEmpty().withMessage('Working hours start time is required'),
    body('workingHoursEnd')
        .trim()
        .notEmpty().withMessage('Working hours end time is required')
];

/**
 * Validation rules for login
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail({ gmail_remove_dots: false }),
    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * @desc    Register new Admin with Company (CRM/Sales portal)
 * @route   POST /api/auth/register
 * @access  Public (Admin registration only)
 */
const registerAdmin = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }

        const {
            companyName,
            fullName,
            email,
            mobile,
            password,
            officeAddress,
            latitude,
            longitude,
            timezone,
            workingHoursStart,
            workingHoursEnd
        } = req.body;

        const normalizedEmail = sanitizeEmail(email);

        // SAFETY CHECK: Prevent manual registration of the primary system administrator email
        const systemAdminEmail = process.env.ADMIN_EMAIL || 'work.vervenova.lko@gmail.com';
        if (normalizedEmail === systemAdminEmail.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'This email is reserved for system administration and cannot be registered manually.'
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Check if company already exists
        const companyExists = await Company.findOne({ companyName: { $regex: new RegExp(`^${escapeRegex(companyName)}$`, 'i') } });
        if (companyExists) {
            return res.status(400).json({
                success: false,
                message: 'A company with this name is already registered'
            });
        }

        // Handle company logo
        const companyLogo = req.file ? req.file.filename : null;

        // Create Company
        const company = await Company.create({
            companyName,
            companyLogo,
            officeLocation: {
                address: officeAddress,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            },
            timezone: timezone || 'UTC',
            workingHours: {
                start: workingHoursStart || '09:00',
                end: workingHoursEnd || '18:00'
            }
        });

        // Create Admin User for this company
        const user = await User.create({
            fullName,
            email: normalizedEmail,
            mobile,
            password,
            role: ROLES.ADMIN,
            companyId: company._id
        });

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'Company registration successful',
            data: {
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                },
                company: {
                    id: company._id,
                    name: company.companyName,
                    logo: company.companyLogo
                }
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Unified Login (Admin & Employee)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }

        const { email, password } = req.body;
        const normalizedEmail = sanitizeEmail(email);

        if (!normalizedEmail) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Special Admin Check via ENV
        const adminEmail = process.env.ADMIN_EMAIL || 'work.vervenova.lko@gmail.com';
        const normalizedAdminEmail = adminEmail.toLowerCase().trim();
        const isTargetAdmin = normalizedEmail === normalizedAdminEmail;
        
        // Find user by email
        let user = await User.findOne({ email: normalizedEmail })
            .select('+password')
            .populate('companyId', 'companyName companyLogo isActive timezone workingHours');

        // AUTO-PROVISION Master Admin if not found in DB
        if (!user && isTargetAdmin) {
            // Verify password first before creating anything
            const adminPass = process.env.ADMIN_PASSWORD || 'Puneet@28';
            if (password !== adminPass) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            console.log('Auto-provisioning Master Admin and Company...');
            
            // Create or Find Master Company
            let masterCompany = await Company.findOne({ companyName: 'Verve Nova Tech' });
            if (!masterCompany) {
                masterCompany = await Company.create({
                    companyName: 'Verve Nova Tech',
                    officeLocation: { address: 'Verve Nova Headquarters' },
                    isActive: true
                });
            }

            // Create Master User
            user = await User.create({
                fullName: 'System Administrator',
                email: normalizedEmail,
                password: adminPass, // Will be hashed by pre-save
                mobile: '+910000000000', // Required field
                employeeId: 'ADMIN-001',
                role: ROLES.ADMIN,
                companyId: masterCompany._id,
                isActive: true
            });

            // Re-fetch with populated company
            user = await User.findById(user._id)
                .select('+password')
                .populate('companyId', 'companyName companyLogo isActive timezone workingHours');
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        let isPasswordValid = false;
        
        if (isTargetAdmin) {
            // Master Admin MUST be able to login with ENV password
            const envPass = process.env.ADMIN_PASSWORD || 'Puneet@28';
            isPasswordValid = (password === envPass);
            
            // Fallback: Check DB password if ENV check fails (e.g. if record was created with different pass)
            if (!isPasswordValid) {
                isPasswordValid = await user.comparePassword(password);
            }
        } else {
            // Standard User
            isPasswordValid = await user.comparePassword(password);
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Contact support.'
            });
        }

        // Check if company is active
        if (user.companyId && !user.companyId.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your company account is inactive. Contact support.'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate token
        const token = user.generateAuthToken();

        // Determine redirect based on role
        let redirectTo;
        if (user.role === ROLES.ADMIN) {
            redirectTo = '/admin';
        } else {
            switch (user.role) {
                case ROLES.HR:
                    redirectTo = '/hr/dashboard';
                    break;
                case ROLES.MANAGER:
                    redirectTo = '/manager/dashboard';
                    break;
                case ROLES.INTERN:
                    redirectTo = '/intern/dashboard';
                    break;
                case ROLES.SALES:
                    redirectTo = '/crm';
                    break;
                default:
                    redirectTo = '/employee/dashboard';
            }
        }

        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.fullName}!`,
            data: {
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    designation: user.designation,
                    lastLogin: user.lastLogin
                },
                company: user.companyId ? {
                    id: user.companyId._id,
                    name: user.companyId.companyName,
                    logo: user.companyId.companyLogo,
                    workingHours: user.companyId.workingHours,
                    timezone: user.companyId.timezone
                } : null,
                redirectTo
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('companyId', 'companyName companyLogo timezone workingHours');

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role,
                    department: user.department,
                    designation: user.designation,
                    profilePicture: user.profilePicture,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                },
                company: user.companyId
            }
        });
    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data'
        });
    }
};

/**
 * @desc    Logout user (client-side token removal, server-side logging)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
    try {
        // In a production app, you might want to blacklist the token
        // For now, we just send a success response
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

/**
 * @desc    Initiate forgot password process (Generate random OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const initiateForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = sanitizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            // SECURITY: Don't reveal if user exists. Just return success.
            return res.status(200).json({
                success: true,
                message: 'If your email is registered, you will receive an OTP shortly.'
            });
        }

        // Generate 6-digit random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP and expiry (10 mins)
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        // Send OTP Email
        const { sendEmail } = require('../utils/emailService');
        const { getOTPEmailTemplate } = require('../utils/emailTemplates');
        
        const emailHtml = getOTPEmailTemplate(user.fullName, otp);
        await sendEmail({
            to: user.email,
            subject: 'Your Password Reset OTP - Verve Nova Tech',
            html: emailHtml,
            from: 'SUPPORT'
        });

        res.status(200).json({
            success: true,
            message: 'OTP sent to your registered email address'
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate password reset' });
    }
};

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = sanitizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user || user.resetPasswordOTP !== otp.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: 'The security code you entered is incorrect'
            });
        }

        if (new Date(user.resetPasswordOTPExpire) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This security code has expired. Please request a new one.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Identity verified successfully'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
};

/**
 * @desc    Reset password using verified OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const normalizedEmail = sanitizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail });

        if (!user || user.resetPasswordOTP !== otp.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired security code. Please restart the recovery process.'
            });
        }

        if (new Date(user.resetPasswordOTPExpire) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This recovery session has expired. Please request a new code.'
            });
        }

        // Update password and clear OTP fields
        user.password = password;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

module.exports = {
    registerAdmin,
    login,
    adminLogin: login,
    employeeLogin: login,
    getMe,
    logout,
    initiateForgotPassword,
    verifyOTP,
    resetPassword,
    registerValidation,
    loginValidation
};