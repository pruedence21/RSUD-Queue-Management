const BaseModel = require('./BaseModel');
const { createError, validationError } = require('../middleware/errorHandler');

/**
 * Dokter Model
 * Mengelola data dokter dan spesialisasi
 */
class Dokter extends BaseModel {
  constructor() {
    super('dokter');
  }

  /**
   * Validate dokter data
   * @param {Object} data - Dokter data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateData(data, isUpdate = false) {
    const errors = [];

    // Nama dokter validation
    if (!isUpdate || data.hasOwnProperty('nama_dokter')) {
      if (!data.nama_dokter || typeof data.nama_dokter !== 'string') {
        errors.push('Nama dokter diperlukan dan harus berupa string');
      } else if (data.nama_dokter.trim().length < 3) {
        errors.push('Nama dokter minimal 3 karakter');
      } else if (data.nama_dokter.trim().length > 100) {
        errors.push('Nama dokter maksimal 100 karakter');
      } else if (!/^[a-zA-Z\s.,-]+$/.test(data.nama_dokter.trim())) {
        errors.push('Nama dokter hanya boleh mengandung huruf, spasi, titik, koma, dan tanda hubung');
      }
    }

    // Spesialisasi validation
    if (data.hasOwnProperty('spesialisasi')) {
      if (data.spesialisasi && typeof data.spesialisasi !== 'string') {
        errors.push('Spesialisasi harus berupa string');
      } else if (data.spesialisasi && data.spesialisasi.trim().length > 100) {
        errors.push('Spesialisasi maksimal 100 karakter');
      }
    }

    // Poli ID validation
    if (!isUpdate || data.hasOwnProperty('poli_id')) {
      if (!data.poli_id) {
        errors.push('Poli harus dipilih');
      } else if (!Number.isInteger(data.poli_id) || data.poli_id <= 0) {
        errors.push('Poli ID harus berupa angka positif');
      }
    }

    // Aktif validation
    if (data.hasOwnProperty('aktif')) {
      if (typeof data.aktif !== 'boolean' && data.aktif !== 0 && data.aktif !== 1) {
        errors.push('Status aktif harus berupa boolean atau 0/1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if poli exists
   * @param {number} poliId - Poli ID
   * @returns {Promise<boolean>} Poli exists
   */
  async checkPoliExists(poliId) {
    const query = 'SELECT COUNT(*) as count FROM poli WHERE id = ?';
    const result = await this.executeQuery(query, [poliId]);
    return result[0].count > 0;
  }

  /**
   * Create new dokter with validation
   * @param {Object} data - Dokter data
   * @returns {Promise<Object>} Created dokter
   */
  async create(data) {
    // Clean and prepare data
    const cleanData = {
      nama_dokter: data.nama_dokter?.trim(),
      spesialisasi: data.spesialisasi?.trim() || null,
      poli_id: parseInt(data.poli_id),
      aktif: data.aktif !== undefined ? data.aktif : true
    };

    // Validate data
    const validation = this.validateData(cleanData);
    if (!validation.isValid) {
      throw validationError('Data dokter tidak valid', validation.errors);
    }

    // Check if poli exists
    const poliExists = await this.checkPoliExists(cleanData.poli_id);
    if (!poliExists) {
      throw createError('Poli yang dipilih tidak ditemukan', 400);
    }

    return await super.create(cleanData);
  }

  /**
   * Update dokter with validation
   * @param {number} id - Dokter ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated dokter
   */
  async updateById(id, data) {
    // Clean and prepare data
    const cleanData = {};
    
    if (data.nama_dokter !== undefined) {
      cleanData.nama_dokter = data.nama_dokter?.trim();
    }
    
    if (data.spesialisasi !== undefined) {
      cleanData.spesialisasi = data.spesialisasi?.trim() || null;
    }
    
    if (data.poli_id !== undefined) {
      cleanData.poli_id = parseInt(data.poli_id);
    }
    
    if (data.aktif !== undefined) {
      cleanData.aktif = data.aktif;
    }

    // Validate data
    const validation = this.validateData(cleanData, true);
    if (!validation.isValid) {
      throw validationError('Data dokter tidak valid', validation.errors);
    }

    // Check if poli exists (only if poli_id is being updated)
    if (cleanData.poli_id) {
      const poliExists = await this.checkPoliExists(cleanData.poli_id);
      if (!poliExists) {
        throw createError('Poli yang dipilih tidak ditemukan', 400);
      }
    }

    return await super.updateById(id, cleanData);
  }

  /**
   * Get all active dokter
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active dokter list
   */
  async findAllActive(options = {}) {
    return await this.findBy({ aktif: true }, { 
      orderBy: 'nama_dokter ASC',
      ...options 
    });
  }

  /**
   * Find dokter by poli ID
   * @param {number} poliId - Poli ID
   * @param {boolean} activeOnly - Only active dokter
   * @returns {Promise<Array>} Dokter list
   */
  async findByPoliId(poliId, activeOnly = false) {
    const conditions = { poli_id: poliId };
    if (activeOnly) {
      conditions.aktif = true;
    }

    return await this.findBy(conditions, { orderBy: 'nama_dokter ASC' });
  }

