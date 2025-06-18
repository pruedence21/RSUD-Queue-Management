const Joi = require('joi');
const { validationError } = require('../middleware/errorHandler');

/**
 * Settings input validation schemas
 */

/**
 * Create setting validation schema
 */
const createSettingSchema = Joi.object({
  key_setting: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Key setting minimal 3 karakter',
      'string.max': 'Key setting maksimal 100 karakter',
      'string.pattern.base': 'Key setting hanya boleh mengandung huruf, angka, dan underscore',
      'any.required': 'Key setting diperlukan'
    }),
  value_setting: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.boolean(), Joi.number(), Joi.object())
    .allow(null)
    .messages({
      'any.base': 'Value setting harus berupa string, boolean, number, atau object'
    }),
  deskripsi: Joi.string()
    .trim()
    .max(255)
    .allow('')
    .allow(null)
    .messages({
      'string.max': 'Deskripsi maksimal 255 karakter'
    })
});

/**
 * Update single setting validation schema
 */
const updateSettingSchema = Joi.object({
  value_setting: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.boolean(), Joi.number(), Joi.object())
    .allow(null)
    .messages({
      'any.base': 'Value setting harus berupa string, boolean, number, atau object'
    }),
  deskripsi: Joi.string()
    .trim()
    .max(255)
    .allow('')
    .allow(null)
    .messages({
      'string.max': 'Deskripsi maksimal 255 karakter'
    })
}).min(1); // At least one field is required for update

/**
 * Batch update settings item schema
 */
const batchUpdateSettingItemSchema = Joi.object({
  key_setting: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Key setting minimal 3 karakter',
      'string.max': 'Key setting maksimal 100 karakter',
      'string.pattern.base': 'Key setting hanya boleh mengandung huruf, angka, dan underscore',
      'any.required': 'Key setting diperlukan'
    }),
  value_setting: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.boolean(), Joi.number(), Joi.object())
    .allow(null)
    .messages({
      'any.base': 'Value setting harus berupa string, boolean, number, atau object'
    }),
  deskripsi: Joi.string()
    .trim()
    .max(255)
    .allow('')
    .allow(null)
    .messages({
      'string.max': 'Deskripsi maksimal 255 karakter'
    })
});

/**
 * Batch update settings array schema
 */
const batchUpdateSettingsSchema = Joi.array().items(batchUpdateSettingItemSchema).min(1);

/**
 * Key setting parameter validation schema
 */
const keySettingSchema = Joi.object({
  key: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Key setting minimal 3 karakter',
      'string.max': 'Key setting maksimal 100 karakter',
      'string.pattern.base': 'Key setting hanya boleh mengandung huruf, angka, dan underscore',
      'any.required': 'Key setting diperlukan'
    })
});

/**
 * Validate create setting input
 * @param {Object} data - Setting data
 * @returns {Object} Validated data
 */
const validateCreateSetting = (data) => {
  const { error, value } = createSettingSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data setting tidak valid', errors);
  }

  return value;
};

/**
 * Validate update single setting input
 * @param {Object} data - Setting data
 * @returns {Object} Validated data
 */
const validateUpdateSetting = (data) => {
  const { error, value } = updateSettingSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data setting tidak valid', errors);
  }

  return value;
};

/**
 * Validate batch update settings input
 * @param {Array} data - Array of setting data
 * @returns {Array} Validated data
 */
const validateBatchUpdateSettings = (data) => {
  const { error, value } = batchUpdateSettingsSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data batch update settings tidak valid', errors);
  }

  return value;
};

/**
 * Validate key setting parameter
 * @param {Object} params - Request parameters
 * @returns {Object} Validated parameters
 */
const validateKeySetting = (params) => {
  const { error, value } = keySettingSchema.validate(params, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Parameter tidak valid', errors);
  }

  return value;
};

/**
 * Express middleware for validating create setting
 */
const validateCreateSettingMiddleware = (req, res, next) => {
  try {
    req.body = validateCreateSetting(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating update single setting
 */
const validateUpdateSettingMiddleware = (req, res, next) => {
  try {
    req.body = validateUpdateSetting(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating batch update settings
 */
const validateBatchUpdateSettingsMiddleware = (req, res, next) => {
  try {
    req.body = validateBatchUpdateSettings(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating key setting parameter
 */
const validateKeySettingMiddleware = (req, res, next) => {
  try {
    req.params = { ...req.params, ...validateKeySetting(req.params) };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSettingSchema,
  updateSettingSchema,
  batchUpdateSettingsSchema,
  keySettingSchema,
  validateCreateSetting,
  validateUpdateSetting,
  validateBatchUpdateSettings,
  validateKeySetting,
  validateCreateSettingMiddleware,
  validateUpdateSettingMiddleware,
  validateBatchUpdateSettingsMiddleware,
  validateKeySettingMiddleware
};