const database = require('../config/database');
const logger = require('../utils/logger');
const { createError } = require('../middleware/errorHandler');

/**
 * Base Model class yang menyediakan operasi CRUD dasar
 * Semua model lain akan extend dari class ini
 */
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.connection = database.getConnection();
  }

  /**
   * Get database connection
   * @returns {Object} Database connection
   */
  getConnection() {
    if (!this.connection) {
      this.connection = database.getConnection();
    }
    return this.connection;
  }

  /**
   * Execute query with logging
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query result
   */
  async executeQuery(query, params = []) {
    const startTime = Date.now();
    
    try {
      const connection = this.getConnection();
      const [rows] = await connection.execute(query, params);
      
      const executionTime = Date.now() - startTime;
      logger.dbQuery(query, executionTime, { 
        table: this.tableName,
        rowCount: Array.isArray(rows) ? rows.length : 1
      });
      
      return rows;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Database query failed', {
        query,
        params,
        table: this.tableName,
        executionTime,
        error: error.message
      });
      throw createError('Database operation failed: ' + error.message, 500);
    }
  }

  /**
   * Get all records
   * @param {Object} options - Query options
   * @returns {Promise<Array>} All records
   */
  async findAll(options = {}) {
    const { 
      where = '', 
      orderBy = 'id ASC', 
      limit = null, 
      offset = 0,
      params = []
    } = options;

    let query = `SELECT * FROM ${this.tableName}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return await this.executeQuery(query, params);
  }

  /**
   * Get record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const result = await this.executeQuery(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get single record by condition
   * @param {Object} conditions - Where conditions
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async findOne(conditions = {}) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
      throw createError('Conditions are required for findOne', 400);
    }

    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => conditions[key]);
    
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
    const result = await this.executeQuery(query, values);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get records by condition
   * @param {Object} conditions - Where conditions
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Records
   */
  async findBy(conditions = {}, options = {}) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
      return await this.findAll(options);
    }

    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const values = keys.map(key => conditions[key]);
    
    const { orderBy = 'id ASC', limit = null, offset = 0 } = options;
    
    let query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return await this.executeQuery(query, values);
  }

  /**
   * Create new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record with ID
   */
  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    
    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    const result = await this.executeQuery(query, values);
    
    // Get the created record
    const createdRecord = await this.findById(result.insertId);
    
    logger.info(`Record created in ${this.tableName}`, {
      id: result.insertId,
      table: this.tableName
    });
    
    return createdRecord;
  }

  /**
   * Update record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  async updateById(id, data) {
    // Remove timestamps if they exist in data (will be auto-updated)
    const updateData = { ...data };
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const keys = Object.keys(updateData);
    if (keys.length === 0) {
      throw createError('No data to update', 400);
    }
    
    const values = Object.values(updateData);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    await this.executeQuery(query, [...values, id]);
    
    // Get the updated record
    const updatedRecord = await this.findById(id);
    
    if (updatedRecord) {
      logger.info(`Record updated in ${this.tableName}`, {
        id,
        table: this.tableName
      });
    }
    
    return updatedRecord;
  }

  /**
   * Delete record by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteById(id) {
    // Check if record exists first
    const existingRecord = await this.findById(id);
    if (!existingRecord) {
      return false;
    }
    
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.executeQuery(query, [id]);
    
    logger.info(`Record deleted from ${this.tableName}`, {
      id,
      table: this.tableName
    });
    
    return true;
  }

  /**
   * Count records
   * @param {Object} conditions - Where conditions
   * @returns {Promise<number>} Record count
   */
  async count(conditions = {}) {
    const keys = Object.keys(conditions);
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let values = [];
    
    if (keys.length > 0) {
      const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
      values = keys.map(key => conditions[key]);
      query += ` WHERE ${whereClause}`;
    }
    
    const result = await this.executeQuery(query, values);
    return result[0].count;
  }

  /**
   * Check if record exists
   * @param {Object} conditions - Where conditions
   * @returns {Promise<boolean>} True if exists
   */
  async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * Paginate records
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Records per page
   * @param {Object} conditions - Where conditions
   * @param {string} orderBy - Order by clause
   * @returns {Promise<Object>} Paginated result
   */
  async paginate(page = 1, limit = 10, conditions = {}, orderBy = 'id ASC') {
    const offset = (page - 1) * limit;
    const totalCount = await this.count(conditions);
    const totalPages = Math.ceil(totalCount / limit);
    
    const data = await this.findBy(conditions, { orderBy, limit, offset });
    
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get active records (if table has 'aktif' column)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active records
   */
  async findActive(options = {}) {
    return await this.findBy({ aktif: true }, options);
  }

  /**
   * Soft delete (set aktif = false) if table has 'aktif' column
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  async softDelete(id) {
    return await this.updateById(id, { aktif: false });
  }

  /**
   * Restore soft deleted record
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  async restore(id) {
    return await this.updateById(id, { aktif: true });
  }
}

module.exports = BaseModel;