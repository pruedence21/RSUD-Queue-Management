const { Sequelize } = require('sequelize');
const config = require('./env');

let sequelize;

// Database configuration based on type
const getDatabaseConfig = () => {
  const dbType = config.database.type || 'mysql';
  
  const baseConfig = {
    host: config.database.host,
    port: config.database.port,
    dialect: dbType,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  };

  // MySQL specific configuration
  if (dbType === 'mysql') {
    return {
      ...baseConfig,
      dialectOptions: {
        timezone: '+07:00',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    };
  }

  // PostgreSQL specific configuration
  if (dbType === 'postgres' || dbType === 'postgresql') {
    return {
      ...baseConfig,
      dialect: 'postgres',
      dialectOptions: {
        timezone: '+07:00'
      }
    };
  }

  throw new Error(`Unsupported database type: ${dbType}`);
};

// Initialize Sequelize
const initializeDatabase = () => {
  try {
    const dbConfig = getDatabaseConfig();
    
    sequelize = new Sequelize(
      config.database.database,
      config.database.user,
      config.database.password,
      dbConfig
    );

    console.log(`✅ Sequelize initialized for ${config.database.type || 'mysql'}`);
    return sequelize;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
};

// Database connection and testing
class Database {
  constructor() {
    this.sequelize = null;
  }

  async connect() {
    try {
      if (!this.sequelize) {
        this.sequelize = initializeDatabase();
      }
      
      await this.sequelize.authenticate();
      console.log(`✅ Database connection established successfully (${config.database.type || 'mysql'})`);
      return this.sequelize;
    } catch (error) {
      console.error('❌ Unable to connect to database:', error.message);
      throw error;
    }
  }

  async createDatabase() {
    try {
      const dbType = config.database.type || 'mysql';
      let tempSequelize;

      if (dbType === 'mysql') {
        const mysql = require('mysql2/promise');
        const tempConnection = await mysql.createConnection({
          host: config.database.host,
          port: config.database.port,
          user: config.database.user,
          password: config.database.password,
          timezone: '+07:00'
        });

        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database.database}\``);
        console.log(`✅ MySQL Database '${config.database.database}' created/exists`);
        await tempConnection.end();
      } else if (dbType === 'postgres' || dbType === 'postgresql') {
        const { Client } = require('pg');
        const tempClient = new Client({
          host: config.database.host,
          port: config.database.port,
          user: config.database.user,
          password: config.database.password,
          database: 'postgres' // Connect to default postgres database
        });

        await tempClient.connect();
        
        // Check if database exists
        const result = await tempClient.query(
          'SELECT 1 FROM pg_database WHERE datname = $1',
          [config.database.database]
        );

        if (result.rows.length === 0) {
          await tempClient.query(`CREATE DATABASE "${config.database.database}"`);
          console.log(`✅ PostgreSQL Database '${config.database.database}' created`);
        } else {
          console.log(`✅ PostgreSQL Database '${config.database.database}' already exists`);
        }

        await tempClient.end();
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to create database:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.sequelize) {
        await this.connect();
      }
      
      await this.sequelize.authenticate();
      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      throw error;
    }
  }

  async syncModels(options = {}) {
    try {
      if (!this.sequelize) {
        await this.connect();
      }

      await this.sequelize.sync(options);
      console.log('✅ Database models synchronized');
      return true;
    } catch (error) {
      console.error('❌ Failed to sync database models:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('✅ Database connection closed');
    }
  }

  getSequelize() {
    return this.sequelize;
  }

  // Legacy method for backward compatibility
  getConnection() {
    return this.sequelize;
  }

  // Cross-database query method
  async query(sql, params = []) {
    try {
      if (!this.sequelize) {
        await this.connect();
      }
      
      const [results, metadata] = await this.sequelize.query(sql, {
        replacements: params,
        type: this.sequelize.QueryTypes.SELECT
      });
      
      return results;
    } catch (error) {
      console.error('❌ Query failed:', error.message);
      throw error;
    }
  }

  // Cross-database execute method
  async execute(sql, params = []) {
    try {
      if (!this.sequelize) {
        await this.connect();
      }
      
      const results = await this.sequelize.query(sql, {
        replacements: params
      });
      
      return results;
    } catch (error) {
      console.error('❌ Execute failed:', error.message);
      throw error;
    }
  }

  // Database-specific SQL helpers
  getDbType() {
    return config.database.type || 'mysql';
  }

  // Auto-increment syntax
  getAutoIncrementSyntax() {
    const dbType = this.getDbType();
    if (dbType === 'mysql') {
      return 'AUTO_INCREMENT';
    } else if (dbType === 'postgres' || dbType === 'postgresql') {
      return 'SERIAL';
    }
    return 'AUTO_INCREMENT';
  }

  // Timestamp syntax
  getTimestampSyntax() {
    const dbType = this.getDbType();
    if (dbType === 'mysql') {
      return {
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      };
    } else if (dbType === 'postgres' || dbType === 'postgresql') {
      return {
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      };
    }
  }

  // Engine/charset syntax
  getEngineCharsetSyntax() {
    const dbType = this.getDbType();
    if (dbType === 'mysql') {
      return 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    }
    return ''; // PostgreSQL doesn't need this
  }

  // Primary key syntax
  getPrimaryKeySyntax() {
    const dbType = this.getDbType();
    if (dbType === 'mysql') {
      return 'INT AUTO_INCREMENT PRIMARY KEY';
    } else if (dbType === 'postgres' || dbType === 'postgresql') {
      return 'SERIAL PRIMARY KEY';
    }
    return 'INT AUTO_INCREMENT PRIMARY KEY';
  }

  // Boolean syntax
  getBooleanSyntax() {
    const dbType = this.getDbType();
    if (dbType === 'mysql') {
      return 'BOOLEAN';
    } else if (dbType === 'postgres' || dbType === 'postgresql') {
      return 'BOOLEAN';
    }
    return 'BOOLEAN';
  }

  // Text syntax
  getTextSyntax() {
    const dbType = this.getDbType();
    if (dbType === 'mysql') {
      return 'TEXT';
    } else if (dbType === 'postgres' || dbType === 'postgresql') {
      return 'TEXT';
    }
    return 'TEXT';
  }
}

// Export singleton instance
const database = new Database();

// Export both the instance and Sequelize for model definitions
module.exports = database;
module.exports.Sequelize = Sequelize;
module.exports.sequelize = sequelize;