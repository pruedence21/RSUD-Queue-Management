const database = require('../config/database');

const seedData = async () => {
  console.log('🌱 Memulai proses seeding data...\n');
  
  try {
    await database.connect();
    const connection = database.getConnection();
    
    // Seed data untuk tabel poli
    console.log('⏳ Seeding data poli...');
    const poliData = [
      ['Umum', 'UM', true],
      ['Anak', 'AN', true],
      ['Mata', 'MT', true],
      ['Gigi', 'GI', true],
      ['THT', 'THT', true],
      ['Kandungan', 'KD', true]
    ];
    
    for (const [nama_poli, kode_poli, aktif] of poliData) {
      await connection.execute(
        'INSERT IGNORE INTO poli (nama_poli, kode_poli, aktif) VALUES (?, ?, ?)',
        [nama_poli, kode_poli, aktif]
      );
    }
    console.log('✅ Data poli berhasil di-seed');
    
    // Seed data untuk tabel dokter
    console.log('⏳ Seeding data dokter...');
    const dokterData = [
      ['Dr. Ahmad Supardi, Sp.U', 'Urologi', 1, true],
      ['Dr. Siti Nurhaliza, Sp.A', 'Pediatri', 2, true],
      ['Dr. Budi Santoso, Sp.M', 'Mata', 3, true],
      ['Dr. Maya Indira, Sp.KG', 'Kedokteran Gigi', 4, true],
      ['Dr. Rudi Hartono, Sp.THT', 'THT', 5, true],
      ['Dr. Lina Marlina, Sp.OG', 'Obstetri Ginekologi', 6, true]
    ];
    
    for (const [nama_dokter, spesialisasi, poli_id, aktif] of dokterData) {
      await connection.execute(
        'INSERT IGNORE INTO dokter (nama_dokter, spesialisasi, poli_id, aktif) VALUES (?, ?, ?, ?)',
        [nama_dokter, spesialisasi, poli_id, aktif]
      );
    }
    console.log('✅ Data dokter berhasil di-seed');
    
    // Seed data untuk tabel users
    console.log('⏳ Seeding data users...');
    const usersData = [
      ['admin', 'admin123', 'Administrator Sistem', 'admin', true],
      ['petugas1', 'petugas123', 'Petugas Pendaftaran 1', 'petugas', true],
      ['petugas2', 'petugas123', 'Petugas Pendaftaran 2', 'petugas', true]
    ];
    
    for (const [username, password, nama_lengkap, role, aktif] of usersData) {
      await connection.execute(
        'INSERT IGNORE INTO users (username, password, nama_lengkap, role, aktif) VALUES (?, ?, ?, ?, ?)',
        [username, password, nama_lengkap, role, aktif]
      );
    }
    console.log('✅ Data users berhasil di-seed');
    
    // Seed data untuk tabel settings
    console.log('⏳ Seeding data settings...');
    const settingsData = [
      ['app_name', 'RSUD Queue System', 'Nama aplikasi sistem antrian'],
      ['app_version', '1.0.0', 'Versi aplikasi'],
      ['kios_mode', 'on', 'Mode pendaftaran mandiri (on/off)'],
      ['max_antrian_per_poli', '50', 'Maksimal antrian per poli per hari'],
      ['jam_operasional_mulai', '08:00', 'Jam mulai operasional'],
      ['jam_operasional_selesai', '16:00', 'Jam selesai operasional'],
      ['auto_reset_daily', 'true', 'Reset antrian otomatis setiap hari'],
      ['display_refresh_interval', '5000', 'Interval refresh display dalam milidetik']
    ];
    
    for (const [key_setting, value_setting, deskripsi] of settingsData) {
      await connection.execute(
        'INSERT IGNORE INTO settings (key_setting, value_setting, deskripsi) VALUES (?, ?, ?)',
        [key_setting, value_setting, deskripsi]
      );
    }
    console.log('✅ Data settings berhasil di-seed');
    
    console.log('\n✅ Semua seed data berhasil dijalankan!');
    console.log('\n📊 Database siap digunakan dengan data sampel');
    
  } catch (error) {
    console.error('\n❌ Seeding gagal:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
};

// Jalankan seeding
seedData();

module.exports = { seedData };