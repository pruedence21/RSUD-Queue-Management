const User = require('../models/User');
const jwtUtils = require('../utils/jwt');
const logger = require('../utils/logger');
const { success, error, send } = require('../utils/response');
const { asyncHandler, unauthorizedError } = require('../middleware/errorHandler');

/**
 * Authentication Controller
 * Menangani operasi login, logout, dan manajemen sesi
 */

/**
 * User login
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  logger.info('Login attempt', { 
    username, 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Authenticate user
  const user = await User.authenticate(username, password);
  
  if (!user) {
    logger.auth('LOGIN', username, req.ip, false);
    throw unauthorizedError('Username atau password salah');
  }

  // Generate JWT token
  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    nama_lengkap: user.nama_lengkap
  };

  const token = jwtUtils.generateToken(tokenPayload);
  const refreshToken = jwtUtils.generateRefreshToken({ id: user.id });

  logger.auth('LOGIN', username, req.ip, true);

  // Response with token and user info
  const responseData = success('Login berhasil', {
    user: {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      aktif: user.aktif
    },
    token,
    refreshToken,
    expiresIn: '24h'
  });

  send(res, responseData);
});

/**
 * User logout
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  const user = req.user;

  logger.auth('LOGOUT', user.username, req.ip, true);

  // Dalam implementasi sederhana, kita hanya memberikan response sukses
  // Untuk implementasi yang lebih advanced, bisa menambahkan token blacklist
  const responseData = success('Logout berhasil');
  send(res, responseData);
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get fresh user data from database
  const user = await User.findById(userId);
  
  if (!user) {
    throw unauthorizedError('User tidak ditemukan');
  }

  if (!user.aktif) {
    throw unauthorizedError('Akun tidak aktif');
  }

  const responseData = success('Data profile berhasil diambil', {
    user: {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      aktif: user.aktif,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });

  send(res, responseData);
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { nama_lengkap } = req.body;

  // Validate input
  if (!nama_lengkap || typeof nama_lengkap !== 'string' || nama_lengkap.trim().length < 2) {
    const errorResponse = error('Nama lengkap minimal 2 karakter', null, 400);
    return send(res, errorResponse);
  }

  // Update user profile
  const updatedUser = await User.updateById(userId, { nama_lengkap: nama_lengkap.trim() });

  if (!updatedUser) {
    throw unauthorizedError('User tidak ditemukan');
  }

  logger.info('Profile updated', { 
    userId, 
    username: req.user.username,
    ip: req.ip
  });

  const responseData = success('Profile berhasil diperbarui', {
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      nama_lengkap: updatedUser.nama_lengkap,
      role: updatedUser.role,
      aktif: updatedUser.aktif,
      updated_at: updatedUser.updated_at
    }
  });

  send(res, responseData);
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  // Change password
  await User.changePassword(userId, oldPassword, newPassword);

  logger.auth('PASSWORD_CHANGE', req.user.username, req.ip, true);

  const responseData = success('Password berhasil diubah');
  send(res, responseData);
});

/**
 * Refresh token
 * @route POST /api/auth/refresh
 * @access Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    const errorResponse = error('Refresh token diperlukan', null, 400);
    return send(res, errorResponse);
  }

  try {
    // Verify refresh token
    const decoded = jwtUtils.verifyRefreshToken(refreshToken);
    
    // Get user data
    const user = await User.findById(decoded.id);
    
    if (!user || !user.aktif) {
      throw unauthorizedError('User tidak valid atau tidak aktif');
    }

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      nama_lengkap: user.nama_lengkap
    };

    const newToken = jwtUtils.generateToken(tokenPayload);
    const newRefreshToken = jwtUtils.generateRefreshToken({ id: user.id });

    logger.auth('TOKEN_REFRESH', user.username, req.ip, true);

    const responseData = success('Token berhasil di-refresh', {
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role
      },
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: '24h'
    });

    send(res, responseData);

  } catch (err) {
    logger.auth('TOKEN_REFRESH', 'unknown', req.ip, false);
    throw unauthorizedError('Refresh token tidak valid atau expired');
  }
});

/**
 * Check token validity
 * @route GET /api/auth/verify
 * @access Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get fresh user data to ensure user is still active
  const freshUser = await User.findById(user.id);
  
  if (!freshUser || !freshUser.aktif) {
    throw unauthorizedError('Token tidak valid atau user tidak aktif');
  }

  const responseData = success('Token valid', {
    user: {
      id: freshUser.id,
      username: freshUser.username,
      nama_lengkap: freshUser.nama_lengkap,
      role: freshUser.role,
      aktif: freshUser.aktif
    }
  });

  send(res, responseData);
});

/**
 * Get authentication status
 * @route GET /api/auth/status
 * @access Public
 */
const getAuthStatus = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = jwtUtils.extractToken(authHeader);

  let isAuthenticated = false;
  let user = null;

  if (token) {
    try {
      const decoded = jwtUtils.verifyToken(token);
      const userData = await User.findById(decoded.id);
      
      if (userData && userData.aktif) {
        isAuthenticated = true;
        user = {
          id: userData.id,
          username: userData.username,
          nama_lengkap: userData.nama_lengkap,
          role: userData.role
        };
      }
    } catch (err) {
      // Token invalid, keep isAuthenticated as false
    }
  }

  const responseData = success('Status autentikasi', {
    isAuthenticated,
    user
  });

  send(res, responseData);
});

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  verifyToken,
  getAuthStatus
};