/**
 * Logger utility untuk sistem logging yang konsisten
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Get current timestamp in WIB format
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return wibTime.toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

/**
 * Log info message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  const logMessage = formatMessage('INFO', message, meta);
  console.log(`${colors.blue}${logMessage}${colors.reset}`);
};

/**
 * Log success message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const success = (message, meta = {}) => {
  const logMessage = formatMessage('SUCCESS', message, meta);
  console.log(`${colors.green}${logMessage}${colors.reset}`);
};

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  const logMessage = formatMessage('WARN', message, meta);
  console.warn(`${colors.yellow}${logMessage}${colors.reset}`);
};

/**
 * Log error message
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or metadata
 */
const error = (message, error = {}) => {
  let meta = {};
  
  if (error instanceof Error) {
    meta = {
      error: error.message,
      stack: error.stack
    };
  } else if (typeof error === 'object') {
    meta = error;
  }
  
  const logMessage = formatMessage('ERROR', message, meta);
  console.error(`${colors.red}${logMessage}${colors.reset}`);
};

/**
 * Log debug message (only in development)
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    const logMessage = formatMessage('DEBUG', message, meta);
    console.log(`${colors.dim}${logMessage}${colors.reset}`);
  }
};

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} responseTime - Response time in ms
 */
const httpRequest = (req, res, responseTime) => {
  const { method, url, ip } = req;
  const { statusCode } = res;
  
  const statusColor = statusCode >= 400 ? colors.red : 
                     statusCode >= 300 ? colors.yellow : 
                     colors.green;
  
  const message = `${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`;
  console.log(`${colors.cyan}[${getTimestamp()}] [HTTP] ${statusColor}${message}${colors.reset}`);
};

/**
 * Log database query
 * @param {string} query - SQL query
 * @param {number} executionTime - Execution time in ms
 * @param {Object} meta - Additional metadata
 */
const dbQuery = (query, executionTime, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    const shortQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
    const message = `DB Query: ${shortQuery} - ${executionTime}ms`;
    debug(message, meta);
  }
};

/**
 * Log authentication events
 * @param {string} event - Auth event type
 * @param {string} username - Username
 * @param {string} ip - IP address
 * @param {boolean} success - Success status
 */
const auth = (event, username, ip, success = true) => {
  const status = success ? 'SUCCESS' : 'FAILED';
  const color = success ? colors.green : colors.red;
  const message = `AUTH ${event} - User: ${username} - IP: ${ip} - Status: ${status}`;
  console.log(`${color}[${getTimestamp()}] [AUTH] ${message}${colors.reset}`);
};

/**
 * Log socket events
 * @param {string} event - Socket event
 * @param {string} socketId - Socket ID
 * @param {Object} meta - Additional metadata
 */
const socket = (event, socketId, meta = {}) => {
  const message = `Socket ${event} - ID: ${socketId}`;
  console.log(`${colors.magenta}[${getTimestamp()}] [SOCKET] ${message}${colors.reset}`);
  if (Object.keys(meta).length > 0) {
    console.log(`${colors.dim}  Meta: ${JSON.stringify(meta)}${colors.reset}`);
  }
};

/**
 * Log system events
 * @param {string} message - System message
 * @param {Object} meta - Additional metadata
 */
const system = (message, meta = {}) => {
  const logMessage = formatMessage('SYSTEM', message, meta);
  console.log(`${colors.bright}${colors.white}${logMessage}${colors.reset}`);
};

module.exports = {
  info,
  success,
  warn,
  error,
  debug,
  httpRequest,
  dbQuery,
  auth,
  socket,
  system
};