const database = require('../config/database');

const createUsersTable = async () => {
  try {
    const connection = database.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nama_lengkap VARCHAR(100) NOT NULL,
        role ENUM('admin', 'petugas') NOT NULL,
        aktif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_role (role),
        INDEX idx_aktif (aktif)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabel users berhasil dibuat');
    
    return true;
  } catch (error) {
    console.error('❌ Gagal membuat tabel users:', error.message);
    throw error;
  }
};

const dropUsersTable = async () => {
  try {
    const connection = database.getConnection();
    await connection.execute('DROP TABLE IF EXISTS users');
    console.log('✅ Tabel users berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Gagal menghapus tabel users:', error.message);
    throw error;
  }
};

module.exports = {
  up: createUsersTable,
  down: dropUsersTable
};