const Joi = require('joi');
const { validationError } = require('../middleware/errorHandler');

/**
 * Poli input validation schemas
 */

/**
 * Create poli validation schema
 */
const createPoliSchema = Joi.object({
  nama_poli: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nama poli minimal 3 karakter',
      'string.max': 'Nama poli maksimal 100 karakter',
      'any.required': 'Nama poli diperlukan'
    }),
  
  kode_poli: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(10)
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      'string.min': 'Kode poli minimal 2 karakter',
      'string.max': 'Kode poli maksimal 10 karakter',
      'string.pattern.base': 'Kode poli hanya boleh mengandung huruf besar dan angka',
      'any.required': 'Kode poli diperlukan'
    }),
  
  aktif: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Status aktif harus berupa boolean'
    })
});

/**
 * Update poli validation schema
 */
const updatePoliSchema = Joi.object({
  nama_poli: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.min': 'Nama poli minimal 3 karakter',
      'string.max': 'Nama poli maksimal 100 karakter'
    }),
  
  kode_poli: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(10)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.min': 'Kode poli minimal 2 karakter',
      'string.max': 'Kode poli maksimal 10 karakter',
      'string.pattern.base': 'Kode poli hanya boleh mengandung huruf besar dan angka'
    }),
  
  aktif: Joi.boolean()
    .messages({
      'boolean.base': 'Status aktif harus berupa boolean'
    })
}).min(1); // At least one field is required for update

/**
 * Poli ID parameter validation schema
 */
const poliIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID poli harus berupa angka',
      'number.integer': 'ID poli harus berupa angka bulat',
      'number.positive': 'ID poli harus berupa angka positif',
      'any.required': 'ID poli diperlukan'
    })
});

/**
 * Search query validation schema
 */
const searchQuerySchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Query pencarian minimal 1 karakter',
      'string.max': 'Query pencarian maksimal 100 karakter'
    }),
  
  active_only: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'active_only harus berupa boolean'
    }),
  
  page: Joi.number()
    .integer()
    .positive()
    .default(1)
    .messages({
      'number.base': 'Page harus berupa angka',
      'number.integer': 'Page harus berupa angka bulat',
      'number.positive': 'Page harus berupa angka positif'
    }),
  
  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit harus berupa angka',
      'number.integer': 'Limit harus berupa angka bulat',
      'number.positive': 'Limit harus berupa angka positif',
      'number.max': 'Limit maksimal 100'
    })
});

/**
 * Validate create poli input
 * @param {Object} data - Poli data
 * @returns {Object} Validated data
 */
const validateCreatePoli = (data) => {
  const { error, value } = createPoliSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data poli tidak valid', errors);
  }

  return value;
};

/**
 * Validate update poli input
 * @param {Object} data - Poli data
 * @returns {Object} Validated data
 */
const validateUpdatePoli = (data) => {
  const { error, value } = updatePoliSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data poli tidak valid', errors);
  }

  return value;
};

/**
 * Validate poli ID parameter
 * @param {Object} params - Request parameters
 * @returns {Object} Validated parameters
 */
const validatePoliId = (params) => {
  const { error, value } = poliIdSchema.validate(params, { 
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
 * Validate search query
 * @param {Object} query - Query parameters
 * @returns {Object} Validated query
 */
const validateSearchQuery = (query) => {
  const { error, value } = searchQuerySchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Parameter pencarian tidak valid', errors);
  }

  return value;
};

/**
 * Express middleware for validating create poli
 */
const validateCreatePoliMiddleware = (req, res, next) => {
  try {
    req.body = validateCreatePoli(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating update poli
 */
const validateUpdatePoliMiddleware = (req, res, next) => {
  try {
    req.body = validateUpdatePoli(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating poli ID parameter
 */
const validatePoliIdMiddleware = (req, res, next) => {
  try {
    req.params = { ...req.params, ...validatePoliId(req.params) };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating search query
 */
const validateSearchQueryMiddleware = (req, res, next) => {
  try {
    req.query = validateSearchQuery(req.query);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPoliSchema,
  updatePoliSchema,
  poliIdSchema,
  searchQuerySchema,
  validateCreatePoli,
  validateUpdatePoli,
  validatePoliId,
  validateSearchQuery,
  validateCreatePoliMiddleware,
  validateUpdatePoliMiddleware,
  validatePoliIdMiddleware,
  validateSearchQueryMiddleware
};