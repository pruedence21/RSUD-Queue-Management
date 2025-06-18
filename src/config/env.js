require('dotenv').config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rsud_queue_system'
  },
  
  // Application
  app: {
    name: process.env.APP_NAME || 'RSUD Queue System',
    version: process.env.APP_VERSION || '1.0.0'
  }
};

module.exports = config;