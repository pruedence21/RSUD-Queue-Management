const Poli = require('../models/Poli');
const logger = require('../utils/logger');
const { success, error, paginated, send } = require('../utils/response');
const { asyncHandler, notFoundError } = require('../middleware/errorHandler');

/**
 * Poli Controller
 * Menangani operasi CRUD untuk data poliklinik
 */

/**
 * Get all poli
 * @route GET /api/poli
 * @access Private (Admin/Petugas)
 */
const getAllPoli = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active_only = false, with_stats = false } = req.query;

  let poli;

  if (with_stats === 'true') {
    // Get poli with additional statistics
    poli = await Poli.findAllWithDokterCount();
  } else if (active_only === 'true') {
    // Get only active poli
    poli = await Poli.findAllActive();
  } else {
    // Get all poli with pagination
    const result = await Poli.paginate(
      parseInt(page), 
      parseInt(limit), 
      {}, 
      'nama_poli ASC'
    );
    
    const responseData = paginated(
      'Data poli berhasil diambil',
      result.data,
      result.pagination
    );
    
    return send(res, responseData);
  }

  const responseData = success('Data poli berhasil diambil', { poli });
  send(res, responseData);
});

/**
 * Get poli by ID
 * @route GET /api/poli/:id
 * @access Private (Admin/Petugas)
 */
const getPoliById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const poli = await Poli.findById(parseInt(id));
  
  if (!poli) {
    throw notFoundError('Poli tidak ditemukan');
  }

  const responseData = success('Data poli berhasil diambil', { poli });
  send(res, responseData);
});

/**
 * Create new poli
 * @route POST /api/poli
 * @access Private (Admin only)
 */
const createPoli = asyncHandler(async (req, res) => {
  const poliData = req.body;

  const newPoli = await Poli.create(poliData);

  logger.info('Poli created', {
    poliId: newPoli.id,
    nama_poli: newPoli.nama_poli,
    kode_poli: newPoli.kode_poli,
    createdBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Poli berhasil dibuat', { poli: newPoli }, 201);
  send(res, responseData);
});

/**
 * Update poli
 * @route PUT /api/poli/:id
 * @access Private (Admin only)
 */
const updatePoli = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedPoli = await Poli.updateById(parseInt(id), updateData);

  if (!updatedPoli) {
    throw notFoundError('Poli tidak ditemukan');
  }

  logger.info('Poli updated', {
    poliId: updatedPoli.id,
    nama_poli: updatedPoli.nama_poli,
    kode_poli: updatedPoli.kode_poli,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Poli berhasil diperbarui', { poli: updatedPoli });
  send(res, responseData);
});

/**
 * Delete poli
 * @route DELETE /api/poli/:id
 * @access Private (Admin only)
 */
const deletePoli = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get poli data before deletion for logging
  const poli = await Poli.findById(parseInt(id));
  
  if (!poli) {
    throw notFoundError('Poli tidak ditemukan');
  }

  // Safe delete (check dependencies)
  const deleted = await Poli.safeDelete(parseInt(id));

  if (!deleted) {
    const errorResponse = error('Poli tidak dapat dihapus', null, 400);
    return send(res, errorResponse);
  }

  logger.info('Poli deleted', {
    poliId: poli.id,
    nama_poli: poli.nama_poli,
    kode_poli: poli.kode_poli,
    deletedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Poli berhasil dihapus');
  send(res, responseData);
});

/**
 * Toggle poli status
 * @route PATCH /api/poli/:id/toggle-status
 * @access Private (Admin only)
 */
const togglePoliStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedPoli = await Poli.toggleStatus(parseInt(id));

  if (!updatedPoli) {
    throw notFoundError('Poli tidak ditemukan');
  }

  const status = updatedPoli.aktif ? 'diaktifkan' : 'dinonaktifkan';

  logger.info('Poli status toggled', {
    poliId: updatedPoli.id,
    nama_poli: updatedPoli.nama_poli,
    newStatus: updatedPoli.aktif,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success(`Poli berhasil ${status}`, { poli: updatedPoli });
  send(res, responseData);
});

/**
 * Search poli
 * @route GET /api/poli/search
 * @access Private (Admin/Petugas)
 */
const searchPoli = asyncHandler(async (req, res) => {
  const { q, active_only = false } = req.query;

  if (!q || q.trim().length === 0) {
    const errorResponse = error('Query pencarian diperlukan', null, 400);
    return send(res, errorResponse);
  }

  const results = await Poli.searchByName(q, active_only === 'true');

  const responseData = success('Pencarian poli selesai', { 
    results,
    query: q,
    total: results.length
  });
  
  send(res, responseData);
});

/**
 * Get active poli only
 * @route GET /api/poli/active
 * @access Private (Admin/Petugas)
 */
const getActivePoli = asyncHandler(async (req, res) => {
  const { with_dokter_count = false } = req.query;

  let poli;

  if (with_dokter_count === 'true') {
    // Get active poli with dokter count
    const allPoliWithCount = await Poli.findAllWithDokterCount();
    poli = allPoliWithCount.filter(p => p.aktif);
  } else {
    poli = await Poli.findAllActive();
  }

  const responseData = success('Data poli aktif berhasil diambil', { poli });
  send(res, responseData);
});

/**
 * Get poli statistics
 * @route GET /api/poli/statistics
 * @access Private (Admin only)
 */
const getPoliStatistics = asyncHandler(async (req, res) => {
  const stats = await Poli.getStatistics();

  const responseData = success('Statistik poli berhasil diambil', { statistics: stats });
  send(res, responseData);
});

/**
 * Get poli with today's antrian count
 * @route GET /api/poli/with-antrian-count
 * @access Private (Admin/Petugas)
 */
const getPoliWithAntrianCount = asyncHandler(async (req, res) => {
  const poli = await Poli.findAllWithTodayAntrianCount();

  const responseData = success('Data poli dengan jumlah antrian berhasil diambil', { poli });
  send(res, responseData);
});

/**
 * Check if poli can be deleted
 * @route GET /api/poli/:id/can-delete
 * @access Private (Admin only)
 */
const checkCanDelete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if poli exists
  const poli = await Poli.findById(parseInt(id));
  if (!poli) {
    throw notFoundError('Poli tidak ditemukan');
  }

  const canDelete = await Poli.canBeDeleted(parseInt(id));

  const responseData = success('Pengecekan selesai', { 
    canDelete,
    message: canDelete ? 'Poli dapat dihapus' : 'Poli tidak dapat dihapus karena masih memiliki dokter atau antrian'
  });
  
  send(res, responseData);
});

/**
 * Get poli by code
 * @route GET /api/poli/code/:kode
 * @access Private (Admin/Petugas)
 */
const getPoliByCode = asyncHandler(async (req, res) => {
  const { kode } = req.params;

  if (!kode || kode.trim().length === 0) {
    const errorResponse = error('Kode poli diperlukan', null, 400);
    return send(res, errorResponse);
  }

  const poli = await Poli.findByKode(kode);

  if (!poli) {
    throw notFoundError('Poli dengan kode tersebut tidak ditemukan');
  }

  const responseData = success('Data poli berhasil diambil', { poli });
  send(res, responseData);
});

module.exports = {
  getAllPoli,
  getPoliById,
  createPoli,
  updatePoli,
  deletePoli,
  togglePoliStatus,
  searchPoli,
  getActivePoli,
  getPoliStatistics,
  getPoliWithAntrianCount,
  checkCanDelete,
  getPoliByCode
};