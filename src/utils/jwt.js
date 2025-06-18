const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT utility untuk generate dan verify token
 */

/**
 * Generate JWT token
 * @param {Object} payload - Data yang akan di-encode dalam token
 * @param {string} expiresIn - Waktu expired (default: 24h)
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
  try {
    // Untuk development, gunakan secret key sederhana
    // Untuk production, gunakan environment variable
    const secretKey = process.env.JWT_SECRET || 'rsud_queue_system_secret_key_2025';
    
    return jwt.sign(payload, secretKey, { 
      expiresIn,
      issuer: 'rsud-queue-system',
      audience: 'rsud-users'
    });
  } catch (error) {
    throw new Error('Gagal generate JWT token: ' + error.message);
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token yang akan diverifikasi
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    const secretKey = process.env.JWT_SECRET || 'rsud_queue_system_secret_key_2025';
    
    return jwt.verify(token, secretKey, {
      issuer: 'rsud-queue-system',
      audience: 'rsud-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token sudah expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token tidak valid');
    } else {
      throw new Error('Gagal verify token: ' + error.message);
    }
  }
};

/**
 * Extract token dari Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token atau null jika tidak ada
 */
const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Generate refresh token (untuk future use)
 * @param {Object} payload - Data yang akan di-encode
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const secretKey = process.env.JWT_REFRESH_SECRET || 'rsud_queue_system_refresh_secret_2025';
    
    return jwt.sign(payload, secretKey, { 
      expiresIn: '7d', // Refresh token expired dalam 7 hari
      issuer: 'rsud-queue-system',
      audience: 'rsud-users'
    });
  } catch (error) {
    throw new Error('Gagal generate refresh token: ' + error.message);
  }
};

/**
 * Verify refresh token
 * @param {string} refreshToken - Refresh token yang akan diverifikasi
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (refreshToken) => {
  try {
    const secretKey = process.env.JWT_REFRESH_SECRET || 'rsud_queue_system_refresh_secret_2025';
    
    return jwt.verify(refreshToken, secretKey, {
      issuer: 'rsud-queue-system',
      audience: 'rsud-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token sudah expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh token tidak valid');
    } else {
      throw new Error('Gagal verify refresh token: ' + error.message);
    }
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  generateRefreshToken,
  verifyRefreshToken
};