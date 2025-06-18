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
  try {
    const userData = req.body;

    // Validate required fields
    if (!userData.username || !userData.password || !userData.role) {
      const errorResponse = error('Username, password, dan role wajib diisi', null, 400);
      return send(res, errorResponse);
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username: userData.username } });
    if (existingUser) {
      const errorResponse = error('Username sudah digunakan', null, 409);
      return send(res, errorResponse);
    }

    // Create user
    const newUser = await User.create(userData);

    logger.info('User created', {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdBy: req.user ? req.user.username : 'System',
      ip: req.ip
    });

    const responseData = success('User berhasil dibuat', { user: newUser }, 201);
    send(res, responseData);
  } catch (createError) {
    logger.error('Error creating user:', createError);
    
    // Handle specific Sequelize errors
    if (createError.name === 'SequelizeUniqueConstraintError') {
      const errorResponse = error('Username sudah digunakan', null, 409);
      return send(res, errorResponse);
    }
    
    if (createError.name === 'SequelizeValidationError') {
      const validationErrors = createError.errors.map(err => err.message);
      const errorResponse = error('Validasi gagal: ' + validationErrors.join(', '), null, 400);
      return send(res, errorResponse);
    }
    
    if (createError.name === 'SequelizeForeignKeyConstraintError') {
      const errorResponse = error('Referensi data tidak valid', null, 400);
      return send(res, errorResponse);
    }

    // Generic error
    const errorResponse = error('Gagal membuat user', createError.message, 500);
    send(res, errorResponse);
  }
});

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const user = await User.findById(parseInt(id));
    if (!user) {
      throw notFoundError('User tidak ditemukan');
    }

    // If updating username, check for conflicts
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ where: { username: updateData.username } });
      if (existingUser) {
        const errorResponse = error('Username sudah digunakan', null, 409);
        return send(res, errorResponse);
      }
    }

    const updatedUser = await User.updateById(parseInt(id), updateData);

    if (!updatedUser) {
      throw notFoundError('User tidak ditemukan');
    }

    logger.info('User updated', {
      userId: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      updatedBy: req.user ? req.user.username : 'System',
      ip: req.ip
    });

    const responseData = success('User berhasil diperbarui', { user: updatedUser });
    send(res, responseData);
  } catch (updateError) {
    logger.error('Error updating user:', updateError);
    
    // Handle specific Sequelize errors
    if (updateError.name === 'SequelizeUniqueConstraintError') {
      const errorResponse = error('Username sudah digunakan', null, 409);
      return send(res, errorResponse);
    }
    
    if (updateError.name === 'SequelizeValidationError') {
      const validationErrors = updateError.errors.map(err => err.message);
      const errorResponse = error('Validasi gagal: ' + validationErrors.join(', '), null, 400);
      return send(res, errorResponse);
    }

    // Re-throw if it's a notFoundError
    if (updateError.statusCode === 404) {
      throw updateError;
    }

    // Generic error
    const errorResponse = error('Gagal memperbarui user', updateError.message, 500);
    send(res, errorResponse);
  }
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