const Dokter = require('../models/Dokter');
const logger = require('../utils/logger');
const { success, error, paginated, send } = require('../utils/response');
const { asyncHandler, notFoundError } = require('../middleware/errorHandler');

/**
 * Dokter Controller
 * Menangani operasi CRUD untuk data dokter
 */

/**
 * Get all dokter
 * @route GET /api/dokter
 * @access Private (Admin/Petugas)
 */
const getAllDokter = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    active_only = false, 
    with_poli = false,
    poli_id = null 
  } = req.query;

  let dokter;

  if (with_poli === 'true') {
    // Get dokter with poli information
    const options = {
      activeOnly: active_only === 'true',
      poliId: poli_id ? parseInt(poli_id) : null
    };
    dokter = await Dokter.findAllWithPoli(options);
    
    const responseData = success('Data dokter berhasil diambil', { dokter });
    return send(res, responseData);
  }

  if (active_only === 'true') {
    // Get only active dokter
    const conditions = {};
    if (poli_id) {
      conditions.poli_id = parseInt(poli_id);
    }
    dokter = await Dokter.findBy({ aktif: true, ...conditions }, { orderBy: 'nama_dokter ASC' });
    
    const responseData = success('Data dokter aktif berhasil diambil', { dokter });
    return send(res, responseData);
  }

  // Get all dokter with pagination
  const conditions = {};
  if (poli_id) {
    conditions.poli_id = parseInt(poli_id);
  }

  const result = await Dokter.paginate(
    parseInt(page), 
    parseInt(limit), 
    conditions, 
    'nama_dokter ASC'
  );
  
  const responseData = paginated(
    'Data dokter berhasil diambil',
    result.data,
    result.pagination
  );
  
  send(res, responseData);
});

/**
 * Get dokter by ID
 * @route GET /api/dokter/:id
 * @access Private (Admin/Petugas)
 */
const getDokterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { with_poli = false } = req.query;

  let dokter;

  if (with_poli === 'true') {
    dokter = await Dokter.findWithPoli(parseInt(id));
  } else {
    dokter = await Dokter.findById(parseInt(id));
  }
  
  if (!dokter) {
    throw notFoundError('Dokter tidak ditemukan');
  }

  const responseData = success('Data dokter berhasil diambil', { dokter });
  send(res, responseData);
});

/**
 * Create new dokter
 * @route POST /api/dokter
 * @access Private (Admin only)
 */
