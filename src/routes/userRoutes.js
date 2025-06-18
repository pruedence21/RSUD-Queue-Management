const express = require('express');
const router = express.Router();

// Controllers
const userController = require('../controllers/userController');

// Middleware
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { apiRateLimit, createOperationRateLimit } = require('../middleware/rateLimiter');
const { 
  validateCreateUserMiddleware,
  validateUpdateUserMiddleware,
  validateUserIdMiddleware,
  validateResetPasswordMiddleware
} = require('../validators/userValidator');

/**
 * User Routes
 * Base path: /api/users
 * All routes require admin access
 */

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/statistics',
  authenticateToken,
  adminOnly,
  userController.getUserStatistics
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id',
  authenticateToken,
  adminOnly,
  validateUserIdMiddleware,
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticateToken,
  adminOnly,
  apiRateLimit,
  validateUserIdMiddleware,
  validateUpdateUserMiddleware,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  adminOnly,
  validateUserIdMiddleware,
  userController.deleteUser
);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-status',
  authenticateToken,
  adminOnly,
  validateUserIdMiddleware,
  userController.toggleUserStatus
);

/**
 * @route   PATCH /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin only)
 */
router.patch('/:id/reset-password',
  authenticateToken,
  adminOnly,
  validateUserIdMiddleware,
  validateResetPasswordMiddleware,
  userController.resetUserPassword
);

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination and filters)
 * @access  Private (Admin only)
 */
router.get('/',
  authenticateToken,
  adminOnly,
  userController.getAllUsers
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  adminOnly,
  createOperationRateLimit,
  validateCreateUserMiddleware,
  userController.createUser
);

module.exports = router;