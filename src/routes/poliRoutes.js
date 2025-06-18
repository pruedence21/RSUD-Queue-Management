const express = require('express');
const router = express.Router();

// Controllers
const poliController = require('../controllers/poliController');

// Middleware
const { authenticateToken, adminOnly, adminOrPetugas } = require('../middleware/auth');
const { apiRateLimit, createOperationRateLimit } = require('../middleware/rateLimiter');
const { 
  validateCreatePoliMiddleware,
  validateUpdatePoliMiddleware,
  validatePoliIdMiddleware,
  validateSearchQueryMiddleware
} = require('../validators/poliValidator');

/**
 * Poli Routes
 * Base path: /api/poli
 */

/**
 * @route   GET /api/poli/statistics
 * @desc    Get poli statistics
 * @access  Private (Admin only)
 */
router.get('/statistics',
  authenticateToken,
  adminOnly,
  poliController.getPoliStatistics
);

/**
 * @route   GET /api/poli/search
 * @desc    Search poli by name
 * @access  Private (Admin/Petugas)
 */
router.get('/search',
  authenticateToken,
  adminOrPetugas,
  validateSearchQueryMiddleware,
  poliController.searchPoli
);

/**
 * @route   GET /api/poli/active
 * @desc    Get active poli only
 * @access  Private (Admin/Petugas)
 */
router.get('/active',
  authenticateToken,
  adminOrPetugas,
  poliController.getActivePoli
);

/**
 * @route   GET /api/poli/with-antrian-count
 * @desc    Get poli with today's antrian count
 * @access  Private (Admin/Petugas)
 */
router.get('/with-antrian-count',
  authenticateToken,
  adminOrPetugas,
  poliController.getPoliWithAntrianCount
);

/**
 * @route   GET /api/poli/code/:kode
 * @desc    Get poli by code
 * @access  Private (Admin/Petugas)
 */
router.get('/code/:kode',
  authenticateToken,
  adminOrPetugas,
  poliController.getPoliByCode
);

/**
 * @route   GET /api/poli/:id/can-delete
 * @desc    Check if poli can be deleted
 * @access  Private (Admin only)
 */
router.get('/:id/can-delete',
  authenticateToken,
  adminOnly,
  validatePoliIdMiddleware,
  poliController.checkCanDelete
);

/**
 * @route   PATCH /api/poli/:id/toggle-status
 * @desc    Toggle poli active status
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-status',
  authenticateToken,
  adminOnly,
  validatePoliIdMiddleware,
  poliController.togglePoliStatus
);

/**
 * @route   GET /api/poli/:id
 * @desc    Get poli by ID
 * @access  Private (Admin/Petugas)
 */
router.get('/:id',
  authenticateToken,
  adminOrPetugas,
  validatePoliIdMiddleware,
  poliController.getPoliById
);

/**
 * @route   PUT /api/poli/:id
 * @desc    Update poli
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticateToken,
  adminOnly,
  apiRateLimit,
  validatePoliIdMiddleware,
  validateUpdatePoliMiddleware,
  poliController.updatePoli
);

/**
 * @route   DELETE /api/poli/:id
 * @desc    Delete poli
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  adminOnly,
  validatePoliIdMiddleware,
  poliController.deletePoli
);

/**
 * @route   GET /api/poli
 * @desc    Get all poli (with pagination)
 * @access  Private (Admin/Petugas)
 */
router.get('/',
  authenticateToken,
  adminOrPetugas,
  poliController.getAllPoli
);

/**
 * @route   POST /api/poli
 * @desc    Create new poli
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  adminOnly,
  createOperationRateLimit,
  validateCreatePoliMiddleware,
  poliController.createPoli
);

module.exports = router;