  /**
   * Get dokter with poli information
   * @param {number} id - Dokter ID
   * @returns {Promise<Object|null>} Dokter with poli data
   */
  async findWithPoli(id) {
    const query = `
      SELECT 
        d.*,
        p.nama_poli,
        p.kode_poli,
        p.aktif as poli_aktif
      FROM dokter d
      LEFT JOIN poli p ON d.poli_id = p.id
      WHERE d.id = ?
    `;
    
    const result = await this.executeQuery(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get all dokter with poli information
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Dokter list with poli data
   */
  async findAllWithPoli(options = {}) {
    const { 
      activeOnly = false, 
      poliId = null, 
      limit = null, 
      offset = 0,
      orderBy = 'd.nama_dokter ASC'
    } = options;

    let whereConditions = [];
    let params = [];

    if (activeOnly) {
      whereConditions.push('d.aktif = ?');
      params.push(true);
    }

    if (poliId) {
      whereConditions.push('d.poli_id = ?');
      params.push(poliId);
    }

    let query = `
      SELECT 
        d.*,
        p.nama_poli,
        p.kode_poli,
        p.aktif as poli_aktif
      FROM dokter d
      LEFT JOIN poli p ON d.poli_id = p.id
    `;

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY ${orderBy}`;

    if (limit) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return await this.executeQuery(query, params);
  }

  /**
   * Search dokter by name or specialization
   * @param {string} searchTerm - Search term
   * @param {boolean} activeOnly - Only search active dokter
   * @param {number} poliId - Filter by poli ID
   * @returns {Promise<Array>} Search results
   */
  async search(searchTerm, activeOnly = false, poliId = null) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    const searchPattern = `%${searchTerm.trim()}%`;
    let whereConditions = ['(d.nama_dokter LIKE ? OR d.spesialisasi LIKE ?)'];
    let params = [searchPattern, searchPattern];

    if (activeOnly) {
      whereConditions.push('d.aktif = ?');
      params.push(true);
    }

    if (poliId) {
      whereConditions.push('d.poli_id = ?');
      params.push(poliId);
    }

    const query = `
      SELECT 
        d.*,
        p.nama_poli,
        p.kode_poli
      FROM dokter d
      LEFT JOIN poli p ON d.poli_id = p.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.nama_dokter ASC
    `;

    return await this.executeQuery(query, params);
  }

  /**
   * Get dokter statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const totalDokter = await this.count();
    const activeDokter = await this.count({ aktif: true });
    const inactiveDokter = totalDokter - activeDokter;

    // Get dokter count by poli
    const poliStatsQuery = `
      SELECT 
        p.nama_poli,
        p.kode_poli,
        COUNT(d.id) as jumlah_dokter
      FROM poli p
      LEFT JOIN dokter d ON p.id = d.poli_id AND d.aktif = true
      WHERE p.aktif = true
      GROUP BY p.id, p.nama_poli, p.kode_poli
      ORDER BY p.nama_poli ASC
    `;
    const poliStats = await this.executeQuery(poliStatsQuery);

    return {
      total: totalDokter,
      active: activeDokter,
      inactive: inactiveDokter,
      byPoli: poliStats
    };
  }

  /**
   * Check if dokter can be deleted
   * @param {number} id - Dokter ID
   * @returns {Promise<boolean>} Can be deleted
   */
  async canBeDeleted(id) {
    // Check if dokter has associated antrian
    const antrianQuery = 'SELECT COUNT(*) as count FROM antrian WHERE dokter_id = ?';
    const antrianResult = await this.executeQuery(antrianQuery, [id]);
    const hasAntrian = antrianResult[0].count > 0;

    return !hasAntrian;
  }

  /**
   * Safe delete - check dependencies before deleting
   * @param {number} id - Dokter ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async safeDelete(id) {
    const canDelete = await this.canBeDeleted(id);
    if (!canDelete) {
      throw createError('Dokter tidak dapat dihapus karena masih memiliki antrian', 400);
    }

    return await this.deleteById(id);
  }

  /**
   * Get count of dokter by poli
   * @param {number} poliId - Poli ID
   * @param {boolean} activeOnly - Only count active dokter
   * @returns {Promise<number>} Count
   */
  async countByPoli(poliId, activeOnly = false) {
    const conditions = { poli_id: poliId };
    if (activeOnly) {
      conditions.aktif = true;
    }
    return await this.count(conditions);
  }

  /**
   * Toggle dokter status
   * @param {number} id - Dokter ID
   * @returns {Promise<Object|null>} Updated dokter
   */
  async toggleStatus(id) {
    const dokter = await this.findById(id);
    if (!dokter) {
      throw createError('Dokter tidak ditemukan', 404);
    }

    const newStatus = !dokter.aktif;
    return await this.updateById(id, { aktif: newStatus });
  }
}

module.exports = new Dokter();