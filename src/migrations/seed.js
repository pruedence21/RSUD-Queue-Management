const database = require('../config/database');
const { initializeModels } = require('../models/index');
const { hashPassword } = require('../utils/bcrypt');

const seedData = async () => {
  console.log('🌱 Memulai proses seeding data...\n');
  
  try {
    // Ensure database is connected and models are initialized
    await database.connect();
    await initializeModels();
    
    const { models } = require('../models/index');
    const { Poli, Dokter, User, Settings } = models;
    
    // Seed data untuk tabel poli
    console.log('⏳ Seeding data poli...');
    const poliData = [
      { nama_poli: 'Umum', kode_poli: 'UM', aktif: true },
      { nama_poli: 'Anak', kode_poli: 'AN', aktif: true },
      { nama_poli: 'Mata', kode_poli: 'MT', aktif: true },
      { nama_poli: 'Gigi', kode_poli: 'GI', aktif: true },
      { nama_poli: 'THT', kode_poli: 'THT', aktif: true },
      { nama_poli: 'Kandungan', kode_poli: 'KD', aktif: true }
    ];
    
    for (const poli of poliData) {
      await Poli.findOrCreate({
        where: { kode_poli: poli.kode_poli },
        defaults: poli
      });
    }
    console.log('✅ Data poli berhasil di-seed');
    
    // Seed data untuk tabel dokter
    console.log('⏳ Seeding data dokter...');
    const dokterData = [
      { nama_dokter: 'Dr. Ahmad Supardi, Sp.U', spesialisasi: 'Urologi', poli_id: 1, aktif: true },
      { nama_dokter: 'Dr. Siti Nurhaliza, Sp.A', spesialisasi: 'Pediatri', poli_id: 2, aktif: true },
      { nama_dokter: 'Dr. Budi Santoso, Sp.M', spesialisasi: 'Mata', poli_id: 3, aktif: true },
      { nama_dokter: 'Dr. Maya Indira, Sp.KG', spesialisasi: 'Kedokteran Gigi', poli_id: 4, aktif: true },
      { nama_dokter: 'Dr. Rudi Hartono, Sp.THT', spesialisasi: 'THT', poli_id: 5, aktif: true },
      { nama_dokter: 'Dr. Lina Marlina, Sp.OG', spesialisasi: 'Obstetri Ginekologi', poli_id: 6, aktif: true }
    ];
    
    for (const dokter of dokterData) {
      await Dokter.findOrCreate({
        where: { nama_dokter: dokter.nama_dokter },
        defaults: dokter
      });
    }
    console.log('✅ Data dokter berhasil di-seed');
    
    // Seed data untuk tabel users
    console.log('⏳ Seeding data users...');
    
    // Create users using model's built-in password hashing
    const usersData = [
      {
        username: 'admin',
        password: 'Admin123!', // Password will be hashed by User model
        nama_lengkap: 'Administrator',
        role: 'admin',
        aktif: true
      },
      {
        username: 'operator1',
        password: 'Operator123!', // Password will be hashed by User model
        nama_lengkap: 'Operator 1',
        role: 'petugas',
        aktif: true
      }
    ];
    
    for (const userData of usersData) {
      const [user, created] = await User.findOrCreate({
        where: { username: userData.username },
        defaults: userData
      });
      
      if (created) {
        console.log(`   ✅ User ${userData.username} created with password: ${userData.password}`);
      } else {
        console.log(`   ℹ️  User ${userData.username} already exists`);
      }
    }
    console.log('✅ Data users berhasil di-seed');
    
    // Seed data untuk tabel settings
    console.log('⏳ Seeding data settings...');
    const settingsData = [
      {
        key: 'hospital_name',
        value: 'RSUD Queue Management System',
        description: 'Nama rumah sakit',
        type: 'string',
        category: 'general'
      },
      {
        key: 'max_queue_per_day',
        value: '100',
        description: 'Maksimal antrian per hari per poli',
        type: 'number',
        category: 'queue'
      },
      {
        key: 'queue_reset_time',
        value: '06:00',
        description: 'Waktu reset antrian harian',
        type: 'string',
        category: 'queue'
      },
      {
        key: 'working_hours',
        value: JSON.stringify({
          start: '08:00',
          end: '16:00',
          break_start: '12:00',
          break_end: '13:00'
        }),
        description: 'Jam kerja rumah sakit',
        type: 'json',
        category: 'general'
      },
      {
        key: 'notification_enabled',
        value: 'true',
        description: 'Status notifikasi aktif',
        type: 'boolean',
        category: 'notification'
      }
    ];
    
    for (const setting of settingsData) {
      await Settings.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
    }
    console.log('✅ Data settings berhasil di-seed');
    
    console.log('\n🎉 Proses seeding data selesai!');
    console.log('\n📋 User credentials yang dapat digunakan:');
    console.log('   Admin: username=admin, password=Admin123!');
    console.log('   Operator: username=operator1, password=Operator123!');
    
  } catch (error) {
    console.error('❌ Error saat seeding data:', error);
    throw error;
  }
};

// Jalankan seed jika dipanggil langsung
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
