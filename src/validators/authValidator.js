const Joi = require('joi');
const { validationError } = require('../middleware/errorHandler');

/**
 * Authentication input validation schemas
 */

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username hanya boleh mengandung huruf dan angka',
      'string.min': 'Username minimal 3 karakter',
      'string.max': 'Username maksimal 50 karakter',
      'any.required': 'Username diperlukan'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password minimal 6 karakter',
      'string.max': 'Password maksimal 128 karakter',
      'any.required': 'Password diperlukan'
    })
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Password lama diperlukan'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password baru minimal 6 karakter',
      'string.max': 'Password baru maksimal 128 karakter',
      'string.pattern.base': 'Password baru harus mengandung huruf kecil, huruf besar, dan angka',
      'any.required': 'Password baru diperlukan'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Konfirmasi password tidak cocok',
      'any.required': 'Konfirmasi password diperlukan'
    })
});

/**
 * Reset password validation schema (admin only)
 */
const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password baru minimal 6 karakter',
      'string.max': 'Password baru maksimal 128 karakter',
      'string.pattern.base': 'Password baru harus mengandung huruf kecil, huruf besar, dan angka',
      'any.required': 'Password baru diperlukan'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Konfirmasi password tidak cocok',
      'any.required': 'Konfirmasi password diperlukan'
    })
});

/**
 * Validate login input
 * @param {Object} data - Login data
 * @returns {Object} Validated data
 */
const validateLogin = (data) => {
  const { error, value } = loginSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data login tidak valid', errors);
  }

  return value;
};

/**
 * Validate change password input
 * @param {Object} data - Change password data
 * @returns {Object} Validated data
 */
const validateChangePassword = (data) => {
  const { error, value } = changePasswordSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data change password tidak valid', errors);
  }

  return value;
};

/**
 * Validate reset password input
 * @param {Object} data - Reset password data
 * @returns {Object} Validated data
 */
const validateResetPassword = (data) => {
  const { error, value } = resetPasswordSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data reset password tidak valid', errors);
  }

  return value;
};

/**
 * Express middleware for validating login
 */
const validateLoginMiddleware = (req, res, next) => {
  try {
    req.body = validateLogin(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating change password
 */
const validateChangePasswordMiddleware = (req, res, next) => {
  try {
    req.body = validateChangePassword(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating reset password
 */
const validateResetPasswordMiddleware = (req, res, next) => {
  try {
    req.body = validateResetPassword(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate user ID parameter
 */
const validateUserIdParam = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.number().integer().positive().required().messages({
      'number.base': 'User ID harus berupa angka',
      'number.integer': 'User ID harus berupa angka bulat',
      'number.positive': 'User ID harus berupa angka positif',
      'any.required': 'User ID diperlukan'
    })
  });

  const { error, value } = schema.validate(req.params, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return next(validationError('Parameter tidak valid', errors));
  }

  req.params = { ...req.params, ...value };
  next();
};

module.exports = {
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  validateLogin,
  validateChangePassword,
  validateResetPassword,
  validateLoginMiddleware,
  validateChangePasswordMiddleware,
  validateResetPasswordMiddleware,
  validateUserIdParam
};