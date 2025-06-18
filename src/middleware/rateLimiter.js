const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Rate limiting middleware untuk berbagai endpoint
 */

/**
 * Custom rate limit handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });

  const errorResponse = error(
    'Terlalu banyak request. Silakan coba lagi nanti.',
    null,
    429
  );
  
  res.status(429).json(errorResponse);
};

/**
 * Rate limiter untuk endpoint login
 * Lebih ketat untuk mencegah brute force attack
 */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 attempt per 15 menit per IP
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting untuk IP lokal dalam development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiter untuk API umum
 * Untuk mencegah spam pada endpoint CRUD
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per 15 menit per IP
  message: 'Terlalu banyak request API. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting untuk IP lokal dalam development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiter untuk operasi CREATE (POST)
 * Lebih ketat untuk operasi yang mengubah data
 */
const createOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 20, // Maksimal 20 create operation per 5 menit per IP
  message: 'Terlalu banyak operasi create. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting untuk IP lokal dalam development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiter untuk endpoint antrian
 * Khusus untuk kios mandiri yang mungkin digunakan intensif
 */
const antrianRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 10, // Maksimal 10 antrian per menit per IP
  message: 'Terlalu banyak permintaan antrian. Silakan tunggu sebentar.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting untuk IP lokal dalam development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiter global yang sangat permisif
 * Untuk mencegah DoS attack ekstrem
 */
const globalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 200, // Maksimal 200 request per menit per IP
  message: 'Terlalu banyak request. Silakan tunggu sebentar.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting untuk IP lokal dalam development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiter untuk password reset
 * Sangat ketat untuk mencegah abuse
 */
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3, // Maksimal 3 reset per jam per IP
  message: 'Terlalu banyak permintaan reset password. Coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting untuk IP lokal dalam development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});

/**
 * Custom rate limiter factory
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limit middleware
 */
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: (req) => {
      // Skip rate limiting untuk IP lokal dalam development
      if (process.env.NODE_ENV === 'development' && 
          (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
        return true;
      }
      return false;
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
  loginRateLimit,
  apiRateLimit,
  createOperationRateLimit,
  antrianRateLimit,
  globalRateLimit,
  passwordResetRateLimit,
  createRateLimit,
  rateLimitHandler
};