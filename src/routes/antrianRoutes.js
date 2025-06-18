const express = require('express');
const router = express.Router();

// Controllers
const antrianController = require('../controllers/antrianController');

// Middleware
const { authenticateToken, adminOnly, adminOrPetugas, extractUserInfo } = require('../middleware/auth');
const { apiRateLimit, createOperationRateLimit, antrianRateLimit } = require('../middleware/rateLimiter');
const { 
  validateCreateAntrianMiddleware,
  validateUpdateAntrianMiddleware,
  validateUpdateStatusMiddleware,
  validateAntrianIdMiddleware,
  validateQueryParamsMiddleware,
  validateSearchQueryMiddleware
} = require('../validators/antrianValidator');

/**
 * Antrian Routes
 * Base path: /api/antrian
 */

/**
 * @route   GET /api/antrian/statistics/poli
 * @desc    Get antrian statistics by poli
 * @access  Private (Admin/Petugas)
 */
router.get('/statistics/poli',
  authenticateToken,
  adminOrPetugas,
  antrianController.getAntrianStatisticsByPoli
);

/**
 * @route   GET /api/antrian/statistics
 * @desc    Get antrian statistics
 * @access  Private (Admin/Petugas)
 */
router.get('/statistics',
  authenticateToken,
  adminOrPetugas,
  antrianController.getAntrianStatistics
);

/**
 * @route   GET /api/antrian/search
 * @desc    Search antrian by nomor or nama pasien
 * @access  Private (Admin/Petugas)
 */
router.get('/search',
  authenticateToken,
  adminOrPetugas,
  validateSearchQueryMiddleware,
  antrianController.searchAntrian
);

/**
 * @route   GET /api/antrian/display
 * @desc    Get today's antrian for display screens
 * @access  Public (for display purposes)
 */
router.get('/display',
  extractUserInfo, // Optional auth for logging
  antrianController.getTodayAntrianForDisplay
);

/**
 * @route   GET /api/antrian/poli/:poliId
 * @desc    Get antrian by poli ID
 * @access  Private (Admin/Petugas)
 */
router.get('/poli/:poliId',
  authenticateToken,
  adminOrPetugas,
  antrianController.getAntrianByPoli
);

/**
 * @route   GET /api/antrian/dokter/:dokterId
 * @desc    Get antrian by dokter ID
 * @access  Private (Admin/Petugas)
 */
router.get('/dokter/:dokterId',
  authenticateToken,
  adminOrPetugas,
  antrianController.getAntrianByDokter
);

/**
 * @route   GET /api/antrian/next/:poliId
 * @desc    Get next antrian to call
 * @access  Private (Admin/Petugas)
 */
router.get('/next/:poliId',
  authenticateToken,
  adminOrPetugas,
  antrianController.getNextAntrian
);

/**
 * @route   POST /api/antrian/call/:poliId
 * @desc    Call next antrian
 * @access  Private (Admin/Petugas)
 */
router.post('/call/:poliId',
  authenticateToken,
  adminOrPetugas,
  antrianController.callNextAntrian
);

/**
 * @route   GET /api/antrian/current/:poliId
 * @desc    Get current antrian being called
 * @access  Private (Admin/Petugas)
 */
router.get('/current/:poliId',
  authenticateToken,
  adminOrPetugas,
  antrianController.getCurrentAntrian
);

/**
 * @route   GET /api/antrian/:id/waiting-time
 * @desc    Get waiting time estimation for antrian
 * @access  Private (Admin/Petugas)
 */
router.get('/:id/waiting-time',
  authenticateToken,
  adminOrPetugas,
  validateAntrianIdMiddleware,
  antrianController.getWaitingTimeEstimation
);

/**
 * @route   PATCH /api/antrian/:id/status
 * @desc    Update antrian status
 * @access  Private (Admin/Petugas)
 */
router.patch('/:id/status',
  authenticateToken,
  adminOrPetugas,
  apiRateLimit,
  validateAntrianIdMiddleware,
  validateUpdateStatusMiddleware,
  antrianController.updateAntrianStatus
);

/**
 * @route   GET /api/antrian/:id
 * @desc    Get antrian by ID
 * @access  Private (Admin/Petugas)
 */
router.get('/:id',
  authenticateToken,
  adminOrPetugas,
  validateAntrianIdMiddleware,
  antrianController.getAntrianById
);

/**
 * @route   PUT /api/antrian/:id
 * @desc    Update antrian
 * @access  Private (Admin/Petugas)
 */
router.put('/:id',
  authenticateToken,
  adminOrPetugas,
  apiRateLimit,
  validateAntrianIdMiddleware,
  validateUpdateAntrianMiddleware,
  antrianController.updateAntrian
);

/**
 * @route   DELETE /api/antrian/:id
 * @desc    Delete antrian
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  adminOnly,
  validateAntrianIdMiddleware,
  antrianController.deleteAntrian
);

/**
 * @route   GET /api/antrian
 * @desc    Get all antrian (with pagination and filters)
 * @access  Private (Admin/Petugas)
 */
router.get('/',
  authenticateToken,
  adminOrPetugas,
  validateQueryParamsMiddleware,
  antrianController.getAllAntrian
);

/**
 * @route   POST /api/antrian
 * @desc    Create new antrian
 * @access  Private (Admin/Petugas)
 */
router.post('/',
  authenticateToken,
  adminOrPetugas,
  antrianRateLimit, // Special rate limit for antrian creation
  validateCreateAntrianMiddleware,
  antrianController.createAntrian
);

module.exports = router;