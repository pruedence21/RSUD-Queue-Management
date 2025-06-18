const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/env');
const database = require('./config/database');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import model initialization
const { initializeModels } = require('./models/index');

// Import routes
const apiRoutes = require('./routes/index');

const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production
  crossOriginEmbedderPolicy: false
}));

/**
 * CORS Configuration
 */
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * Body Parsing Middleware
 */
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

/**
 * Trust proxy (untuk reverse proxy seperti nginx)
 */
app.set('trust proxy', 1);

/**
 * Request Logging Middleware
 */
app.use((req, res, next) => {
  // Skip logging untuk health check dan static files
  if (req.url === '/health' || req.url.startsWith('/public')) {
    return next();
  }

  const startTime = Date.now();
  
  // Log request
  logger.debug('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    if (responseTime > 1000) { // Log slow requests
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
});

/**
 * Static Files Middleware
 */
app.use('/public', express.static('public', {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Admin Panel Static Files
app.use('/admin', express.static('public/admin', {
  maxAge: process.env.NODE_ENV === 'production' ? '12h' : 0
}));

/**
 * Basic Routes
 */

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Selamat datang di RSUD Queue System API v2.0',
    version: config.app.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: {
      api: '/api',
      health: '/health'
    }
  });
});

// Health check endpoint (enhanced)
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: config.app.version,
    database: {
      status: 'unknown',
      responseTime: null
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };

  try {
    const dbStart = Date.now();
    await database.testConnection();
    const dbResponseTime = Date.now() - dbStart;
    
    healthCheck.database = {
      status: 'connected',
      responseTime: `${dbResponseTime}ms`,
      host: config.database.host,
      database: config.database.database
    };
    
    res.json(healthCheck);
  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.database = {
      status: 'disconnected',
      error: error.message
    };
    
    logger.error('Health check failed', error);
    res.status(503).json(healthCheck);
  }
});

/**
 * API Routes
 */
app.use('/api', apiRoutes);

/**
 * Admin Panel Routes (SPA catch-all)
 */
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

/**
 * API Documentation endpoint (placeholder)
 */
app.get('/api/docs', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Documentation',
    version: '2.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      login: 'POST /api/auth/login'
    },
    endpoints: {
      authentication: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password',
        refresh: 'POST /api/auth/refresh'
      },
      poli: {
        list: 'GET /api/poli',
        create: 'POST /api/poli',
        get: 'GET /api/poli/:id',
        update: 'PUT /api/poli/:id',
        delete: 'DELETE /api/poli/:id',
        search: 'GET /api/poli/search',
        active: 'GET /api/poli/active'
      }
    },
    responseFormat: {
      success: {
        status: 'success',
        message: 'Description of the operation',
        data: 'Actual data or null'
      },
      error: {
        status: 'error',
        message: 'Error description',
        errors: 'Array of detailed errors (optional)'
      }
    }
  });
});

/**
 * Error Handling Middleware
 * Harus berada di akhir setelah semua routes
 */

// 404 Handler untuk routes yang tidak ditemukan
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

/**
 * Initialize Database and Models
 */
const initializeApp = async () => {
  try {
    logger.system('🚀 Initializing RSUD Queue System...');
    
    // Create database if it doesn't exist
    await database.createDatabase();
    logger.system('✅ Database created/verified');
    
    // Connect to database
    await database.connect();
    logger.system('✅ Database connected successfully');
    
    // Initialize all models
    await initializeModels();
    logger.system('✅ Models initialized successfully');
    
    // Sync database models (create tables if they don't exist)
    await database.syncModels({ 
      alter: process.env.NODE_ENV === 'development' // Only alter in development
    });
    logger.system('✅ Database models synchronized');
    
    logger.system('🎉 Application initialization completed successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    throw error;
  }
};

/**
 * Graceful Shutdown Handler
 */
process.on('SIGTERM', () => {
  logger.system('SIGTERM received, shutting down gracefully');
  database.close().finally(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.system('SIGINT received, shutting down gracefully');
  database.close().finally(() => process.exit(0));
});

// Export both app and initialization function
module.exports = app;
module.exports.initializeApp = initializeApp;