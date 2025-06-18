const database = require('../src/config/database');
const config = require('../src/config/env');

const testDatabase = async () => {
  console.log('🧪 Memulai testing database...\n');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  const runTest = async (testName, testFunction) => {
    testsTotal++;
    try {
      console.log(`⏳ Test ${testsTotal}: ${testName}`);
      await testFunction();
      console.log(`✅ Test ${testsTotal}: ${testName} - PASSED\n`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ Test ${testsTotal}: ${testName} - FAILED`);
      console.error(`   Error: ${error.message}\n`);
    }
  };
  
  try {
    // Test 1: Database Creation
    await runTest('Membuat database', async () => {
      await database.createDatabase();
    });
    
    // Test 2: Database Connection
    await runTest('Koneksi ke database', async () => {
      await database.connect();
    });
    
    // Test 3: Connection Test
    await runTest('Test koneksi database', async () => {
      await database.testConnection();
    });
    
    // Test 4: Basic Query
    await runTest('Query sederhana', async () => {
      const connection = database.getConnection();
      const [rows] = await connection.execute('SELECT DATABASE() as current_db');
      if (rows[0].current_db !== config.database.database) {
        throw new Error(`Database tidak sesuai. Expected: ${config.database.database}, Got: ${rows[0].current_db}`);
      }
    });
    
    // Test 5: Show Tables (jika sudah ada)
    await runTest('Cek tabel yang ada', async () => {
      const connection = database.getConnection();
      const [rows] = await connection.execute('SHOW TABLES');
      console.log(`   Ditemukan ${rows.length} tabel`);
      if (rows.length > 0) {
        console.log(`   Tabel: ${rows.map(row => Object.values(row)[0]).join(', ')}`);
      }
    });
    
    // Test 6: Database Info
    await runTest('Informasi database', async () => {
      const connection = database.getConnection();
      const [versionRows] = await connection.execute('SELECT VERSION() as version');
      const [charsetRows] = await connection.execute('SELECT @@character_set_database as charset');
      const [collationRows] = await connection.execute('SELECT @@collation_database as collation');
      
      console.log(`   MySQL Version: ${versionRows[0].version}`);
      console.log(`   Character Set: ${charsetRows[0].charset}`);
      console.log(`   Collation: ${collationRows[0].collation}`);
    });
    
  } catch (error) {
    console.error('❌ Error selama testing:', error.message);
  } finally {
    await database.close();
  }
  
  // Test Summary
  console.log('\n📊 HASIL TESTING:');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsTotal - testsPassed}`);
  console.log(`📊 Total Tests: ${testsTotal}`);
  console.log(`🎯 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);
  
  if (testsPassed === testsTotal) {
    console.log('\n🎉 Semua test berhasil! Database siap digunakan.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Beberapa test gagal. Periksa konfigurasi database.');
    process.exit(1);
  }
};

// Jalankan test
testDatabase();

module.exports = { testDatabase };