const jwtUtils = require('../utils/jwt');
const logger = require('../utils/logger');
const { unauthorizedError, forbiddenError } = require('./errorHandler');

/**
 * Authentication and Authorization middleware
 */

/**
 * Middleware untuk verifikasi JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractToken(authHeader);

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      return next(unauthorizedError('Token tidak ditemukan'));
    }

    // Verify token
    const decoded = jwtUtils.verifyToken(token);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      nama_lengkap: decoded.nama_lengkap
    };

    logger.auth('TOKEN_VERIFY', decoded.username, req.ip, true);
    next();
  } catch (error) {
    logger.auth('TOKEN_VERIFY', 'unknown', req.ip, false);
    next(unauthorizedError(error.message));
  }
};

/**
 * Middleware untuk otorisasi berdasarkan role
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(unauthorizedError('User tidak terautentikasi'));
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed: Insufficient permissions', {
          user: req.user.username,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          url: req.url,
          method: req.method,
          ip: req.ip
        });
        return next(forbiddenError('Anda tidak memiliki akses ke resource ini'));
      }

      logger.debug('Authorization successful', {
        user: req.user.username,
        role: req.user.role,
        url: req.url
      });

      next();
    } catch (error) {
      next(forbiddenError('Gagal verifikasi otorisasi'));
    }
  };
};

/**
 * Middleware khusus untuk admin only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOnly = (req, res, next) => {
  return authorizeRoles(['admin'])(req, res, next);
};

/**
 * Middleware untuk admin atau petugas
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOrPetugas = (req, res, next) => {
  return authorizeRoles(['admin', 'petugas'])(req, res, next);
};

/**
 * Middleware untuk memastikan user hanya bisa akses data mereka sendiri
 * Kecuali admin yang bisa akses semua data
 * @param {string} userIdParam - Parameter name for user ID in request
 * @returns {Function} Middleware function
 */
const ownershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(unauthorizedError('User tidak terautentikasi'));
      }

      const requestedUserId = parseInt(req.params[userIdParam]);
      const currentUserId = parseInt(req.user.id);

      // Admin bisa akses semua data
      if (req.user.role === 'admin') {
        return next();
      }

      // User hanya bisa akses data mereka sendiri
      if (requestedUserId === currentUserId) {
        return next();
      }

      logger.warn('Ownership check failed', {
        user: req.user.username,
        requestedUserId,
        currentUserId,
        url: req.url,
        ip: req.ip
      });

      return next(forbiddenError('Anda hanya bisa mengakses data Anda sendiri'));
    } catch (error) {
      next(forbiddenError('Gagal verifikasi kepemilikan data'));
    }
  };
};

/**
 * Optional authentication middleware
 * Tidak akan error jika token tidak ada, tapi akan set req.user jika token valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractToken(authHeader);

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // Try to verify token
    const decoded = jwtUtils.verifyToken(token);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      nama_lengkap: decoded.nama_lengkap
    };

    logger.debug('Optional auth successful', {
      user: decoded.username,
      url: req.url
    });

    next();
  } catch (error) {
    // Token invalid, continue without authentication
    logger.debug('Optional auth failed, continuing without auth', {
      error: error.message,
      url: req.url
    });
    next();
  }
};

/**
 * Middleware untuk mendapatkan informasi user dari token tanpa validasi ketat
 * Berguna untuk endpoint yang membutuhkan info user tapi tidak strict authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const extractUserInfo = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractToken(authHeader);

    if (token) {
      try {
        const decoded = jwtUtils.verifyToken(token);
        req.user = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          nama_lengkap: decoded.nama_lengkap
        };
      } catch (error) {
        // Token invalid, set anonymous user
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Rate limiting berdasarkan user
 * User yang sudah login mendapat limit lebih tinggi
 * @param {Object} options - Rate limit options
 * @returns {Function} Middleware function
 */
const userBasedRateLimit = (options = {}) => {
  const defaultOptions = {
    authenticatedLimit: 200,
    anonymousLimit: 50,
    windowMs: 15 * 60 * 1000 // 15 minutes
  };

  const config = { ...defaultOptions, ...options };

  return (req, res, next) => {
    // Determine limit based on authentication status
    const limit = req.user ? config.authenticatedLimit : config.anonymousLimit;
    
    // Set custom limit in request for rate limiter
    req.rateLimit = {
      limit: limit,
      windowMs: config.windowMs
    };

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  adminOnly,
  adminOrPetugas,
  ownershipOrAdmin,
  optionalAuth,
  extractUserInfo,
  userBasedRateLimit
};