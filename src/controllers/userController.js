const User = require('../models/User');
const logger = require('../utils/logger');
const { success, error, paginated, send } = require('../utils/response');
const { asyncHandler, notFoundError } = require('../middleware/errorHandler');

/**
 * User Controller
 * Menangani operasi CRUD untuk data pengguna (Admin only)
 */

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active_only = false, role = null } = req.query;

  let users;

  if (active_only === 'true') {
    const conditions = {};
    if (role) {
      conditions.role = role;
    }
    users = await User.findBy({ aktif: true, ...conditions }, { orderBy: 'nama_lengkap ASC' });
    
    const responseData = success('Data user aktif berhasil diambil', { users });
    return send(res, responseData);
  }

  if (role) {
    users = await User.findByRole(role);
    const responseData = success(`Data user dengan role ${role} berhasil diambil`, { users });
    return send(res, responseData);
  }

  // Get all users with pagination
  const result = await User.paginate(
    parseInt(page), 
    parseInt(limit), 
    {}, 
    'nama_lengkap ASC'
  );
  
  const responseData = paginated(
    'Data user berhasil diambil',
    result.data,
    result.pagination
  );
  
  send(res, responseData);
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(parseInt(id));
  
  if (!user) {
    throw notFoundError('User tidak ditemukan');
  }

  const responseData = success('Data user berhasil diambil', { user });
  send(res, responseData);
});

/**
 * Create new user
 * @route POST /api/users
 * @access Private (Admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const userData = req.body;

  const newUser = await User.create(userData);

  logger.info('User created', {
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role,
    createdBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('User berhasil dibuat', { user: newUser }, 201);
  send(res, responseData);
});

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedUser = await User.updateById(parseInt(id), updateData);

  if (!updatedUser) {
    throw notFoundError('User tidak ditemukan');
  }

  logger.info('User updated', {
    userId: updatedUser.id,
    username: updatedUser.username,
    role: updatedUser.role,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('User berhasil diperbarui', { user: updatedUser });
  send(res, responseData);
});

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get user data before deletion for logging
  const user = await User.findById(parseInt(id));
  
  if (!user) {
    throw notFoundError('User tidak ditemukan');
  }

  // Safe delete (check dependencies)
  const deleted = await User.safeDelete(parseInt(id));

  if (!deleted) {
    const errorResponse = error('User tidak dapat dihapus', null, 400);
    return send(res, errorResponse);
  }

  logger.info('User deleted', {
    userId: user.id,
    username: user.username,
    role: user.role,
    deletedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('User berhasil dihapus');
  send(res, responseData);
});

/**
 * Toggle user status
 * @route PATCH /api/users/:id/toggle-status
 * @access Private (Admin only)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedUser = await User.toggleStatus(parseInt(id));

  if (!updatedUser) {
    throw notFoundError('User tidak ditemukan');
  }

  const status = updatedUser.aktif ? 'diaktifkan' : 'dinonaktifkan';

  logger.info('User status toggled', {
    userId: updatedUser.id,
    username: updatedUser.username,
    newStatus: updatedUser.aktif,
    updatedBy: req.user.username,
    ip: req.ip
  });

  const responseData = success(`User berhasil ${status}`, { user: updatedUser });
  send(res, responseData);
});

/**
 * Reset user password
 * @route PATCH /api/users/:id/reset-password
 * @access Private (Admin only)
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const reset = await User.resetPassword(parseInt(id), newPassword);

  if (!reset) {
    throw notFoundError('User tidak ditemukan atau password tidak dapat direset');
  }

  logger.info('User password reset', {
    userId: parseInt(id),
    resetBy: req.user.username,
    ip: req.ip
  });

  const responseData = success('Password user berhasil direset');
  send(res, responseData);
});

/**
 * Get user statistics
 * @route GET /api/users/statistics
 * @access Private (Admin only)
 */
const getUserStatistics = asyncHandler(async (req, res) => {
  const stats = await User.getStatistics();

  const responseData = success('Statistik user berhasil diambil', { statistics: stats });
  send(res, responseData);
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStatistics
};