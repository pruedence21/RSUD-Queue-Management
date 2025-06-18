const Antrian = require('../models/Antrian');
const logger = require('../utils/logger');
const { success, error, paginated, send } = require('../utils/response');
const { asyncHandler, notFoundError } = require('../middleware/errorHandler');

/**
 * Antrian Controller
 * Menangani operasi CRUD dan logika antrian pasien
 */

/**
 * Get all antrian
 * @route GET /api/antrian
 * @access Private (Admin/Petugas)
 */
const getAllAntrian = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    poli_id, 
    dokter_id, 
    status, 
    date,
    today_only = false,
    with_details = false 
  } = req.query;

  let conditions = {};
  let options = { orderBy: 'jam_daftar ASC' };

  // Add filters
  if (poli_id) conditions.poli_id = parseInt(poli_id);
  if (dokter_id) conditions.dokter_id = parseInt(dokter_id);
  if (status) conditions.status = status;

  // Date filter
  if (today_only === 'true' || date) {
    const filterDate = date || new Date().toISOString().split('T')[0];
    const dateQuery = 'DATE(jam_daftar) = ?';
    options.where = dateQuery;
    options.params = [filterDate];
  }

  if (with_details === 'true') {
    // Get antrian with poli and dokter details
    let whereClause = '1=1';
    const params = [];

    if (poli_id) {
      whereClause += ' AND a.poli_id = ?';
      params.push(poli_id);
    }
    if (dokter_id) {
      whereClause += ' AND a.dokter_id = ?';
      params.push(dokter_id);
    }
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }
    if (today_only === 'true' || date) {
      const filterDate = date || new Date().toISOString().split('T')[0];
      whereClause += ' AND DATE(a.jam_daftar) = ?';
      params.push(filterDate);
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
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    const antrian = await Antrian.executeQuery(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM antrian a
      WHERE ${whereClause}
    `;
    const countResult = await Antrian.executeQuery(countQuery, params);
    const totalItems = countResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    const responseData = paginated(
      'Data antrian berhasil diambil',
      antrian,
      {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    );

    return send(res, responseData);
  } else {
    // Regular pagination
    const result = await Antrian.paginate(
      parseInt(page),
      parseInt(limit),
      conditions,
      'jam_daftar ASC'
    );

    const responseData = paginated(
      'Data antrian berhasil diambil',
      result.data,
      result.pagination
    );

    return send(res, responseData);
  }
});

/**
 * Get antrian by ID
 * @route GET /api/antrian/:id
 * @access Private (Admin/Petugas)
 */
const getAntrianById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const antrian = await Antrian.findById(parseInt(id));

  if (!antrian) {
    throw notFoundError('Antrian tidak ditemukan');
  }

  const responseData = success('Data antrian berhasil diambil', { antrian });
  send(res, responseData);
});

/**
 * Create new antrian
 * @route POST /api/antrian
 * @access Private (Admin/Petugas)
 */
const createAntrian = asyncHandler(async (req, res) => {
  const antrianData = req.body;

  const newAntrian = await Antrian.create(antrianData);

  logger.info('Antrian created', {
    antrianId: newAntrian.id,
    nomor_antrian: newAntrian.nomor_antrian,
    nama_pasien: newAntrian.nama_pasien,
    poli_id: newAntrian.poli_id,
    createdBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Antrian berhasil dibuat', { antrian: newAntrian }, 201);
  send(res, responseData);
});

/**
 * Update antrian
 * @route PUT /api/antrian/:id
 * @access Private (Admin/Petugas)
 */
const updateAntrian = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedAntrian = await Antrian.updateById(parseInt(id), updateData);

  if (!updatedAntrian) {
    throw notFoundError('Antrian tidak ditemukan');
  }

  logger.info('Antrian updated', {
    antrianId: updatedAntrian.id,
    nomor_antrian: updatedAntrian.nomor_antrian,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Antrian berhasil diperbarui', { antrian: updatedAntrian });
  send(res, responseData);
});

/**
 * Update antrian status
 * @route PATCH /api/antrian/:id/status
 * @access Private (Admin/Petugas)
 */
const updateAntrianStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updatedAntrian = await Antrian.updateStatus(parseInt(id), status);

  if (!updatedAntrian) {
    throw notFoundError('Antrian tidak ditemukan');
  }

  logger.info('Antrian status updated', {
    antrianId: updatedAntrian.id,
    nomor_antrian: updatedAntrian.nomor_antrian,
    newStatus: status,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success(`Status antrian berhasil diubah menjadi ${status}`, { antrian: updatedAntrian });
  send(res, responseData);
});

/**
 * Delete antrian
 * @route DELETE /api/antrian/:id
 * @access Private (Admin only)
 */
const deleteAntrian = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get antrian data before deletion for logging
  const antrian = await Antrian.findById(parseInt(id));

  if (!antrian) {
    throw notFoundError('Antrian tidak ditemukan');
  }

  const deleted = await Antrian.deleteById(parseInt(id));

  if (!deleted) {
    const errorResponse = error('Antrian tidak dapat dihapus', null, 400);
    return send(res, errorResponse);
  }

  logger.info('Antrian deleted', {
    antrianId: antrian.id,
    nomor_antrian: antrian.nomor_antrian,
    nama_pasien: antrian.nama_pasien,
    deletedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Antrian berhasil dihapus');
  send(res, responseData);
});

/**
 * Get antrian by poli
 * @route GET /api/antrian/poli/:poliId
 * @access Private (Admin/Petugas)
 */
const getAntrianByPoli = asyncHandler(async (req, res) => {
  const { poliId } = req.params;
  const { status, date, with_details = true } = req.query;

  const filterDate = date || new Date().toISOString().split('T')[0];

  const antrian = await Antrian.findByPoliWithDetails(
    parseInt(poliId),
    status || null,
    filterDate
  );

  const responseData = success('Data antrian poli berhasil diambil', { 
    antrian,
    filters: {
      poli_id: parseInt(poliId),
      status: status || 'semua',
      date: filterDate
    }
  });
  send(res, responseData);
});

/**
 * Get antrian by dokter
 * @route GET /api/antrian/dokter/:dokterId
 * @access Private (Admin/Petugas)
 */
const getAntrianByDokter = asyncHandler(async (req, res) => {
  const { dokterId } = req.params;
  const { status, date } = req.query;

  const filterDate = date || new Date().toISOString().split('T')[0];

  const antrian = await Antrian.findByDokter(
    parseInt(dokterId),
    status || null,
    filterDate
  );

  const responseData = success('Data antrian dokter berhasil diambil', { 
    antrian,
    filters: {
      dokter_id: parseInt(dokterId),
      status: status || 'semua',
      date: filterDate
    }
  });
  send(res, responseData);
});

/**
 * Get next antrian to call
 * @route GET /api/antrian/next/:poliId
 * @access Private (Admin/Petugas)
 */
const getNextAntrian = asyncHandler(async (req, res) => {
  const { poliId } = req.params;
  const { dokter_id } = req.query;

  const nextAntrian = await Antrian.getNextAntrian(
    parseInt(poliId),
    dokter_id ? parseInt(dokter_id) : null
  );

  if (!nextAntrian) {
    const responseData = success('Tidak ada antrian yang menunggu', { antrian: null });
    return send(res, responseData);
  }

  const responseData = success('Antrian berikutnya ditemukan', { antrian: nextAntrian });
  send(res, responseData);
});

/**
 * Call next antrian
 * @route POST /api/antrian/call/:poliId
 * @access Private (Admin/Petugas)
 */
const callNextAntrian = asyncHandler(async (req, res) => {
  const { poliId } = req.params;
  const { dokter_id } = req.body;

  // Get next antrian
  const nextAntrian = await Antrian.getNextAntrian(
    parseInt(poliId),
    dokter_id ? parseInt(dokter_id) : null
  );

  if (!nextAntrian) {
    const errorResponse = error('Tidak ada antrian yang menunggu', null, 404);
    return send(res, errorResponse);
  }

  // Update status to 'dipanggil'
  const calledAntrian = await Antrian.updateStatus(nextAntrian.id, 'dipanggil', {
    dokter_id: dokter_id || nextAntrian.dokter_id
  });

  logger.info('Antrian called', {
    antrianId: calledAntrian.id,
    nomor_antrian: calledAntrian.nomor_antrian,
    poli_id: parseInt(poliId),
    dokter_id: dokter_id,
    calledBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Antrian berhasil dipanggil', { antrian: calledAntrian });
  send(res, responseData);
});

/**
 * Get current antrian being called
 * @route GET /api/antrian/current/:poliId
 * @access Private (Admin/Petugas)
 */
const getCurrentAntrian = asyncHandler(async (req, res) => {
  const { poliId } = req.params;
  const { dokter_id } = req.query;

  const currentAntrian = await Antrian.getCurrentAntrian(
    parseInt(poliId),
    dokter_id ? parseInt(dokter_id) : null
  );

  const responseData = success('Antrian saat ini', { antrian: currentAntrian });
  send(res, responseData);
});

/**
 * Get antrian statistics
 * @route GET /api/antrian/statistics
 * @access Private (Admin/Petugas)
 */
const getAntrianStatistics = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filterDate = date || new Date().toISOString().split('T')[0];

  const stats = await Antrian.getStatistics(filterDate);

  const responseData = success('Statistik antrian berhasil diambil', { 
    statistics: stats,
    date: filterDate
  });
  send(res, responseData);
});

/**
 * Get antrian statistics by poli
 * @route GET /api/antrian/statistics/poli
 * @access Private (Admin/Petugas)
 */
const getAntrianStatisticsByPoli = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filterDate = date || new Date().toISOString().split('T')[0];

  const stats = await Antrian.getStatisticsByPoli(filterDate);

  const responseData = success('Statistik antrian per poli berhasil diambil', { 
    statistics: stats,
    date: filterDate
  });
  send(res, responseData);
});

/**
 * Search antrian
 * @route GET /api/antrian/search
 * @access Private (Admin/Petugas)
 */
const searchAntrian = asyncHandler(async (req, res) => {
  const { q, search_by = 'both', poli_id, status, date } = req.query;

  if (!q || q.trim().length === 0) {
    const errorResponse = error('Query pencarian diperlukan', null, 400);
    return send(res, errorResponse);
  }

  let whereClause = '';
  const params = [];

  // Build search conditions
  if (search_by === 'nomor_antrian') {
    whereClause = 'a.nomor_antrian LIKE ?';
    params.push(`%${q.trim()}%`);
  } else if (search_by === 'nama_pasien') {
    whereClause = 'a.nama_pasien LIKE ?';
    params.push(`%${q.trim()}%`);
  } else {
    whereClause = '(a.nomor_antrian LIKE ? OR a.nama_pasien LIKE ?)';
    params.push(`%${q.trim()}%`, `%${q.trim()}%`);
  }

  // Add additional filters
  if (poli_id) {
    whereClause += ' AND a.poli_id = ?';
    params.push(poli_id);
  }
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
      d.nama_dokter
    FROM antrian a
    LEFT JOIN poli p ON a.poli_id = p.id
    LEFT JOIN dokter d ON a.dokter_id = d.id
    WHERE ${whereClause}
    ORDER BY a.jam_daftar DESC
    LIMIT 50
  `;

  const results = await Antrian.executeQuery(query, params);

  const responseData = success('Pencarian antrian selesai', {
    results,
    query: q,
    search_by,
    total: results.length,
    filters: { poli_id, status, date }
  });

  send(res, responseData);
});

