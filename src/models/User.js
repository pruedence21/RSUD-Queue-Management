const BaseModel = require('./BaseModel');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/bcrypt');
const { createError, validationError } = require('../middleware/errorHandler');

/**
 * User Model
 * Mengelola data pengguna sistem (admin dan petugas)
 */
class User extends BaseModel {
  constructor() {
    super('users');
  }

  /**
   * Validate user data
   * @param {Object} data - User data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateData(data, isUpdate = false) {
    const errors = [];

    // Username validation
    if (!isUpdate || data.hasOwnProperty('username')) {
      if (!data.username || typeof data.username !== 'string') {
        errors.push('Username diperlukan dan harus berupa string');
      } else if (data.username.trim().length < 3) {
        errors.push('Username minimal 3 karakter');
      } else if (data.username.trim().length > 50) {
        errors.push('Username maksimal 50 karakter');
      } else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
        errors.push('Username hanya boleh mengandung huruf, angka, dan underscore');
      }
    }

    // Password validation (only for create or when password is being changed)
    if (!isUpdate || data.hasOwnProperty('password')) {
      if (!isUpdate && (!data.password || typeof data.password !== 'string')) {
        errors.push('Password diperlukan');
      } else if (data.password) {
        const passwordValidation = validatePasswordStrength(data.password);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }
    }

    // Nama lengkap validation
    if (!isUpdate || data.hasOwnProperty('nama_lengkap')) {
      if (!data.nama_lengkap || typeof data.nama_lengkap !== 'string') {
        errors.push('Nama lengkap diperlukan dan harus berupa string');
      } else if (data.nama_lengkap.trim().length < 2) {
        errors.push('Nama lengkap minimal 2 karakter');
      } else if (data.nama_lengkap.trim().length > 100) {
        errors.push('Nama lengkap maksimal 100 karakter');
      }
    }

    // Role validation
    if (!isUpdate || data.hasOwnProperty('role')) {
      const validRoles = ['admin', 'petugas'];
      if (!data.role || !validRoles.includes(data.role)) {
        errors.push('Role harus berupa "admin" atau "petugas"');
      }
    }

    // Aktif validation
    if (data.hasOwnProperty('aktif')) {
      if (typeof data.aktif !== 'boolean' && data.aktif !== 0 && data.aktif !== 1) {
        errors.push('Status aktif harus berupa boolean atau 0/1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new user with validation and password hashing
   * @param {Object} data - User data
   * @returns {Promise<Object>} Created user (without password)
   */
  async create(data) {
    // Clean and prepare data
    const cleanData = {
      username: data.username?.trim().toLowerCase(),
      password: data.password,
      nama_lengkap: data.nama_lengkap?.trim(),
      role: data.role?.toLowerCase(),
      aktif: data.aktif !== undefined ? data.aktif : true
    };

    // Validate data
    const validation = this.validateData(cleanData);
    if (!validation.isValid) {
      throw validationError('Data user tidak valid', validation.errors);
    }

    // Check if username already exists
    const existingUser = await this.findByUsername(cleanData.username);
    if (existingUser) {
      throw createError('Username sudah digunakan', 409);
    }

    // Hash password
    cleanData.password = await hashPassword(cleanData.password);

    // Create user
    const createdUser = await super.create(cleanData);

    // Remove password from response
    delete createdUser.password;
    return createdUser;
  }

