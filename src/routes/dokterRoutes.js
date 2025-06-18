const express = require('express');
const router = express.Router();

// Controllers
const dokterController = require('../controllers/dokterController');

// Middleware
const { authenticateToken, adminOnly, adminOrPetugas } = require('../middleware/auth');
const { apiRateLimit, createOperationRateLimit } = require('../middleware/rateLimiter');
const { 
  validateCreateDokterMiddleware,
  validateUpdateDokterMiddleware,
  validateDokterIdMiddleware,
  validatePoliIdParamMiddleware,
  validateSearchQueryMiddleware
} = require('../validators/dokterValidator');

/**
 * Dokter Routes
 * Base path: /api/dokter
 */

/**
 * @route   GET /api/dokter/statistics
 * @desc    Get dokter statistics
 * @access  Private (Admin only)
 */
router.get('/statistics',
  authenticateToken,
  adminOnly,
  dokterController.getDokterStatistics
);

/**
 * @route   GET /api/dokter/search
 * @desc    Search dokter by name or specialization
 * @access  Private (Admin/Petugas)
 */
router.get('/search',
  authenticateToken,
  adminOrPetugas,
  validateSearchQueryMiddleware,
  dokterController.searchDokter
);

/**
 * @route   GET /api/dokter/active
 * @desc    Get active dokter only
 * @access  Private (Admin/Petugas)
 */
router.get('/active',
  authenticateToken,
  adminOrPetugas,
  dokterController.getActiveDokter
);

/**
 * @route   GET /api/dokter/by-poli/:poliId
 * @desc    Get dokter by poli ID
 * @access  Private (Admin/Petugas)
 */
router.get('/by-poli/:poliId',
  authenticateToken,
  adminOrPetugas,
  validatePoliIdParamMiddleware,
  dokterController.getDokterByPoli
);

/**
 * @route   GET /api/dokter/count-by-poli/:poliId
 * @desc    Get dokter count by poli ID
 * @access  Private (Admin/Petugas)
 */
router.get('/count-by-poli/:poliId',
  authenticateToken,
  adminOrPetugas,
  validatePoliIdParamMiddleware,
  dokterController.getDokterCountByPoli
);

/**
 * @route   GET /api/dokter/:id/can-delete
 * @desc    Check if dokter can be deleted
 * @access  Private (Admin only)
 */
router.get('/:id/can-delete',
  authenticateToken,
  adminOnly,
  validateDokterIdMiddleware,
  dokterController.checkCanDelete
);

/**
 * @route   PATCH /api/dokter/:id/toggle-status
 * @desc    Toggle dokter active status
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-status',
  authenticateToken,
  adminOnly,
  validateDokterIdMiddleware,
  dokterController.toggleDokterStatus
);

/**
 * @route   GET /api/dokter/:id
 * @desc    Get dokter by ID
 * @access  Private (Admin/Petugas)
 */
router.get('/:id',
  authenticateToken,
  adminOrPetugas,
  validateDokterIdMiddleware,
  dokterController.getDokterById
);

/**
 * @route   PUT /api/dokter/:id
 * @desc    Update dokter
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticateToken,
  adminOnly,
  apiRateLimit,
  validateDokterIdMiddleware,
  validateUpdateDokterMiddleware,
  dokterController.updateDokter
);

/**
 * @route   DELETE /api/dokter/:id
 * @desc    Delete dokter
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  adminOnly,
  validateDokterIdMiddleware,
  dokterController.deleteDokter
);

/**
 * @route   GET /api/dokter
 * @desc    Get all dokter (with pagination and filters)
 * @access  Private (Admin/Petugas)
 */
router.get('/',
  authenticateToken,
  adminOrPetugas,
  dokterController.getAllDokter
);

/**
 * @route   POST /api/dokter
 * @desc    Create new dokter
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  adminOnly,
  createOperationRateLimit,
  validateCreateDokterMiddleware,
  dokterController.createDokter
);

module.exports = router;