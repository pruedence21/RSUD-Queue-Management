const Joi = require('joi');
const { validationError } = require('../middleware/errorHandler');

/**
 * Antrian input validation schemas
 */

/**
 * Create antrian validation schema
 */
const createAntrianSchema = Joi.object({
  poli_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Poli ID harus berupa angka',
      'number.integer': 'Poli ID harus berupa angka bulat',
      'number.positive': 'Poli ID harus berupa angka positif',
      'any.required': 'Poli ID diperlukan'
    }),
  
  dokter_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Dokter ID harus berupa angka',
      'number.integer': 'Dokter ID harus berupa angka bulat',
      'number.positive': 'Dokter ID harus berupa angka positif'
    }),
  
  nama_pasien: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nama pasien minimal 2 karakter',
      'string.max': 'Nama pasien maksimal 100 karakter',
      'any.required': 'Nama pasien diperlukan'
    }),
  
  status: Joi.string()
    .valid('menunggu', 'dipanggil', 'selesai', 'terlewat')
    .default('menunggu')
    .messages({
      'any.only': 'Status harus berupa: menunggu, dipanggil, selesai, atau terlewat'
    })
});

/**
 * Update antrian validation schema
 */
const updateAntrianSchema = Joi.object({
  poli_id: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Poli ID harus berupa angka',
      'number.integer': 'Poli ID harus berupa angka bulat',
      'number.positive': 'Poli ID harus berupa angka positif'
    }),
  
  dokter_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Dokter ID harus berupa angka',
      'number.integer': 'Dokter ID harus berupa angka bulat',
      'number.positive': 'Dokter ID harus berupa angka positif'
    }),
  
  nama_pasien: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Nama pasien minimal 2 karakter',
      'string.max': 'Nama pasien maksimal 100 karakter'
    }),
  
  status: Joi.string()
    .valid('menunggu', 'dipanggil', 'selesai', 'terlewat')
    .messages({
      'any.only': 'Status harus berupa: menunggu, dipanggil, selesai, atau terlewat'
    })
}).min(1); // At least one field is required for update

/**
 * Update status validation schema
 */
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('menunggu', 'dipanggil', 'selesai', 'terlewat')
    .required()
    .messages({
      'any.only': 'Status harus berupa: menunggu, dipanggil, selesai, atau terlewat',
      'any.required': 'Status diperlukan'
    })
});

/**
 * Antrian ID parameter validation schema
 */
const antrianIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID antrian harus berupa angka',
      'number.integer': 'ID antrian harus berupa angka bulat',
      'number.positive': 'ID antrian harus berupa angka positif',
      'any.required': 'ID antrian diperlukan'
    })
});

/**
 * Query parameters validation schema
 */
const queryParamsSchema = Joi.object({
  poli_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Poli ID harus berupa angka',
      'number.integer': 'Poli ID harus berupa angka bulat',
      'number.positive': 'Poli ID harus berupa angka positif'
    }),
  
  dokter_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Dokter ID harus berupa angka',
      'number.integer': 'Dokter ID harus berupa angka bulat',
      'number.positive': 'Dokter ID harus berupa angka positif'
    }),
  
  status: Joi.string()
    .valid('menunggu', 'dipanggil', 'selesai', 'terlewat')
    .optional()
    .messages({
      'any.only': 'Status harus berupa: menunggu, dipanggil, selesai, atau terlewat'
    }),
  
  date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Format tanggal harus ISO (YYYY-MM-DD)'
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
  
  today_only: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'today_only harus berupa boolean'
    }),
  
  with_details: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'with_details harus berupa boolean'
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
  
  search_by: Joi.string()
    .valid('nomor_antrian', 'nama_pasien', 'both')
    .default('both')
    .messages({
      'any.only': 'search_by harus berupa: nomor_antrian, nama_pasien, atau both'
    }),
  
  poli_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Poli ID harus berupa angka',
      'number.integer': 'Poli ID harus berupa angka bulat',
      'number.positive': 'Poli ID harus berupa angka positif'
    }),
  
  status: Joi.string()
    .valid('menunggu', 'dipanggil', 'selesai', 'terlewat')
    .optional()
    .messages({
      'any.only': 'Status harus berupa: menunggu, dipanggil, selesai, atau terlewat'
    }),
  
  date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Format tanggal harus ISO (YYYY-MM-DD)'
    })
});

/**
 * Date parameter validation schema
 */
const dateParamSchema = Joi.object({
  date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Format tanggal harus ISO (YYYY-MM-DD)'
    })
});

/**
 * Validate create antrian input
 * @param {Object} data - Antrian data
 * @returns {Object} Validated data
 */
const validateCreateAntrian = (data) => {
  const { error, value } = createAntrianSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data antrian tidak valid', errors);
  }

  return value;
};

/**
 * Validate update antrian input
 * @param {Object} data - Antrian data
 * @returns {Object} Validated data
 */
const validateUpdateAntrian = (data) => {
  const { error, value } = updateAntrianSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data antrian tidak valid', errors);
  }

  return value;
};

/**
 * Validate update status input
 * @param {Object} data - Status data
 * @returns {Object} Validated data
 */
const validateUpdateStatus = (data) => {
  const { error, value } = updateStatusSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Data status tidak valid', errors);
  }

  return value;
};

/**
 * Validate antrian ID parameter
 * @param {Object} params - Request parameters
 * @returns {Object} Validated parameters
 */
const validateAntrianId = (params) => {
  const { error, value } = antrianIdSchema.validate(params, { 
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
 * Validate query parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Validated query
 */
const validateQueryParams = (query) => {
  const { error, value } = queryParamsSchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw validationError('Parameter query tidak valid', errors);
  }

  return value;
};

/**
 * Validate search query
 * @param {Object} query - Search query parameters
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
 * Express middleware for validating create antrian
 */
const validateCreateAntrianMiddleware = (req, res, next) => {
  try {
    req.body = validateCreateAntrian(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating update antrian
 */
const validateUpdateAntrianMiddleware = (req, res, next) => {
  try {
    req.body = validateUpdateAntrian(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating update status
 */
const validateUpdateStatusMiddleware = (req, res, next) => {
  try {
    req.body = validateUpdateStatus(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating antrian ID parameter
 */
const validateAntrianIdMiddleware = (req, res, next) => {
  try {
    req.params = { ...req.params, ...validateAntrianId(req.params) };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating query parameters
 */
const validateQueryParamsMiddleware = (req, res, next) => {
  try {
    req.query = validateQueryParams(req.query);
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
  createAntrianSchema,
  updateAntrianSchema,
  updateStatusSchema,
  antrianIdSchema,
  queryParamsSchema,
  searchQuerySchema,
  dateParamSchema,
  validateCreateAntrian,
  validateUpdateAntrian,
  validateUpdateStatus,
  validateAntrianId,
  validateQueryParams,
  validateSearchQuery,
  validateCreateAntrianMiddleware,
  validateUpdateAntrianMiddleware,
  validateUpdateStatusMiddleware,
  validateAntrianIdMiddleware,
  validateQueryParamsMiddleware,
  validateSearchQueryMiddleware
};