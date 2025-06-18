const logger = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Global error handling middleware
 */

/**
 * Handle different types of errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Log error untuk debugging
  logger.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      message = 'Validation Error';
      errors = err.details || err.message;
      break;

    case 'CastError':
      statusCode = 400;
      message = 'Invalid ID format';
      break;

    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'Token tidak valid';
      break;

    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Token sudah expired';
      break;

    case 'UnauthorizedError':
      statusCode = 401;
      message = 'Unauthorized';
      break;

    case 'ForbiddenError':
      statusCode = 403;
      message = 'Forbidden';
      break;

    case 'NotFoundError':
      statusCode = 404;
      message = 'Data tidak ditemukan';
      break;

    case 'ConflictError':
      statusCode = 409;
      message = 'Data sudah ada atau konflik';
      break;

    case 'DatabaseError':
      statusCode = 500;
      message = 'Database error';
      // Jangan expose database error details di production
      if (process.env.NODE_ENV === 'development') {
        errors = err.message;
      }
      break;

    default:
      // Handle MySQL/Database specific errors
      if (err.code) {
        switch (err.code) {
          case 'ER_DUP_ENTRY':
            statusCode = 409;
            message = 'Data sudah ada';
            break;
          case 'ER_NO_REFERENCED_ROW_2':
            statusCode = 400;
            message = 'Referensi data tidak valid';
            break;
          case 'ER_ROW_IS_REFERENCED_2':
            statusCode = 400;
            message = 'Data tidak dapat dihapus karena masih digunakan';
            break;
          case 'ECONNREFUSED':
            statusCode = 503;
            message = 'Database connection failed';
            break;
          default:
            statusCode = 500;
            message = 'Database error';
        }
      }

      // Handle custom error messages
      if (err.message && typeof err.message === 'string') {
        message = err.message;
      }

      // Handle status code from custom errors
      if (err.statusCode) {
        statusCode = err.statusCode;
      }
  }

  // Send error response
  const errorResponse = error(message, errors, statusCode);
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 Not Found
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.method} ${req.url} tidak ditemukan`;
  
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const errorResponse = error(message, null, 404);
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array|Object} errors - Additional error details
 * @returns {Error} Custom error object
 */
const createError = (message, statusCode = 500, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
};

/**
 * Validation error creator
 * @param {string} message - Error message
 * @param {Array|Object} errors - Validation errors
 * @returns {Error} Validation error object
 */
const validationError = (message, errors) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 400;
  error.errors = errors;
  return error;
};

/**
 * Not found error creator
 * @param {string} message - Error message
 * @returns {Error} Not found error object
 */
const notFoundError = (message = 'Data tidak ditemukan') => {
  const error = new Error(message);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  return error;
};

/**
 * Unauthorized error creator
 * @param {string} message - Error message
 * @returns {Error} Unauthorized error object
 */
const unauthorizedError = (message = 'Unauthorized') => {
  const error = new Error(message);
  error.name = 'UnauthorizedError';
  error.statusCode = 401;
  return error;
};

/**
 * Forbidden error creator
 * @param {string} message - Error message
 * @returns {Error} Forbidden error object
 */
const forbiddenError = (message = 'Forbidden') => {
  const error = new Error(message);
  error.name = 'ForbiddenError';
  error.statusCode = 403;
  return error;
};

/**
 * Conflict error creator
 * @param {string} message - Error message
 * @returns {Error} Conflict error object
 */
const conflictError = (message = 'Data sudah ada') => {
  const error = new Error(message);
  error.name = 'ConflictError';
  error.statusCode = 409;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  conflictError
};