const bcrypt = require('bcryptjs');

/**
 * Bcrypt utility untuk password hashing dan verification
 */

// Jumlah salt rounds (12 memberikan keseimbangan antara security dan performance)
const SALT_ROUNDS = 12;

/**
 * Hash password
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (plainPassword) => {
  try {
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('Password harus berupa string dan tidak boleh kosong');
    }

    if (plainPassword.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }

    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error('Gagal hash password: ' + error.message);
  }
};

/**
 * Compare password dengan hash
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password dari database
 * @returns {Promise<boolean>} True jika password cocok
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    if (!plainPassword || !hashedPassword) {
      throw new Error('Password dan hash password diperlukan');
    }

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Gagal compare password: ' + error.message);
  }
};

/**
 * Validate password strength
 * @param {string} password - Password yang akan divalidasi
 * @returns {Object} Validation result
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    errors: [],
    score: 0
  };

  if (!password || typeof password !== 'string') {
    result.errors.push('Password diperlukan');
    return result;
  }

  // Minimum length check
  if (password.length < 6) {
    result.errors.push('Password minimal 6 karakter');
  } else {
    result.score += 1;
  }

  // Maximum length check
  if (password.length > 128) {
    result.errors.push('Password maksimal 128 karakter');
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    result.score += 1;
  } else {
    result.errors.push('Password harus mengandung huruf kecil');
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.errors.push('Password harus mengandung huruf besar');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.score += 1;
  } else {
    result.errors.push('Password harus mengandung angka');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.score += 1;
  }

  // Check for common passwords (basic check)
  const commonPasswords = ['123456', 'password', '123456789', '12345678', '12345', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    result.errors.push('Password terlalu umum, gunakan password yang lebih unik');
    result.score = 0;
  }

  // Untuk sistem rumah sakit, kita bisa lebih fleksibel
  // Password minimal harus memenuhi 2 dari 4 kriteria dasar
  result.isValid = result.errors.length === 0 || (result.score >= 2 && password.length >= 6);

  return result;
};

/**
 * Generate random password
 * @param {number} length - Panjang password (default: 12)
 * @returns {string} Random password
 */
const generateRandomPassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Pastikan password mengandung minimal 1 dari setiap kategori
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Isi sisa karakter secara random
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword,
  SALT_ROUNDS
};