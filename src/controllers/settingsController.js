const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const { success, error, send } = require('../utils/response');
const { asyncHandler, notFoundError } = require('../middleware/errorHandler');

/**
 * Settings Controller
 * Menangani operasi untuk pengaturan sistem
 */

/**
 * Create new setting
 * @route POST /api/settings
 * @access Private (Admin only)
 */
const createSetting = asyncHandler(async (req, res) => {
  const settingData = req.body;
  const newSetting = await Settings.create(settingData);

  logger.info('Setting created', {
    key: newSetting.key_setting,
    value: newSetting.value_setting,
    createdBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Pengaturan berhasil dibuat', { setting: newSetting }, 201);
  send(res, responseData);
});

/**
 * Get all settings
 * @route GET /api/settings
 * @access Private (Admin only)
 */
const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getAllSettings();
  const responseData = success('Data pengaturan berhasil diambil', { settings });
  send(res, responseData);
});

/**
 * Get setting by key
 * @route GET /api/settings/:key
 * @access Private (Admin only)
 */
const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const setting = await Settings.getSetting(key);
  
  if (!setting) {
    throw notFoundError('Pengaturan tidak ditemukan');
  }

  const responseData = success('Data pengaturan berhasil diambil', { setting });
  send(res, responseData);
});

/**
 * Update setting by key
 * @route PUT /api/settings/:key
 * @access Private (Admin only)
 */
const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const updateData = req.body;

  const updatedSetting = await Settings.updateSetting(key, updateData);

  logger.info('Setting updated', {
    key: updatedSetting.key_setting,
    value: updatedSetting.value_setting,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Pengaturan berhasil diperbarui', { setting: updatedSetting });
  send(res, responseData);
});

/**
 * Batch update settings
 * @route POST /api/settings/batch
 * @access Private (Admin only)
 */
const batchUpdateSettings = asyncHandler(async (req, res) => {
  const settingsArray = req.body;
  const updatedSettings = await Settings.batchUpdateSettings(settingsArray);

  logger.info('Batch settings updated', {
    count: updatedSettings.length,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Pengaturan berhasil diperbarui secara batch', { settings: updatedSettings });
  send(res, responseData);
});

/**
 * Initialize default settings (should be called once on app startup or migration)
 * @param {Array<Object>} defaultSettings - Array of default setting objects
 */
const initializeDefaultSettings = async (defaultSettings) => {
  await Settings.initializeDefaultSettings(defaultSettings);
};

module.exports = {
  createSetting,
  getAllSettings,
  getSettingByKey,
  updateSetting,
  batchUpdateSettings,
  initializeDefaultSettings
};