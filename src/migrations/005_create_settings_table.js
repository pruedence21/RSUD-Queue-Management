const database = require('../config/database');

const createSettingsTable = async () => {
  try {
    const connection = database.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_setting VARCHAR(100) NOT NULL UNIQUE,
        value_setting TEXT,
        deskripsi VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_key_setting (key_setting)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabel settings berhasil dibuat');
    
    return true;
  } catch (error) {
    console.error('❌ Gagal membuat tabel settings:', error.message);
    throw error;
  }
};

const dropSettingsTable = async () => {
  try {
    const connection = database.getConnection();
    await connection.execute('DROP TABLE IF EXISTS settings');
    console.log('✅ Tabel settings berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Gagal menghapus tabel settings:', error.message);
    throw error;
  }
};

module.exports = {
  up: createSettingsTable,
  down: dropSettingsTable
};