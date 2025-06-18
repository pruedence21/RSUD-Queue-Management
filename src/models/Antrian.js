const BaseModel = require('./BaseModel');
const { createError, validationError } = require('../middleware/errorHandler');

/**
 * Antrian Model
 * Mengelola data antrian pasien
 */
class Antrian extends BaseModel {
  constructor() {
    super('antrian');
  }

  /**
   * Validate antrian data
   * @param {Object} data - Antrian data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateData(data, isUpdate = false) {
    const errors = [];

    // Nomor antrian validation (only for updates, auto-generated for create)
    if (isUpdate && data.hasOwnProperty('nomor_antrian')) {
      if (!data.nomor_antrian || typeof data.nomor_antrian !== 'string') {
        errors.push('Nomor antrian diperlukan dan harus berupa string');
      } else if (data.nomor_antrian.trim().length < 1) {
        errors.push('Nomor antrian tidak boleh kosong');
      } else if (data.nomor_antrian.trim().length > 20) {
        errors.push('Nomor antrian maksimal 20 karakter');
      }
    }

    // Poli ID validation
    if (!isUpdate || data.hasOwnProperty('poli_id')) {
      if (!isUpdate && !data.poli_id) {
        errors.push('Poli ID diperlukan');
      } else if (data.poli_id && (!Number.isInteger(data.poli_id) || data.poli_id <= 0)) {
        errors.push('Poli ID harus berupa angka positif');
      }
    }

    // Dokter ID validation (optional)
    if (data.hasOwnProperty('dokter_id') && data.dokter_id !== null) {
      if (!Number.isInteger(data.dokter_id) || data.dokter_id <= 0) {
        errors.push('Dokter ID harus berupa angka positif');
      }
    }

    // Nama pasien validation
    if (!isUpdate || data.hasOwnProperty('nama_pasien')) {
      if (!data.nama_pasien || typeof data.nama_pasien !== 'string') {
        errors.push('Nama pasien diperlukan dan harus berupa string');
      } else if (data.nama_pasien.trim().length < 2) {
        errors.push('Nama pasien minimal 2 karakter');
      } else if (data.nama_pasien.trim().length > 100) {
        errors.push('Nama pasien maksimal 100 karakter');
      }
    }

    // Status validation
    if (data.hasOwnProperty('status')) {
      const validStatuses = ['menunggu', 'dipanggil', 'selesai', 'terlewat'];
      if (!validStatuses.includes(data.status)) {
        errors.push('Status harus berupa: menunggu, dipanggil, selesai, atau terlewat');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate nomor antrian for poli
   * @param {number} poliId - Poli ID
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Promise<string>} Generated antrian number
   */
  async generateNomorAntrian(poliId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0]; // Today's date
      }

      // Get poli code
      const poliQuery = 'SELECT kode_poli FROM poli WHERE id = ?';
      const poliResult = await this.executeQuery(poliQuery, [poliId]);
      
      if (poliResult.length === 0) {
        throw createError('Poli tidak ditemukan', 404);
      }

      const kodePoli = poliResult[0].kode_poli;

      // Count existing antrian for today
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM antrian 
        WHERE poli_id = ? AND DATE(jam_daftar) = ?
      `;
      const countResult = await this.executeQuery(countQuery, [poliId, date]);
      const nextNumber = countResult[0].count + 1;

      // Format: KODE-YYYYMMDD-XXX (e.g., UMUM-20250615-001)
      const dateFormatted = date.replace(/-/g, '');
      const nomorAntrian = `${kodePoli}-${dateFormatted}-${nextNumber.toString().padStart(3, '0')}`;

      return nomorAntrian;
    } catch (error) {
      throw createError('Gagal generate nomor antrian: ' + error.message);
    }
  }

  /**
   * Create new antrian with validation
   * @param {Object} data - Antrian data
   * @returns {Promise<Object>} Created antrian
   */
  async create(data) {
    // Clean and prepare data
    const cleanData = {
      poli_id: parseInt(data.poli_id),
      dokter_id: data.dokter_id ? parseInt(data.dokter_id) : null,
      nama_pasien: data.nama_pasien?.trim(),
      status: data.status || 'menunggu'
    };

    // Validate data
    const validation = this.validateData(cleanData);
    if (!validation.isValid) {
      console.log('Validation failed for data:', cleanData);
      console.log('Validation errors:', validation.errors);
      throw validationError('Data antrian tidak valid', validation.errors);
    }

    // Verify poli exists and is active
    const poliQuery = 'SELECT id, nama_poli, aktif FROM poli WHERE id = ?';
    const poliResult = await this.executeQuery(poliQuery, [cleanData.poli_id]);
    
    if (poliResult.length === 0) {
      throw createError('Poli tidak ditemukan', 404);
    }

    if (!poliResult[0].aktif) {
      throw createError('Poli tidak aktif', 400);
    }

    // Verify dokter exists and is active (if provided)
    if (cleanData.dokter_id) {
      const dokterQuery = 'SELECT id, nama_dokter, aktif, poli_id FROM dokter WHERE id = ?';
      const dokterResult = await this.executeQuery(dokterQuery, [cleanData.dokter_id]);
      
      if (dokterResult.length === 0) {
        throw createError('Dokter tidak ditemukan', 404);
      }

      if (!dokterResult[0].aktif) {
        throw createError('Dokter tidak aktif', 400);
      }

      if (dokterResult[0].poli_id !== cleanData.poli_id) {
        throw createError('Dokter tidak sesuai dengan poli', 400);
      }
    }

    // Generate nomor antrian
    cleanData.nomor_antrian = await this.generateNomorAntrian(cleanData.poli_id);
    cleanData.jam_daftar = new Date();

    return await super.create(cleanData);
  }

  /**
   * Update antrian status
   * @param {number} id - Antrian ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object|null>} Updated antrian
   */
  async updateStatus(id, status, additionalData = {}) {
    const validStatuses = ['menunggu', 'dipanggil', 'selesai', 'terlewat'];
    if (!validStatuses.includes(status)) {
      throw createError('Status tidak valid', 400);
    }

    const updateData = { status, ...additionalData };

    // Set jam_panggil when status is 'dipanggil'
    if (status === 'dipanggil') {
      updateData.jam_panggil = new Date();
    }

    return await this.updateById(id, updateData);
  }

  /**
   * Get antrian by poli with details
   * @param {number} poliId - Poli ID
   * @param {string} status - Filter by status (optional)
   * @param {string} date - Filter by date (optional)
   * @returns {Promise<Array>} Antrian list with details
   */
  async findByPoliWithDetails(poliId, status = null, date = null) {
    let whereClause = 'a.poli_id = ?';
    const params = [poliId];

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      whereClause += ' AND DATE(a.jam_daftar) = ?';
      params.push(date);
    }

    const query = `
      SELECT 
        a.*,
        p.nama_poli,
        p.kode_poli,
        d.nama_dokter,
        d.spesialisasi
      FROM antrian a
      LEFT JOIN poli p ON a.poli_id = p.id
      LEFT JOIN dokter d ON a.dokter_id = d.id
      WHERE ${whereClause}
      ORDER BY a.jam_daftar ASC
    `;

    return await this.executeQuery(query, params);
  }

  /**
   * Get antrian by dokter
   * @param {number} dokterId - Dokter ID
   * @param {string} status - Filter by status (optional)
   * @param {string} date - Filter by date (optional)
   * @returns {Promise<Array>} Antrian list
   */
  async findByDokter(dokterId, status = null, date = null) {
    let whereClause = 'a.dokter_id = ?';
    const params = [dokterId];

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      whereClause += ' AND DATE(a.jam_daftar) = ?';
      params.push(date);
    }

    const query = `
      SELECT 
        a.*,
        p.nama_poli,
        p.kode_poli,
        d.nama_dokter,
        d.spesialisasi
      FROM antrian a
      LEFT JOIN poli p ON a.poli_id = p.id
      LEFT JOIN dokter d ON a.dokter_id = d.id
      WHERE ${whereClause}
      ORDER BY a.jam_daftar ASC
    `;

    return await this.executeQuery(query, params);
  }

  /**
   * Get next antrian number for calling
   * @param {number} poliId - Poli ID
   * @param {number} dokterId - Dokter ID (optional)
   * @returns {Promise<Object|null>} Next antrian or null
   */
  async getNextAntrian(poliId, dokterId = null) {
    let whereClause = 'poli_id = ? AND status = ?';
    const params = [poliId, 'menunggu'];

    if (dokterId) {
      whereClause += ' AND (dokter_id = ? OR dokter_id IS NULL)';
      params.push(dokterId);
    }

    const query = `
      SELECT * FROM antrian 
      WHERE ${whereClause}
      ORDER BY jam_daftar ASC 
      LIMIT 1
    `;

    const result = await this.executeQuery(query, params);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get current antrian being called
   * @param {number} poliId - Poli ID
   * @param {number} dokterId - Dokter ID (optional)
   * @returns {Promise<Object|null>} Current antrian or null
   */
  async getCurrentAntrian(poliId, dokterId = null) {
    let whereClause = 'poli_id = ? AND status = ?';
    const params = [poliId, 'dipanggil'];

    if (dokterId) {
      whereClause += ' AND dokter_id = ?';
      params.push(dokterId);
    }

    const query = `
      SELECT * FROM antrian 
      WHERE ${whereClause}
      ORDER BY jam_panggil DESC 
      LIMIT 1
    `;

    const result = await this.executeQuery(query, params);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get antrian statistics
   * @param {string} date - Date filter (optional)
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(date = null) {
    let whereClause = '';
    const params = [];

    if (date) {
      whereClause = 'WHERE DATE(jam_daftar) = ?';
      params.push(date);
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'menunggu' THEN 1 ELSE 0 END) as menunggu,
        SUM(CASE WHEN status = 'dipanggil' THEN 1 ELSE 0 END) as dipanggil,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'terlewat' THEN 1 ELSE 0 END) as terlewat
      FROM antrian 
      ${whereClause}
    `;

    const result = await this.executeQuery(query, params);
    return result[0];
  }

  /**
   * Get antrian statistics by poli
   * @param {string} date - Date filter (optional)
   * @returns {Promise<Array>} Statistics by poli
   */
  async getStatisticsByPoli(date = null) {
    let whereClause = '';
    const params = [];

    if (date) {
      whereClause = 'WHERE DATE(a.jam_daftar) = ?';
      params.push(date);
    }

    const query = `
      SELECT 
        p.id as poli_id,
        p.nama_poli,
        p.kode_poli,
        COUNT(a.id) as total_antrian,
        SUM(CASE WHEN a.status = 'menunggu' THEN 1 ELSE 0 END) as menunggu,
        SUM(CASE WHEN a.status = 'dipanggil' THEN 1 ELSE 0 END) as dipanggil,
        SUM(CASE WHEN a.status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN a.status = 'terlewat' THEN 1 ELSE 0 END) as terlewat
      FROM poli p
      LEFT JOIN antrian a ON p.id = a.poli_id ${date ? 'AND DATE(a.jam_daftar) = ?' : ''}
      WHERE p.aktif = true
      GROUP BY p.id, p.nama_poli, p.kode_poli
      ORDER BY p.nama_poli ASC
    `;

    return await this.executeQuery(query, params);
  }

  /**
   * Check if nomor antrian exists for today
   * @param {string} nomorAntrian - Nomor antrian
   * @returns {Promise<boolean>} Exists or not
   */
  async isNomorAntrianExistsToday(nomorAntrian) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT COUNT(*) as count 
      FROM antrian 
      WHERE nomor_antrian = ? AND DATE(jam_daftar) = ?
    `;
    
    const result = await this.executeQuery(query, [nomorAntrian, today]);
    return result[0].count > 0;
  }

  /**
   * Get waiting time estimation
   * @param {number} poliId - Poli ID
   * @param {number} antrianId - Current antrian ID
   * @returns {Promise<Object>} Estimation data
   */
  async getWaitingTimeEstimation(poliId, antrianId) {
    // Get antrian position
    const positionQuery = `
      SELECT COUNT(*) as position
      FROM antrian 
      WHERE poli_id = ? 
        AND status = 'menunggu' 
        AND jam_daftar < (SELECT jam_daftar FROM antrian WHERE id = ?)
    `;
    
    const positionResult = await this.executeQuery(positionQuery, [poliId, antrianId]);
    const position = positionResult[0].position + 1; // +1 for current position

    // Average service time (in minutes) - could be configurable
    const avgServiceTime = 15; // 15 minutes per patient
    const estimatedWaitTime = position * avgServiceTime;

    return {
      position,
      estimatedWaitTimeMinutes: estimatedWaitTime,
      estimatedWaitTimeText: this.formatWaitTime(estimatedWaitTime)
    };
  }

  /**
   * Format wait time to human readable
   * @param {number} minutes - Wait time in minutes
   * @returns {string} Formatted time
   */
  formatWaitTime(minutes) {
    if (minutes < 60) {
      return `${minutes} menit`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} jam ${remainingMinutes} menit`;
    }
  }

  /**
   * Get today's antrian for display
   * @param {number} poliId - Poli ID (optional)
   * @returns {Promise<Array>} Display data
   */
  async getTodayAntrianForDisplay(poliId = null) {
    const today = new Date().toISOString().split('T')[0];
    let whereClause = 'DATE(a.jam_daftar) = ?';
    const params = [today];

    if (poliId) {
      whereClause += ' AND a.poli_id = ?';
      params.push(poliId);
    }

    const query = `
      SELECT 
        a.id,
        a.nomor_antrian,
        a.nama_pasien,
        a.status,
        a.jam_daftar,
        a.jam_panggil,
        p.nama_poli,
        p.kode_poli,
        d.nama_dokter
      FROM antrian a
      LEFT JOIN poli p ON a.poli_id = p.id
      LEFT JOIN dokter d ON a.dokter_id = d.id
      WHERE ${whereClause}
      ORDER BY a.jam_daftar ASC
    `;

    return await this.executeQuery(query, params);
  }
}

module.exports = new Antrian();