const express = require('express');
const router = express.Router();

// Controllers
const settingsController = require('../controllers/settingsController');

// Middleware
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const {
  validateCreateSettingMiddleware,
  validateUpdateSettingMiddleware,
  validateBatchUpdateSettingsMiddleware,
  validateKeySettingMiddleware
} = require('../validators/settingsValidator');

/**
 * Settings Routes
 * Base path: /api/settings
 * All routes require admin access
 */

/**
 * @route   POST /api/settings
 * @desc    Create new setting
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  adminOnly,
  apiRateLimit,
  validateCreateSettingMiddleware,
  settingsController.createSetting
);

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private (Admin only)
 */
router.get('/',
  authenticateToken,
  adminOnly,
  settingsController.getAllSettings
);

/**
 * @route   GET /api/settings/:key
 * @desc    Get setting by key
 * @access  Private (Admin only)
 */
router.get('/:key',
  authenticateToken,
  adminOnly,
  validateKeySettingMiddleware,
  settingsController.getSettingByKey
);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update setting by key
 * @access  Private (Admin only)
 */
router.put('/:key',
  authenticateToken,
  adminOnly,
  apiRateLimit,
  validateKeySettingMiddleware,
  validateUpdateSettingMiddleware,
  settingsController.updateSetting
);

/**
 * @route   POST /api/settings/batch
 * @desc    Batch update settings
 * @access  Private (Admin only)
 */
router.post('/batch',
  authenticateToken,
  adminOnly,
  apiRateLimit,
  validateBatchUpdateSettingsMiddleware,
  settingsController.batchUpdateSettings
);

module.exports = router;