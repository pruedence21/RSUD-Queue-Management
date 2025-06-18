const { Model } = require('sequelize');

/**
 * Base Model class that extends Sequelize Model
 * Provides common functionality for all models
 */
class BaseModel extends Model {
  /**
   * Convert model instance to JSON with cleaned data
   */
  toJSON() {
    const values = Object.assign({}, this.get());
    
    // Remove sensitive fields if they exist
    delete values.password;
    delete values.token;
    delete values.refresh_token;
    
    return values;
  }

  /**
   * Get formatted creation date
   */
  getCreatedDate() {
    return this.created_at ? this.created_at.toLocaleDateString('id-ID') : null;
  }

  /**
   * Get formatted update date
   */
  getUpdatedDate() {
    return this.updated_at ? this.updated_at.toLocaleDateString('id-ID') : null;
  }

  /**
   * Check if record is active (for models with 'aktif' field)
   */
  isActive() {
    return this.aktif === true || this.aktif === 1;
  }

  /**
   * Soft delete (for models with 'deleted_at' field)
   */
  async softDelete() {
    if (this.deleted_at !== undefined) {
      await this.update({ deleted_at: new Date() });
    } else {
      throw new Error('Model does not support soft delete');
    }
  }

  /**
   * Restore from soft delete
   */
  async restore() {
    if (this.deleted_at !== undefined) {
      await this.update({ deleted_at: null });
    } else {
      throw new Error('Model does not support soft delete');
    }
  }

  /**
   * Get model's primary key value
   */
  getPrimaryKey() {
    const primaryKey = this.constructor.primaryKeyAttribute || 'id';
    return this[primaryKey];
  }

  /**
   * Update model with validation
   */
  async updateSafe(data, options = {}) {
    try {
      return await this.update(data, {
        validate: true,
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to update ${this.constructor.name}: ${error.message}`);
    }
  }

  /**
   * Create a new instance with validation
   */
  static async createSafe(data, options = {}) {
    try {
      return await this.create(data, {
        validate: true,
        ...options
      });
    } catch (error) {
      throw new Error(`Failed to create ${this.name}: ${error.message}`);
    }
  }

  /**
   * Find by primary key with error handling
   */
  static async findByPkSafe(id, options = {}) {
    try {
      const instance = await this.findByPk(id, options);
      if (!instance) {
        throw new Error(`${this.name} with id ${id} not found`);
      }
      return instance;
    } catch (error) {
      throw new Error(`Failed to find ${this.name}: ${error.message}`);
    }
  }

  /**
   * Count active records (for models with 'aktif' field)
   */
  static async countActive() {
    return await this.count({
      where: { aktif: true }
    });
  }

  /**
   * Find all active records (for models with 'aktif' field)
   */
  static async findAllActive(options = {}) {
    return await this.findAll({
      where: { aktif: true },
      ...options
    });
  }

  /**
   * Execute raw SQL query
   */
  static async executeQuery(query, params = []) {
    if (!this.sequelize) {
      throw new Error('Sequelize instance not available');
    }
    const [results] = await this.sequelize.query(query, {
      replacements: params,
      type: this.sequelize.QueryTypes.SELECT
    });
    return results;
  }

  /**
   * Find by primary key or throw error
   */
  static async findById(id, options = {}) {
    const instance = await this.findByPk(id, options);
    if (!instance) {
      throw new Error(`${this.name} with id ${id} not found`);
    }
    return instance;
  }

  /**
   * Update by primary key
   */
  static async updateById(id, data, options = {}) {
    const instance = await this.findByPk(id);
    if (!instance) {
      return null;
    }
    return await instance.update(data, {
      validate: true,
      ...options
    });
  }

  /**
   * Delete by primary key
   */
  static async deleteById(id) {
    const instance = await this.findByPk(id);
    if (!instance) {
      return false;
    }
    await instance.destroy();
    return true;
  }

  /**
   * Simple pagination
   */
  static async paginate(page = 1, limit = 10, conditions = {}, orderBy = 'created_at DESC') {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.findAndCountAll({
      where: conditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[orderBy.split(' ')[0], orderBy.split(' ')[1] || 'ASC']]
    });

    return {
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    };
  }
}

module.exports = BaseModel;
