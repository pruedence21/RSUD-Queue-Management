const database = require('../config/database');

const createDokterTable = async () => {
  try {
    const connection = database.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS dokter (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_dokter VARCHAR(100) NOT NULL,
        spesialisasi VARCHAR(100),
        poli_id INT,
        aktif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (poli_id) REFERENCES poli(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_poli_id (poli_id),
        INDEX idx_aktif (aktif),
        INDEX idx_nama_dokter (nama_dokter)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabel dokter berhasil dibuat');
    
    return true;
  } catch (error) {
    console.error('❌ Gagal membuat tabel dokter:', error.message);
    throw error;
  }
};

const dropDokterTable = async () => {
  try {
    const connection = database.getConnection();
    await connection.execute('DROP TABLE IF EXISTS dokter');
    console.log('✅ Tabel dokter berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Gagal menghapus tabel dokter:', error.message);
    throw error;
  }
};

module.exports = {
  up: createDokterTable,
  down: dropDokterTable
};