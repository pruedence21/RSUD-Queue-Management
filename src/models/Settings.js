const BaseModel = require('./BaseModel');
const { createError, validationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Settings Model
 * Mengelola data pengaturan sistem
 */
class Settings extends BaseModel {
  constructor() {
    super('settings');
  }

  /**
   * Validate setting data
   * @param {Object} data - Setting data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateData(data, isUpdate = false) {
    const errors = [];

    // Key setting validation
    if (!isUpdate || data.hasOwnProperty('key_setting')) {
      if (!data.key_setting || typeof data.key_setting !== 'string') {
        errors.push('Key setting diperlukan dan harus berupa string');
      } else if (data.key_setting.trim().length < 3) {
        errors.push('Key setting minimal 3 karakter');
      } else if (data.key_setting.trim().length > 100) {
        errors.push('Key setting maksimal 100 karakter');
      } else if (!/^[a-zA-Z0-9_]+$/.test(data.key_setting.trim())) {
        errors.push('Key setting hanya boleh mengandung huruf, angka, dan underscore');
      }
    }

    // Value setting validation (optional)
    if (data.hasOwnProperty('value_setting')) {
      if (data.value_setting !== null &&
          typeof data.value_setting !== 'string' &&
          typeof data.value_setting !== 'boolean' &&
          typeof data.value_setting !== 'number') {
        errors.push('Value setting harus berupa string, boolean, number, atau null');
      }
    }

    // Deskripsi validation (optional)
    if (data.hasOwnProperty('deskripsi')) {
      if (data.deskripsi !== null && typeof data.deskripsi !== 'string') {
        errors.push('Deskripsi harus berupa string atau null');
      } else if (data.deskripsi && data.deskripsi.trim().length > 255) {
        errors.push('Deskripsi maksimal 255 karakter');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get a single setting by key
   * @param {string} key - The key of the setting
   * @returns {Promise<Object|null>} The setting object or null if not found
   */
  async create(data) {
    const cleanData = {
      key_setting: data.key_setting?.trim(),
      value_setting: (typeof data.value_setting === 'object' && data.value_setting !== null) ? JSON.stringify(data.value_setting) : String(data.value_setting),
      deskripsi: data.deskripsi?.trim() || null
    };

    const validation = this.validateData(cleanData);
    if (!validation.isValid) {
      throw validationError('Data setting tidak valid', validation.errors);
    }

    const existingSetting = await this.getSetting(cleanData.key_setting);
    if (existingSetting) {
      throw createError('Key setting sudah ada', 409);
    }

    const createdSetting = await super.create(cleanData);
    return createdSetting;
  }

  async getSetting(key) {
    if (!key) {
      throw createError('Key setting diperlukan', 400);
    }
    const setting = await this.findOne({ key_setting: key });
    return setting;
  }

  /**
   * Update a setting by key
   * @param {string} key - The key of the setting to update
   * @param {Object} data - The data to update (value_setting, deskripsi)
   * @returns {Promise<Object|null>} The updated setting object or null if not found
   */
  async updateSetting(key, data) {
    if (!key) {
      throw createError('Key setting diperlukan', 400);
    }

    const existingSetting = await this.getSetting(key);
    if (!existingSetting) {
      throw createError('Setting tidak ditemukan', 404);
    }

    const cleanData = {};
    if (data.hasOwnProperty('value_setting')) {
      cleanData.value_setting = (typeof data.value_setting === 'object' && data.value_setting !== null) ? JSON.stringify(data.value_setting) : String(data.value_setting);
    }
    if (data.hasOwnProperty('deskripsi')) {
      cleanData.deskripsi = data.deskripsi?.trim() || null;
    }

    const validation = this.validateData(cleanData, true);
    if (!validation.isValid) {
      throw validationError('Data setting tidak valid', validation.errors);
    }

    const updatedSetting = await super.updateById(existingSetting.id, cleanData);
    return updatedSetting;
  }

  /**
   * Get all settings
   * @returns {Promise<Array>} List of all settings
   */
  async getAllSettings() {
    return await this.findAll({ orderBy: 'key_setting ASC' });
  }

  /**
   * Batch update multiple settings
   * @param {Array<Object>} settingsArray - Array of setting objects { key_setting, value_setting, deskripsi }
   * @returns {Promise<Array<Object>>} Array of updated settings
   */
  async batchUpdateSettings(settingsArray) {
    if (!Array.isArray(settingsArray) || settingsArray.length === 0) {
      throw createError('Array settings diperlukan untuk batch update', 400);
    }

    const updatedSettings = [];
    for (const settingData of settingsArray) {
      try {
        const updated = await this.updateSetting(settingData.key_setting, settingData);
        updatedSettings.push(updated);
      } catch (err) {
        logger.warn(`Failed to update setting ${settingData.key_setting}: ${err.message}`);
        // Optionally, re-throw or collect errors for a partial failure report
      }
    }
    return updatedSettings;
  }

  /**
   * Initialize default settings if they don't exist
   * @param {Array<Object>} defaultSettings - Array of default setting objects { key_setting, value_setting, deskripsi }
   */
  async initializeDefaultSettings(defaultSettings) {
    if (!Array.isArray(defaultSettings) || defaultSettings.length === 0) {
      logger.warn('No default settings provided for initialization.');
      return;
    }

    for (const defaultSetting of defaultSettings) {
      const { key_setting, value_setting, deskripsi } = defaultSetting;
      const existingSetting = await this.getSetting(key_setting);

      if (!existingSetting) {
        const cleanData = {
          key_setting: key_setting.trim(),
          value_setting: typeof value_setting === 'object' ? JSON.stringify(value_setting) : value_setting,
          deskripsi: deskripsi?.trim() || null
        };
        const validation = this.validateData(cleanData);
        if (validation.isValid) {
          await super.create(cleanData);
          logger.info(`Default setting '${key_setting}' initialized.`);
        } else {
          logger.error(`Failed to validate default setting '${key_setting}': ${validation.errors.join(', ')}`);
        }
      }
    }
  }
}

module.exports = new Settings();