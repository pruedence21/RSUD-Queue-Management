const { DataTypes } = require('sequelize');
const BaseModel = require('./BaseModel');

class Settings extends BaseModel {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        key: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [1, 100],
          },
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
          allowNull: false,
          defaultValue: 'string',
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: true,
          defaultValue: 'general',
        },
        is_editable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: 'Settings',
        tableName: 'settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          {
            unique: true,
            fields: ['key'],
          },
          {
            fields: ['category'],
          },
          {
            fields: ['type'],
          },
        ],
      }
    );
  }

  // Static methods for common operations
  static async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.findOne({
        where: { key },
      });

      if (!setting) {
        return defaultValue;
      }

      // Parse value based on type
      switch (setting.type) {
        case 'number':
          return parseFloat(setting.value) || defaultValue;
        case 'boolean':
          return setting.value === 'true' || setting.value === '1';
        case 'json':
          try {
            return JSON.parse(setting.value);
          } catch (e) {
            return defaultValue;
          }
        default:
          return setting.value || defaultValue;
      }
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  static async setSetting(key, value, type = 'string', description = null, category = 'general') {
    try {
      let stringValue = value;
      
      // Convert value to string based on type
      if (type === 'json') {
        stringValue = JSON.stringify(value);
      } else if (type === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else {
        stringValue = String(value);
      }

      const [setting, created] = await this.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: stringValue,
          type,
          description,
          category,
        },
      });

      if (!created) {
        await setting.update({
          value: stringValue,
          type,
          description: description || setting.description,
          category: category || setting.category,
        });
      }

      return setting;
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  static async getSettingsByCategory(category) {
    try {
      const settings = await this.findAll({
        where: { category },
        order: [['key', 'ASC']],
      });

      const result = {};
      settings.forEach(setting => {
        let value = setting.value;
        
        // Parse value based on type
        switch (setting.type) {
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'boolean':
            value = setting.value === 'true' || setting.value === '1';
            break;
          case 'json':
            try {
              value = JSON.parse(setting.value);
            } catch (e) {
              value = setting.value;
            }
            break;
        }

        result[setting.key] = {
          value,
          type: setting.type,
          description: setting.description,
          is_editable: setting.is_editable,
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting settings by category:', error);
      throw error;
    }
  }

  static async getAllSettings() {
    try {
      const settings = await this.findAll({
        order: [['category', 'ASC'], ['key', 'ASC']],
      });

      const result = {};
      settings.forEach(setting => {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }

        let value = setting.value;
        
        // Parse value based on type
        switch (setting.type) {
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'boolean':
            value = setting.value === 'true' || setting.value === '1';
            break;
          case 'json':
            try {
              value = JSON.parse(setting.value);
            } catch (e) {
              value = setting.value;
            }
            break;
        }

        result[setting.category][setting.key] = {
          value,
          type: setting.type,
          description: setting.description,
          is_editable: setting.is_editable,
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw error;
    }
  }

  static async deleteSetting(key) {
    try {
      const setting = await this.findOne({
        where: { key },
      });

      if (!setting) {
        return false;
      }

      if (!setting.is_editable) {
        throw new Error('Setting is not editable');
      }

      await setting.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  static async updateSetting(key, value, description = null) {
    try {
      const setting = await this.findOne({ where: { key } });
      
      if (!setting) {
        throw new Error(`Setting dengan key '${key}' tidak ditemukan`);
      }

      if (!setting.is_editable) {
        throw new Error(`Setting '${key}' tidak dapat diedit`);
      }

      let stringValue = value;
      
      // Convert value to string based on type
      if (setting.type === 'json') {
        stringValue = JSON.stringify(value);
      } else if (setting.type === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else {
        stringValue = String(value);
      }

      await setting.update({
        value: stringValue,
        description: description || setting.description
      });

      return setting;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  static async batchUpdateSettings(settingsArray) {
    try {
      const results = [];
      const errors = [];

      for (const settingData of settingsArray) {
        try {
          const { key, value, description } = settingData;
          const updated = await this.updateSetting(key, value, description);
          results.push(updated);
        } catch (error) {
          errors.push({
            key: settingData.key,
            error: error.message
          });
        }
      }

      return {
        success: results,
        errors: errors,
        totalUpdated: results.length,
        totalErrors: errors.length
      };
    } catch (error) {
      console.error('Error batch updating settings:', error);
      throw error;
    }
  }

  static async getSettingsForCategory(category) {
    try {
      const settings = await this.findAll({
        where: { category },
        order: [['key', 'ASC']]
      });

      return settings.map(setting => ({
        id: setting.id,
        key: setting.key,
        value: setting.getParsedValue(),
        description: setting.description,
        type: setting.type,
        category: setting.category,
        is_editable: setting.is_editable,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      }));
    } catch (error) {
      console.error('Error getting settings for category:', error);
      throw error;
    }
  }

  static async initializeDefaultSettings() {
    try {
      const defaultSettings = [
        {
          key: 'app_name',
          value: 'RSUD Queue Management',
          description: 'Nama aplikasi',
          type: 'string',
          category: 'general'
        },
        {
          key: 'max_queue_per_day',
          value: '100',
          description: 'Maksimal antrian per hari',
          type: 'number',
          category: 'queue'
        },
        {
          key: 'queue_call_interval',
          value: '15',
          description: 'Interval pemanggilan antrian (menit)',
          type: 'number',
          category: 'queue'
        },
        {
          key: 'auto_close_queue',
          value: 'true',
          description: 'Otomatis tutup antrian di akhir hari',
          type: 'boolean',
          category: 'queue'
        },
        {
          key: 'working_hours',
          value: JSON.stringify({
            start: '08:00',
            end: '16:00',
            break_start: '12:00',
            break_end: '13:00'
          }),
          description: 'Jam kerja',
          type: 'json',
          category: 'schedule'
        }
      ];

      const results = [];
      for (const setting of defaultSettings) {
        const [created, wasCreated] = await this.findOrCreate({
          where: { key: setting.key },
          defaults: setting
        });
        results.push({ setting: created, wasCreated });
      }

      return results;
    } catch (error) {
      console.error('Error initializing default settings:', error);
      throw error;
    }
  }

  static async getSettingValue(key, defaultValue = null) {
    try {
      const value = await this.getSetting(key, defaultValue);
      return value;
    } catch (error) {
      console.error(`Error getting setting value for key '${key}':`, error);
      return defaultValue;
    }
  }

  // Instance methods
  getParsedValue() {
    switch (this.type) {
      case 'number':
        return parseFloat(this.value);
      case 'boolean':
        return this.value === 'true' || this.value === '1';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch (e) {
          return this.value;
        }
      default:
        return this.value;
    }
  }

  async setValue(value) {
    let stringValue = value;
    
    if (this.type === 'json') {
      stringValue = JSON.stringify(value);
    } else if (this.type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else {
      stringValue = String(value);
    }

    await this.update({ value: stringValue });
  }
}

module.exports = Settings;