  /**
   * Update user with validation
   * @param {number} id - User ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated user (without password)
   */
  async updateById(id, data) {
    // Clean and prepare data
    const cleanData = {};
    
    if (data.username !== undefined) {
      cleanData.username = data.username?.trim().toLowerCase();
    }
    
    if (data.nama_lengkap !== undefined) {
      cleanData.nama_lengkap = data.nama_lengkap?.trim();
    }
    
    if (data.role !== undefined) {
      cleanData.role = data.role?.toLowerCase();
    }
    
    if (data.aktif !== undefined) {
      cleanData.aktif = data.aktif;
    }

    // Handle password update separately
    if (data.password !== undefined && data.password !== null) {
      cleanData.password = data.password;
    }

    // Validate data
    const validation = this.validateData(cleanData, true);
    if (!validation.isValid) {
      throw validationError('Data user tidak valid', validation.errors);
    }

    // Check if username already exists (excluding current record)
    if (cleanData.username) {
      const existingUser = await this.findByUsername(cleanData.username);
      if (existingUser && existingUser.id !== id) {
        throw createError('Username sudah digunakan', 409);
      }
    }

    // Hash password if provided
    if (cleanData.password) {
      cleanData.password = await hashPassword(cleanData.password);
    }

    // Update user
    const updatedUser = await super.updateById(id, cleanData);

    // Remove password from response
    if (updatedUser) {
      delete updatedUser.password;
    }

    return updatedUser;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User or null
   */
  async findByUsername(username) {
    if (!username) return null;
    return await this.findOne({ username: username.toLowerCase() });
  }

  /**
   * Authenticate user (login)
   * @param {string} username - Username
   * @param {string} password - Plain password
   * @returns {Promise<Object|null>} User without password or null if auth failed
   */
  async authenticate(username, password) {
    if (!username || !password) {
      return null;
    }

    // Find user by username
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    // Check if user is active
    if (!user.aktif) {
      throw createError('Akun tidak aktif', 403);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Remove password from response
    delete user.password;
    return user;
  }

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if password changed successfully
   */
  async changePassword(id, oldPassword, newPassword) {
    // Get user with password
    const user = await super.findById(id);
    if (!user) {
      throw createError('User tidak ditemukan', 404);
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw createError('Password lama tidak benar', 400);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw validationError('Password baru tidak valid', passwordValidation.errors);
    }

    // Hash new password and update
    const hashedNewPassword = await hashPassword(newPassword);
    await super.updateById(id, { password: hashedNewPassword });

    return true;
  }

  /**
   * Reset user password (admin only)
   * @param {number} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if password reset successfully
   */
  async resetPassword(id, newPassword) {
    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw validationError('Password baru tidak valid', passwordValidation.errors);
    }

    // Hash new password and update
    const hashedNewPassword = await hashPassword(newPassword);
    const updatedUser = await super.updateById(id, { password: hashedNewPassword });

    return updatedUser !== null;
  }

  /**
   * Get all users without passwords
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Users without passwords
   */
  async findAll(options = {}) {
    const users = await super.findAll(options);
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  /**
   * Get user by ID without password
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User without password or null
   */
  async findById(id) {
    const user = await super.findById(id);
    if (user) {
      delete user.password;
    }
    return user;
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {boolean} activeOnly - Only active users
   * @returns {Promise<Array>} Users without passwords
   */
  async findByRole(role, activeOnly = false) {
    const conditions = { role: role.toLowerCase() };
    if (activeOnly) {
      conditions.aktif = true;
    }

    const users = await this.findBy(conditions, { orderBy: 'nama_lengkap ASC' });
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  /**
   * Get active users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active users without passwords
   */
  async findAllActive(options = {}) {
    const users = await this.findBy({ aktif: true }, { 
      orderBy: 'nama_lengkap ASC',
      ...options 
    });
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  /**
   * Search users by name
   * @param {string} searchTerm - Search term
   * @param {boolean} activeOnly - Only search active users
   * @returns {Promise<Array>} Search results without passwords
   */
  async searchByName(searchTerm, activeOnly = false) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    const searchPattern = `%${searchTerm.trim()}%`;
    let whereClause = 'nama_lengkap LIKE ?';
    const params = [searchPattern];

    if (activeOnly) {
      whereClause += ' AND aktif = ?';
      params.push(true);
    }

    const users = await this.findAll({
      where: whereClause,
      params,
      orderBy: 'nama_lengkap ASC'
    });

    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const totalUsers = await this.count();
    const activeUsers = await this.count({ aktif: true });
    const adminCount = await this.count({ role: 'admin' });
    const petugasCount = await this.count({ role: 'petugas' });

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admin: adminCount,
      petugas: petugasCount
    };
  }

  /**
   * Toggle user status (aktif/tidak aktif)
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} Updated user without password
   */
  async toggleStatus(id) {
    const user = await super.findById(id);
    if (!user) {
      throw createError('User tidak ditemukan', 404);
    }

    // Prevent deactivating the last admin
    if (user.role === 'admin' && user.aktif) {
      const activeAdminCount = await this.count({ role: 'admin', aktif: true });
      if (activeAdminCount <= 1) {
        throw createError('Tidak dapat menonaktifkan admin terakhir', 400);
      }
    }

    const updatedUser = await this.updateById(id, { aktif: !user.aktif });
    return updatedUser;
  }

  /**
   * Check if user can be deleted
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Can be deleted
   */
  async canBeDeleted(id) {
    const user = await super.findById(id);
    if (!user) {
      return false;
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await this.count({ role: 'admin', aktif: true });
      if (adminCount <= 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Safe delete user (check dependencies first)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async safeDelete(id) {
    const canDelete = await this.canBeDeleted(id);
    if (!canDelete) {
      throw createError('User tidak dapat dihapus (mungkin admin terakhir)', 400);
    }

    return await this.deleteById(id);
  }
}

module.exports = new User();