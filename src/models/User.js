const { DataTypes } = require('sequelize');
const BaseModel = require('./BaseModel');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

/**
 * User Model using Sequelize
 * Mengelola data pengguna sistem
 */
class User extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'Username sudah digunakan'
        },
        validate: {
          notEmpty: {
            msg: 'Username tidak boleh kosong'
          },
          len: {
            args: [3, 50],
            msg: 'Username harus antara 3-50 karakter'
          },
          isAlphanumeric: {
            msg: 'Username hanya boleh berisi huruf dan angka'
          }
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Password tidak boleh kosong'
          },
          len: {
            args: [6, 255],
            msg: 'Password minimal 6 karakter'
          }
        }
      },
      role: {
        type: DataTypes.ENUM('admin', 'petugas'),
        allowNull: false,
        defaultValue: 'petugas',
        validate: {
          notEmpty: {
            msg: 'Role tidak boleh kosong'
          },
          isIn: {
            args: [['admin', 'petugas']],
            msg: 'Role harus admin atau petugas'
          }
        }
      },
      nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Nama lengkap maksimal 100 karakter'
          }
        }
      },
      aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await hashPassword(user.password);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await hashPassword(user.password);
          }
        }
      }
    });
  }
  // Instance methods
  async validatePassword(password) {
    return comparePassword(password, this.password);
  }

  async updateLastLogin() {
    this.last_login = new Date();
    await this.save();
    return this;
  }

  async toggle() {
    this.aktif = !this.aktif;
    await this.save();
    return this;
  }

  // Remove password from JSON output
  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  }

  // Static methods
  static async findByUsername(username) {
    return this.findOne({
      where: { username }
    });
  }

  static async findActive() {
    return this.findAll({
      where: { aktif: true },
      order: [['username', 'ASC']],
      attributes: { exclude: ['password'] }
    });
  }

  static async findByRole(role) {
    return this.findAll({
      where: { 
        role,
        aktif: true 
      },
      order: [['username', 'ASC']],
      attributes: { exclude: ['password'] }
    });
  }

  static async search(query) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { nama_lengkap: { [Op.like]: `%${query}%` } }
        ]
      },
      order: [['username', 'ASC']],
      attributes: { exclude: ['password'] }
    });
  }

  static async createUser(userData) {
    const user = await this.create(userData);
    return user.toJSON(); // Remove password from response
  }

  static async updateUser(id, userData) {
    const [affectedCount] = await this.update(userData, {
      where: { id }
    });

    if (affectedCount === 0) {
      throw new Error('User not found');
    }

    const updatedUser = await this.findByPk(id);
    return updatedUser.toJSON(); // Remove password from response
  }

  static async authenticate(username, password) {
    try {
      const user = await this.findByUsername(username);
      if (!user) {
        return null;
      }

      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return null;
      }

      // Update last login
      await user.updateLastLogin();

      return user;
    } catch (error) {
      throw new Error('Authentication failed: ' + error.message);
    }
  }

  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await this.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isValidOldPassword = await user.validatePassword(oldPassword);
      if (!isValidOldPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update with new password (will be hashed by beforeUpdate hook)
      await user.update({ password: newPassword });
      
      return user;
    } catch (error) {
      throw new Error('Failed to change password: ' + error.message);
    }
  }

  // Associations (if needed in the future)
  static associate(models) {
    // User associations can be added here if needed
    // For example, if we add user activity logs, user sessions, etc.
  }
}

module.exports = User;
