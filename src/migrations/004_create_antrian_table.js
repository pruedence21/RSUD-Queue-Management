const database = require('../config/database');

const createAntrianTable = async () => {
  try {
    const connection = database.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS antrian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomor_antrian VARCHAR(20) NOT NULL,
        poli_id INT,
        dokter_id INT,
        nama_pasien VARCHAR(100),
        status ENUM('menunggu', 'dipanggil', 'selesai', 'terlewat') DEFAULT 'menunggu',
        jam_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        jam_panggil TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (poli_id) REFERENCES poli(id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (dokter_id) REFERENCES dokter(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_nomor_antrian (nomor_antrian),
        INDEX idx_poli_id (poli_id),
        INDEX idx_dokter_id (dokter_id),
        INDEX idx_status (status),
        INDEX idx_jam_daftar (jam_daftar),
        INDEX idx_composite_poli_status (poli_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabel antrian berhasil dibuat');
    
    return true;
  } catch (error) {
    console.error('❌ Gagal membuat tabel antrian:', error.message);
    throw error;
  }
};

const dropAntrianTable = async () => {
  try {
    const connection = database.getConnection();
    await connection.execute('DROP TABLE IF EXISTS antrian');
    console.log('✅ Tabel antrian berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Gagal menghapus tabel antrian:', error.message);
    throw error;
  }
};

module.exports = {
  up: createAntrianTable,
  down: dropAntrianTable
};