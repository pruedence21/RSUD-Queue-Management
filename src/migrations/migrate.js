const database = require('../config/database');

// Import semua migration files
const migration001 = require('./001_create_poli_table');
const migration002 = require('./002_create_dokter_table');
const migration003 = require('./003_create_users_table');
const migration004 = require('./004_create_antrian_table');
const migration005 = require('./005_create_settings_table');

// Daftar migrasi berurutan
const migrations = [
  { name: '001_create_poli_table', module: migration001 },
  { name: '002_create_dokter_table', module: migration002 },
  { name: '003_create_users_table', module: migration003 },
  { name: '004_create_antrian_table', module: migration004 },
  { name: '005_create_settings_table', module: migration005 }
];

const runMigrations = async () => {
  console.log('🚀 Memulai proses migrasi database...\n');
  
  try {
    // Buat database jika belum ada
    await database.createDatabase();
    
    // Koneksi ke database
    await database.connect();
    
    console.log('\n📋 Menjalankan migrasi tabel...');
    
    // Jalankan setiap migrasi
    for (const migration of migrations) {
      console.log(`\n⏳ Menjalankan migrasi: ${migration.name}`);
      await migration.module.up();
    }
    
    console.log('\n✅ Semua migrasi berhasil dijalankan!');
    console.log('\n📊 Struktur database siap digunakan');
    
  } catch (error) {
    console.error('\n❌ Migrasi gagal:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
};

const rollbackMigrations = async () => {
  console.log('🔄 Memulai rollback migrasi database...\n');
  
  try {
    await database.connect();
    
    console.log('\n📋 Menjalankan rollback tabel...');
    
    // Jalankan rollback dalam urutan terbalik
    for (let i = migrations.length - 1; i >= 0; i--) {
      const migration = migrations[i];
      console.log(`\n⏳ Rollback migrasi: ${migration.name}`);
      await migration.module.down();
    }
    
    console.log('\n✅ Semua rollback berhasil dijalankan!');
    
  } catch (error) {
    console.error('\n❌ Rollback gagal:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
};

// Jalankan berdasarkan argument command line
const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigrations();
} else {
  runMigrations();
}

module.exports = {
  runMigrations,
  rollbackMigrations
};