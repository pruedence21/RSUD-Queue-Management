const Joi = require('joi');
const { validationError } = require('../middleware/errorHandler');

/**
 * User input validation schemas
 */

/**
 * Create user validation schema
 */
const createUserSchema = Joi.object({
  username: Joi.string()
    .trim()
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
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // At least one lowercase, one uppercase, one digit
    .messages({
      'string.min': 'Password minimal 6 karakter',
      'string.max': 'Password maksimal 128 karakter',
      'string.pattern.base': 'Password harus mengandung huruf kecil, huruf besar, dan angka',
      'any.required': 'Password diperlukan'
    }),
  
  nama_lengkap: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nama lengkap minimal 2 karakter',
      'string.max': 'Nama lengkap maksimal 100 karakter',
      'any.required': 'Nama lengkap diperlukan'
    }),
  
  role: Joi.string()
    .valid('admin', 'petugas')
    .required()
    .messages({
      'any.only': 'Role harus berupa "admin" atau "petugas"',
      'any.required': 'Role diperlukan'
    }),
  
  aktif: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Status aktif harus berupa boolean'
    })
});

/**
 * Update user validation schema
 */
const updateUserSchema = Joi.object({
  username: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(50)
    .messages({
      'string.alphanum': 'Username hanya boleh mengandung huruf dan angka',
      'string.min': 'Username minimal 3 karakter',
      'string.max': 'Username maksimal 50 karakter'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // At least one lowercase, one uppercase, one digit
    .messages({
      'string.min': 'Password minimal 6 karakter',
      'string.max': 'Password maksimal 128 karakter',
      'string.pattern.base': 'Password harus mengandung huruf kecil, huruf besar, dan angka'
    }),
  
  nama_lengkap: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Nama lengkap minimal 2 karakter',
      'string.max': 'Nama lengkap maksimal 100 karakter'
    }),
  
  role: Joi.string()
    .valid('admin', 'petugas')
    .messages({
      'any.only': 'Role harus berupa "admin" atau "petugas"'
    }),
  
  aktif: Joi.boolean()
    .messages({
      'boolean.base': 'Status aktif harus berupa boolean'
    })
}).min(1); // At least one field is required for update

/**
 * User ID parameter validation schema
 */
const userIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID user harus berupa angka',
      'number.integer': 'ID user harus berupa angka bulat',
      'number.positive': 'ID user harus berupa angka positif',
      'any.required': 'ID user diperlukan'
    })
});

/**
 * Reset password validation schema (for admin to reset other user's password)
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
 * Validate create user input
 * @param {Object} data - User data
 * @returns {Object} Validated data
 */
const validateCreateUser = (data) => {
  const { error, value } = createUserSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data user tidak valid', errors);
  }

  return value;
};

/**
 * Validate update user input
 * @param {Object} data - User data
 * @returns {Object} Validated data
 */
const validateUpdateUser = (data) => {
  const { error, value } = updateUserSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data user tidak valid', errors);
  }

  return value;
};

/**
 * Validate user ID parameter
 * @param {Object} params - Request parameters
 * @returns {Object} Validated parameters
 */
const validateUserId = (params) => {
  const { error, value } = userIdSchema.validate(params, { 
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
 * Validate reset password input (for admin)
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
 * Express middleware for validating create user
 */
const validateCreateUserMiddleware = (req, res, next) => {
  try {
    req.body = validateCreateUser(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating update user
 */
const validateUpdateUserMiddleware = (req, res, next) => {
  try {
    req.body = validateUpdateUser(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating user ID parameter
 */
const validateUserIdMiddleware = (req, res, next) => {
  try {
    req.params = { ...req.params, ...validateUserId(req.params) };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating reset password (for admin)
 */
const validateResetPasswordMiddleware = (req, res, next) => {
  try {
    req.body = validateResetPassword(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  resetPasswordSchema,
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
  validateResetPassword,
  validateCreateUserMiddleware,
  validateUpdateUserMiddleware,
  validateUserIdMiddleware,
  validateResetPasswordMiddleware
};