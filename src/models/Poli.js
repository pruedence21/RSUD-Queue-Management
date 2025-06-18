const BaseModel = require('./BaseModel');
const { createError, validationError } = require('../middleware/errorHandler');

/**
 * Poli Model
 * Mengelola data poliklinik/ruang pelayanan
 */
class Poli extends BaseModel {
  constructor() {
    super('poli');
  }

  /**
   * Validate poli data
   * @param {Object} data - Poli data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateData(data, isUpdate = false) {
    const errors = [];

    // Nama poli validation
    if (!isUpdate || data.hasOwnProperty('nama_poli')) {
      if (!data.nama_poli || typeof data.nama_poli !== 'string') {
        errors.push('Nama poli diperlukan dan harus berupa string');
      } else if (data.nama_poli.trim().length < 3) {
        errors.push('Nama poli minimal 3 karakter');
      } else if (data.nama_poli.trim().length > 100) {
        errors.push('Nama poli maksimal 100 karakter');
      }
    }

    // Kode poli validation
    if (!isUpdate || data.hasOwnProperty('kode_poli')) {
      if (!data.kode_poli || typeof data.kode_poli !== 'string') {
        errors.push('Kode poli diperlukan dan harus berupa string');
      } else if (data.kode_poli.trim().length < 2) {
        errors.push('Kode poli minimal 2 karakter');
      } else if (data.kode_poli.trim().length > 10) {
        errors.push('Kode poli maksimal 10 karakter');
      } else if (!/^[A-Z0-9]+$/.test(data.kode_poli.trim())) {
        errors.push('Kode poli hanya boleh mengandung huruf besar dan angka');
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
   * Create new poli with validation
   * @param {Object} data - Poli data
   * @returns {Promise<Object>} Created poli
   */
  async create(data) {
    // Clean and prepare data
    const cleanData = {
      nama_poli: data.nama_poli?.trim(),
      kode_poli: data.kode_poli?.trim().toUpperCase(),
      aktif: data.aktif !== undefined ? data.aktif : true
    };

    // Validate data
    const validation = this.validateData(cleanData);
    if (!validation.isValid) {
      throw validationError('Data poli tidak valid', validation.errors);
    }

    // Check if kode_poli already exists
    const existingPoli = await this.findByKode(cleanData.kode_poli);
    if (existingPoli) {
      throw createError('Kode poli sudah digunakan', 409);
    }

    return await super.create(cleanData);
  }

  /**
   * Update poli with validation
   * @param {number} id - Poli ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated poli
   */
  async updateById(id, data) {
    // Clean and prepare data
    const cleanData = {};
    
    if (data.nama_poli !== undefined) {
      cleanData.nama_poli = data.nama_poli?.trim();
    }
    
    if (data.kode_poli !== undefined) {
      cleanData.kode_poli = data.kode_poli?.trim().toUpperCase();
    }
    
    if (data.aktif !== undefined) {
      cleanData.aktif = data.aktif;
    }

    // Validate data
    const validation = this.validateData(cleanData, true);
    if (!validation.isValid) {
      throw validationError('Data poli tidak valid', validation.errors);
    }

    // Check if kode_poli already exists (excluding current record)
    if (cleanData.kode_poli) {
      const existingPoli = await this.findByKode(cleanData.kode_poli);
      if (existingPoli && existingPoli.id !== id) {
        throw createError('Kode poli sudah digunakan', 409);
      }
    }

    return await super.updateById(id, cleanData);
  }

  /**
   * Find poli by kode
   * @param {string} kodePoli - Kode poli
   * @returns {Promise<Object|null>} Poli or null
   */
  async findByKode(kodePoli) {
    if (!kodePoli) return null;
    return await this.findOne({ kode_poli: kodePoli.toUpperCase() });
  }

  /**
   * Get all active poli
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active poli list
   */
  async findAllActive(options = {}) {
    return await this.findBy({ aktif: true }, { 
      orderBy: 'nama_poli ASC',
      ...options 
    });
  }

  /**
   * Search poli by name
   * @param {string} searchTerm - Search term
   * @param {boolean} activeOnly - Only search active poli
   * @returns {Promise<Array>} Search results
   */
  async searchByName(searchTerm, activeOnly = false) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    const searchPattern = `%${searchTerm.trim()}%`;
    let whereClause = 'nama_poli LIKE ?';
    const params = [searchPattern];

    if (activeOnly) {
      whereClause += ' AND aktif = ?';
      params.push(true);
    }

    return await this.findAll({
      where: whereClause,
      params,
      orderBy: 'nama_poli ASC'
    });
  }

  /**
   * Get poli statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const totalPoli = await this.count();
    const activePoli = await this.count({ aktif: true });
    const inactivePoli = totalPoli - activePoli;

    return {
      total: totalPoli,
      active: activePoli,
      inactive: inactivePoli
    };
  }

  /**
   * Check if poli can be deleted
   * @param {number} id - Poli ID
   * @returns {Promise<boolean>} Can be deleted
   */
  async canBeDeleted(id) {
    // Check if poli has associated dokter
    const dokterQuery = 'SELECT COUNT(*) as count FROM dokter WHERE poli_id = ?';
    const dokterResult = await this.executeQuery(dokterQuery, [id]);
    const hasDokter = dokterResult[0].count > 0;

    // Check if poli has associated antrian
    const antrianQuery = 'SELECT COUNT(*) as count FROM antrian WHERE poli_id = ?';
    const antrianResult = await this.executeQuery(antrianQuery, [id]);
    const hasAntrian = antrianResult[0].count > 0;

    return !hasDokter && !hasAntrian;
  }

  /**
   * Safe delete poli (check dependencies first)
   * @param {number} id - Poli ID
   * @returns {Promise<boolean>} True if deleted
   */
  async safeDelete(id) {
    const canDelete = await this.canBeDeleted(id);
    if (!canDelete) {
      throw createError('Poli tidak dapat dihapus karena masih memiliki dokter atau antrian', 400);
    }

    return await this.deleteById(id);
  }

  /**
   * Get poli with dokter count
   * @returns {Promise<Array>} Poli with dokter count
   */
  async findAllWithDokterCount() {
    const query = `
      SELECT 
        p.*,
        COUNT(d.id) as jumlah_dokter
      FROM poli p
      LEFT JOIN dokter d ON p.id = d.poli_id AND d.aktif = true
      GROUP BY p.id
      ORDER BY p.nama_poli ASC
    `;

    return await this.executeQuery(query);
  }

  /**
   * Get poli with today's antrian count
   * @returns {Promise<Array>} Poli with antrian count
   */
  async findAllWithTodayAntrianCount() {
    const query = `
      SELECT 
        p.*,
        COUNT(a.id) as antrian_hari_ini
      FROM poli p
      LEFT JOIN antrian a ON p.id = a.poli_id 
        AND DATE(a.created_at) = CURDATE()
      GROUP BY p.id
      ORDER BY p.nama_poli ASC
    `;

    return await this.executeQuery(query);
  }

  /**
   * Toggle poli status (aktif/tidak aktif)
   * @param {number} id - Poli ID
   * @returns {Promise<Object|null>} Updated poli
   */
  async toggleStatus(id) {
    const poli = await this.findById(id);
    if (!poli) {
      throw createError('Poli tidak ditemukan', 404);
    }

    return await this.updateById(id, { aktif: !poli.aktif });
  }
}

module.exports = new Poli();