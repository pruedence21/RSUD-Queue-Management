const Joi = require('joi');
const { validationError } = require('../middleware/errorHandler');

/**
 * Dokter input validation schemas
 */

/**
 * Create dokter validation schema
 */
const createDokterSchema = Joi.object({
  nama_dokter: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z\s.,-]+$/)
    .required()
    .messages({
      'string.min': 'Nama dokter minimal 3 karakter',
      'string.max': 'Nama dokter maksimal 100 karakter',
      'string.pattern.base': 'Nama dokter hanya boleh mengandung huruf, spasi, titik, koma, dan tanda hubung',
      'any.required': 'Nama dokter diperlukan'
    }),
  
  spesialisasi: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .allow(null)
    .messages({
      'string.max': 'Spesialisasi maksimal 100 karakter'
    }),
  
  poli_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Poli harus dipilih',
      'number.integer': 'ID poli harus berupa angka bulat',
      'number.positive': 'ID poli harus berupa angka positif',
      'any.required': 'Poli harus dipilih'
    }),
  
  aktif: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Status aktif harus berupa boolean'
    })
});

/**
 * Update dokter validation schema
 */
const updateDokterSchema = Joi.object({
  nama_dokter: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z\s.,-]+$/)
    .messages({
      'string.min': 'Nama dokter minimal 3 karakter',
      'string.max': 'Nama dokter maksimal 100 karakter',
      'string.pattern.base': 'Nama dokter hanya boleh mengandung huruf, spasi, titik, koma, dan tanda hubung'
    }),
  
  spesialisasi: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .allow(null)
    .messages({
      'string.max': 'Spesialisasi maksimal 100 karakter'
    }),
  
  poli_id: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'ID poli harus berupa angka',
      'number.integer': 'ID poli harus berupa angka bulat',
      'number.positive': 'ID poli harus berupa angka positif'
    }),
  
  aktif: Joi.boolean()
    .messages({
      'boolean.base': 'Status aktif harus berupa boolean'
    })
}).min(1); // At least one field is required for update

/**
 * Dokter ID parameter validation schema
 */
const dokterIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID dokter harus berupa angka',
      'number.integer': 'ID dokter harus berupa angka bulat',
      'number.positive': 'ID dokter harus berupa angka positif',
      'any.required': 'ID dokter diperlukan'
    })
});

/**
 * Poli ID parameter validation schema
 */
const poliIdParamSchema = Joi.object({
  poliId: Joi.number()
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
  
  poli_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID poli harus berupa angka',
      'number.integer': 'ID poli harus berupa angka bulat',
      'number.positive': 'ID poli harus berupa angka positif'
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
    }),
  
  with_poli: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'with_poli harus berupa boolean'
    })
});

/**
 * Validate create dokter input
 * @param {Object} data - Dokter data
 * @returns {Object} Validated data
 */
const validateCreateDokter = (data) => {
  const { error, value } = createDokterSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data dokter tidak valid', errors);
  }

  return value;
};

/**
 * Validate update dokter input
 * @param {Object} data - Dokter data
 * @returns {Object} Validated data
 */
const validateUpdateDokter = (data) => {
  const { error, value } = updateDokterSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data dokter tidak valid', errors);
  }

  return value;
};

/**
 * Validate dokter ID parameter
 * @param {Object} params - Request parameters
 * @returns {Object} Validated parameters
 */
const validateDokterId = (params) => {
  const { error, value } = dokterIdSchema.validate(params, { 
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
 * Validate poli ID parameter
 * @param {Object} params - Request parameters
 * @returns {Object} Validated parameters
 */
const validatePoliIdParam = (params) => {
  const { error, value } = poliIdParamSchema.validate(params, { 
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
 * Express middleware for validating create dokter
 */
const validateCreateDokterMiddleware = (req, res, next) => {
  try {
    req.body = validateCreateDokter(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating update dokter
 */
const validateUpdateDokterMiddleware = (req, res, next) => {
  try {
    req.body = validateUpdateDokter(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating dokter ID parameter
 */
const validateDokterIdMiddleware = (req, res, next) => {
  try {
    req.params = { ...req.params, ...validateDokterId(req.params) };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating poli ID parameter
 */
const validatePoliIdParamMiddleware = (req, res, next) => {
  try {
    req.params = { ...req.params, ...validatePoliIdParam(req.params) };
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
  createDokterSchema,
  updateDokterSchema,
  dokterIdSchema,
  poliIdParamSchema,
  searchQuerySchema,
  validateCreateDokter,
  validateUpdateDokter,
  validateDokterId,
  validatePoliIdParam,
  validateSearchQuery,
  validateCreateDokterMiddleware,
  validateUpdateDokterMiddleware,
  validateDokterIdMiddleware,
  validatePoliIdParamMiddleware,
  validateSearchQueryMiddleware
};