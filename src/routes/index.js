const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const poliRoutes = require('./poliRoutes');
const dokterRoutes = require('./dokterRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');
const antrianRoutes = require('./antrianRoutes');
const dashboardRoutes = require('./dashboardRoutes'); // Tambahkan ini

// Middleware
const { globalRateLimit } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

/**
 * Main API Routes
 * Base path: /api
 */

// Apply global rate limiting to all API routes
router.use(globalRateLimit);

// Log all API requests
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('API Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.username : 'anonymous'
  });

  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.httpRequest(req, res, responseTime);
  });

  next();
});

/**
 * API Health Check
 * @route   GET /api/health
 * @desc    API health status
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API Information
 * @route   GET /api
 * @desc    API information and available endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'RSUD Queue System API v2.0',
    version: '2.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          'POST /login - User login',
          'POST /logout - User logout',
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
          'PUT /change-password - Change password',
          'POST /refresh - Refresh token',
          'GET /verify - Verify token',
          'GET /status - Get auth status'
        ]
      },
      poli: {
        base: '/api/poli',
        endpoints: [
          'GET / - Get all poli',
          'GET /:id - Get poli by ID',
          'POST / - Create poli (Admin)',
          'PUT /:id - Update poli (Admin)',
          'DELETE /:id - Delete poli (Admin)',
          'GET /active - Get active poli',
          'GET /search - Search poli',
          'GET /statistics - Get statistics (Admin)',
          'PATCH /:id/toggle-status - Toggle status (Admin)'
        ]
      },
      dokter: {
        base: '/api/dokter',
        endpoints: [
          'GET / - Get all dokter',
          'GET /:id - Get dokter by ID',
          'POST / - Create dokter (Admin)',
          'PUT /:id - Update dokter (Admin)',
          'DELETE /:id - Delete dokter (Admin)',
          'GET /active - Get active dokter',
          'GET /by-poli/:poliId - Get dokter by poli',
          'GET /search - Search dokter',
          'GET /statistics - Get statistics (Admin)',
          'PATCH /:id/toggle-status - Toggle status (Admin)'
        ]
      },
      users: {
        base: '/api/users',
        endpoints: [
          'GET / - Get all users (Admin)',
          'GET /:id - Get user by ID (Admin)',
          'POST / - Create user (Admin)',
          'PUT /:id - Update user (Admin)',
          'DELETE /:id - Delete user (Admin)',
          'PATCH /:id/toggle-status - Toggle status (Admin)',
          'PATCH /:id/reset-password - Reset password (Admin)',
          'GET /statistics - Get statistics (Admin)'
        ]
      },
      settings: {
        base: '/api/settings',
        endpoints: [
          'GET / - Get all settings (Admin)',
          'GET /:key - Get setting by key (Admin)',
          'PUT /:key - Update setting by key (Admin)',
          'POST /batch - Batch update settings (Admin)'
        ]
      },
      antrian: {
        base: '/api/antrian',
        endpoints: [
          'GET / - Get all antrian',
          'GET /:id - Get antrian by ID',
          'POST / - Create antrian',
          'PUT /:id - Update antrian',
          'DELETE /:id - Delete antrian (Admin)',
          'PATCH /:id/status - Update status',
          'GET /poli/:poliId - Get antrian by poli',
          'GET /dokter/:dokterId - Get antrian by dokter',
          'GET /next/:poliId - Get next antrian',
          'POST /call/:poliId - Call next antrian',
          'GET /current/:poliId - Get current antrian',
          'GET /statistics - Get statistics',
          'GET /search - Search antrian',
          'GET /display - Display data (Public)'
        ]
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/poli', poliRoutes);
router.use('/dokter', dokterRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/antrian', antrianRoutes);
router.use('/dashboard', dashboardRoutes); // Tambahkan ini

// 404 handler for API routes
router.use('*', (req, res) => {
  logger.warn('API 404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    statusCode: 404,
    availableEndpoints: '/api'
  });
});

module.exports = router;