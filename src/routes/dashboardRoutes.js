// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');

// Semua rute di sini memerlukan autentikasi dan hak akses admin
router.use(authenticateToken, adminOnly, apiRateLimit);

/**
 * @route   GET /api/dashboard/stats
 * @desc    General statistics
 * @access  Private (Admin only)
 */
router.get('/stats', dashboardController.getGeneralStats);

/**
 * @route   GET /api/dashboard/antrian-today
 * @desc    Today's queue statistics
 * @access  Private (Admin only)
 */
router.get('/antrian-today', dashboardController.getAntrianTodayStats);

/**
 * @route   GET /api/dashboard/antrian-week
 * @desc    This week's queue statistics
 * @access  Private (Admin only)
 */
router.get('/antrian-week', dashboardController.getAntrianWeekStats);

/**
 * @route   GET /api/dashboard/activity-log
 * @desc    Recent activities
 * @access  Private (Admin only)
 */
router.get('/activity-log', dashboardController.getActivityLog);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    System alerts
 * @access  Private (Admin only)
 */
router.get('/alerts', dashboardController.getSystemAlerts);

/**
 * @route   GET /api/dashboard/performance
 * @desc    System performance metrics
 * @access  Private (Admin only)
 */
router.get('/performance', dashboardController.getSystemPerformance);

module.exports = router;