/**
 * Get waiting time estimation
 * @route GET /api/antrian/:id/waiting-time
 * @access Private (Admin/Petugas)
 */
const getWaitingTimeEstimation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get antrian data
  const antrian = await Antrian.findById(parseInt(id));

  if (!antrian) {
    throw notFoundError('Antrian tidak ditemukan');
  }

  if (antrian.status !== 'menunggu') {
    const errorResponse = error('Estimasi waktu hanya tersedia untuk antrian yang menunggu', null, 400);
    return send(res, errorResponse);
  }

  const estimation = await Antrian.getWaitingTimeEstimation(antrian.poli_id, parseInt(id));

  const responseData = success('Estimasi waktu tunggu berhasil dihitung', {
    antrian: {
      id: antrian.id,
      nomor_antrian: antrian.nomor_antrian,
      nama_pasien: antrian.nama_pasien,
      status: antrian.status
    },
    estimation
  });

  send(res, responseData);
});

/**
 * Get today's antrian for display
 * @route GET /api/antrian/display
 * @access Public (for display screens)
 */
const getTodayAntrianForDisplay = asyncHandler(async (req, res) => {
  const { poli_id } = req.query;

  const antrian = await Antrian.getTodayAntrianForDisplay(
    poli_id ? parseInt(poli_id) : null
  );

  const responseData = success('Data antrian untuk display berhasil diambil', {
    antrian,
    timestamp: new Date().toISOString(),
    poli_filter: poli_id || 'semua'
  });

  send(res, responseData);
});

module.exports = {
  getAllAntrian,
  getAntrianById,
  createAntrian,
  updateAntrian,
  updateAntrianStatus,
  deleteAntrian,
  getAntrianByPoli,
  getAntrianByDokter,
  getNextAntrian,
  callNextAntrian,
  getCurrentAntrian,
  getAntrianStatistics,
  getAntrianStatisticsByPoli,
  searchAntrian,
  getWaitingTimeEstimation,
  getTodayAntrianForDisplay
};