const createDokter = asyncHandler(async (req, res) => {
  const dokterData = req.body;

  const newDokter = await Dokter.create(dokterData);

  logger.info('Dokter created', {
    dokterId: newDokter.id,
    nama_dokter: newDokter.nama_dokter,
    spesialisasi: newDokter.spesialisasi,
    poli_id: newDokter.poli_id,
    createdBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Dokter berhasil dibuat', { dokter: newDokter }, 201);
  send(res, responseData);
});

/**
 * Update dokter
 * @route PUT /api/dokter/:id
 * @access Private (Admin only)
 */
const updateDokter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedDokter = await Dokter.updateById(parseInt(id), updateData);

  if (!updatedDokter) {
    throw notFoundError('Dokter tidak ditemukan');
  }

  logger.info('Dokter updated', {
    dokterId: updatedDokter.id,
    nama_dokter: updatedDokter.nama_dokter,
    spesialisasi: updatedDokter.spesialisasi,
    poli_id: updatedDokter.poli_id,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Dokter berhasil diperbarui', { dokter: updatedDokter });
  send(res, responseData);
});

/**
 * Delete dokter
 * @route DELETE /api/dokter/:id
 * @access Private (Admin only)
 */
const deleteDokter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get dokter data before deletion for logging
  const dokter = await Dokter.findById(parseInt(id));
  
  if (!dokter) {
    throw notFoundError('Dokter tidak ditemukan');
  }

  // Safe delete (check dependencies)
  const deleted = await Dokter.safeDelete(parseInt(id));

  if (!deleted) {
    const errorResponse = error('Dokter tidak dapat dihapus', null, 400);
    return send(res, errorResponse);
  }

  logger.info('Dokter deleted', {
    dokterId: dokter.id,
    nama_dokter: dokter.nama_dokter,
    spesialisasi: dokter.spesialisasi,
    poli_id: dokter.poli_id,
    deletedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Dokter berhasil dihapus');
  send(res, responseData);
});

/**
 * Toggle dokter status
 * @route PATCH /api/dokter/:id/toggle-status
 * @access Private (Admin only)
 */
const toggleDokterStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedDokter = await Dokter.toggleStatus(parseInt(id));

  if (!updatedDokter) {
    throw notFoundError('Dokter tidak ditemukan');
  }

  const status = updatedDokter.aktif ? 'diaktifkan' : 'dinonaktifkan';

  logger.info('Dokter status toggled', {
    dokterId: updatedDokter.id,
    nama_dokter: updatedDokter.nama_dokter,
    newStatus: updatedDokter.aktif,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success(`Dokter berhasil ${status}`, { dokter: updatedDokter });
  send(res, responseData);
});

/**
 * Search dokter
 * @route GET /api/dokter/search
 * @access Private (Admin/Petugas)
 */
const searchDokter = asyncHandler(async (req, res) => {
  const { q, active_only = false, poli_id = null } = req.query;

  if (!q || q.trim().length === 0) {
    const errorResponse = error('Query pencarian diperlukan', null, 400);
    return send(res, errorResponse);
  }

  const results = await Dokter.search(
    q, 
    active_only === 'true',
    poli_id ? parseInt(poli_id) : null
  );

  const responseData = success('Pencarian dokter selesai', { 
    results,
    query: q,
    total: results.length
  });
  
  send(res, responseData);
});

/**
 * Get active dokter only
 * @route GET /api/dokter/active
 * @access Private (Admin/Petugas)
 */
const getActiveDokter = asyncHandler(async (req, res) => {
  const { with_poli = false, poli_id = null } = req.query;

  let dokter;

  if (with_poli === 'true') {
    // Get active dokter with poli information
    const options = {
      activeOnly: true,
      poliId: poli_id ? parseInt(poli_id) : null
    };
    dokter = await Dokter.findAllWithPoli(options);
  } else {
    const conditions = { aktif: true };
    if (poli_id) {
      conditions.poli_id = parseInt(poli_id);
    }
    dokter = await Dokter.findBy(conditions, { orderBy: 'nama_dokter ASC' });
  }

  const responseData = success('Data dokter aktif berhasil diambil', { dokter });
  send(res, responseData);
});

/**
 * Get dokter by poli ID
 * @route GET /api/dokter/by-poli/:poliId
 * @access Private (Admin/Petugas)
 */
const getDokterByPoli = asyncHandler(async (req, res) => {
  const { poliId } = req.params;
  const { active_only = false } = req.query;

  const dokter = await Dokter.findByPoliId(
    parseInt(poliId), 
    active_only === 'true'
  );

  const responseData = success('Data dokter berhasil diambil', { dokter });
  send(res, responseData);
});

/**
 * Get dokter statistics
 * @route GET /api/dokter/statistics
 * @access Private (Admin only)
 */
const getDokterStatistics = asyncHandler(async (req, res) => {
  const stats = await Dokter.getStatistics();

  const responseData = success('Statistik dokter berhasil diambil', { statistics: stats });
  send(res, responseData);
});

/**
 * Check if dokter can be deleted
 * @route GET /api/dokter/:id/can-delete
 * @access Private (Admin only)
 */
const checkCanDelete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if dokter exists
  const dokter = await Dokter.findById(parseInt(id));
  if (!dokter) {
    throw notFoundError('Dokter tidak ditemukan');
  }

  const canDelete = await Dokter.canBeDeleted(parseInt(id));

  const responseData = success('Pengecekan selesai', { 
    canDelete,
    message: canDelete ? 'Dokter dapat dihapus' : 'Dokter tidak dapat dihapus karena masih memiliki antrian'
  });
  
  send(res, responseData);
});

/**
 * Get dokter count by poli
 * @route GET /api/dokter/count-by-poli/:poliId
 * @access Private (Admin/Petugas)
 */
const getDokterCountByPoli = asyncHandler(async (req, res) => {
  const { poliId } = req.params;
  const { active_only = false } = req.query;

  const count = await Dokter.countByPoli(
    parseInt(poliId),
    active_only === 'true'
  );

  const responseData = success('Jumlah dokter berhasil diambil', { 
    poli_id: parseInt(poliId),
    count,
    active_only: active_only === 'true'
  });
  
  send(res, responseData);
});

module.exports = {
  getAllDokter,
  getDokterById,
  createDokter,
  updateDokter,
  deleteDokter,
  toggleDokterStatus,
  searchDokter,
  getActiveDokter,
  getDokterByPoli,
  getDokterStatistics,
  checkCanDelete,
  getDokterCountByPoli
};