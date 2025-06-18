/**
 * Response utility untuk format response API yang konsisten
 */

/**
 * Format response sukses
 * @param {string} message - Pesan sukses
 * @param {Object} data - Data yang akan dikirim
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Response object
 */
const success = (message, data = null, statusCode = 200) => {
  const response = {
    status: 'success',
    message: message,
    statusCode: statusCode
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Format response error
 * @param {string} message - Pesan error
 * @param {Array|Object} errors - Detail errors
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Response object
 */
const error = (message, errors = null, statusCode = 400) => {
  const response = {
    status: 'error',
    message: message,
    statusCode: statusCode
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return response;
};

/**
 * Format response untuk data pagination
 * @param {string} message - Pesan sukses
 * @param {Array} data - Data array
 * @param {Object} pagination - Info pagination
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Response object
 */
const paginated = (message, data, pagination, statusCode = 200) => {
  return {
    status: 'success',
    message: message,
    statusCode: statusCode,
    data: data,
    pagination: {
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || data.length,
      itemsPerPage: pagination.itemsPerPage || 10
    }
  };
};

/**
 * Send response dengan format yang benar
 * @param {Object} res - Express response object
 * @param {Object} responseData - Data response dari success/error/paginated
 */
const send = (res, responseData) => {
  return res.status(responseData.statusCode).json(responseData);
};

module.exports = {
  success,
  error,
  paginated,
  send
};