const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');

// Middleware
const { authenticateToken } = require('../middleware/auth');
const { loginRateLimit, passwordResetRateLimit } = require('../middleware/rateLimiter');
const { 
  validateLoginMiddleware,
  validateChangePasswordMiddleware,
  validateResetPasswordMiddleware
} = require('../validators/authValidator');

/**
 * Authentication Routes
 * Base path: /api/auth
 */

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', 
  loginRateLimit,
  validateLoginMiddleware,
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticateToken,
  validateChangePasswordMiddleware,
  authController.changePassword
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  authController.refreshToken
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify',
  authenticateToken,
  authController.verifyToken
);

/**
 * @route   GET /api/auth/status
 * @desc    Get authentication status
 * @access  Public
 */
router.get('/status',
  authController.getAuthStatus
);

module.exports = router;