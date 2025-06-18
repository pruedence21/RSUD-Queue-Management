const database = require('../config/database');

const createPoliTable = async () => {
  try {
    const dbType = database.getDbType();
    
    let createTableQuery;
    
    if (dbType === 'mysql') {
      createTableQuery = `
        CREATE TABLE IF NOT EXISTS poli (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama_poli VARCHAR(100) NOT NULL,
          kode_poli VARCHAR(10) NOT NULL UNIQUE,
          aktif BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_kode_poli (kode_poli),
          INDEX idx_aktif (aktif)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
    } else if (dbType === 'postgres' || dbType === 'postgresql') {
      createTableQuery = `
        CREATE TABLE IF NOT EXISTS poli (
          id SERIAL PRIMARY KEY,
          nama_poli VARCHAR(100) NOT NULL,
          kode_poli VARCHAR(10) NOT NULL UNIQUE,
          aktif BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_poli_kode_poli ON poli (kode_poli);
        CREATE INDEX IF NOT EXISTS idx_poli_aktif ON poli (aktif);
      `;
    }

    await database.execute(createTableQuery);
    console.log('✅ Tabel poli berhasil dibuat');
    
    return true;
  } catch (error) {
    console.error('❌ Gagal membuat tabel poli:', error.message);
    throw error;
  }
};

const dropPoliTable = async () => {
  try {
    await database.execute('DROP TABLE IF EXISTS poli');
    console.log('✅ Tabel poli berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Gagal menghapus tabel poli:', error.message);
    throw error;
  }
};

module.exports = {
  up: createPoliTable,
  down: dropPoliTable
};