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
      const sequelize = database.getSequelize();
      const dbType = database.getDbType();
      let expectedDb = config.database.database;
      
      // Use database-agnostic query
      let query, rows;
      if (dbType === 'postgres' || dbType === 'postgresql') {
        query = 'SELECT current_database() as current_db';
        [rows] = await sequelize.query(query);
        if (rows[0].current_db !== expectedDb) {
          throw new Error(`Database tidak sesuai. Expected: ${expectedDb}, Got: ${rows[0].current_db}`);
        }
      } else if (dbType === 'mysql') {
        query = 'SELECT DATABASE() as current_db';
        [rows] = await sequelize.query(query);
        if (rows[0].current_db !== expectedDb) {
          throw new Error(`Database tidak sesuai. Expected: ${expectedDb}, Got: ${rows[0].current_db}`);
        }
      } else {
        // For SQLite or other databases, just test basic query
        query = 'SELECT 1 as test';
        [rows] = await sequelize.query(query);
        if (rows[0].test !== 1) {
          throw new Error('Basic query test failed');
        }
      }
    });
    
    // Test 5: Show Tables (jika sudah ada)
    await runTest('Cek tabel yang ada', async () => {
      const sequelize = database.getSequelize();
      const dbType = database.getDbType();
      let rows;
      
      if (dbType === 'postgres' || dbType === 'postgresql') {
        [rows] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        `);
      } else if (dbType === 'mysql') {
        [rows] = await sequelize.query('SHOW TABLES');
      }
      
      console.log(`   Ditemukan ${rows.length} tabel`);
      if (rows.length > 0) {
        if (dbType === 'postgres' || dbType === 'postgresql') {
          console.log(`   Tabel: ${rows.map(row => row.table_name).join(', ')}`);
        } else {
          console.log(`   Tabel: ${rows.map(row => Object.values(row)[0]).join(', ')}`);
        }
      }
    });
    
    // Test 6: Database Info
    await runTest('Informasi database', async () => {
      const sequelize = database.getSequelize();
      const dbType = database.getDbType();
      
      try {
        if (dbType === 'postgres' || dbType === 'postgresql') {
          const [versionRows] = await sequelize.query('SELECT version() as version');
          // Use database-agnostic approach for encoding
          const [encodingRows] = await sequelize.query('SELECT pg_encoding_to_char(encoding) as encoding FROM pg_database WHERE datname = current_database()');
          
          console.log(`   PostgreSQL Version: ${versionRows[0].version.split(',')[0]}`);
          console.log(`   Database Encoding: ${encodingRows[0].encoding}`);
        } else if (dbType === 'mysql') {
          const [versionRows] = await sequelize.query('SELECT VERSION() as version');
          const [charsetRows] = await sequelize.query('SELECT @@character_set_database as charset');
          const [collationRows] = await sequelize.query('SELECT @@collation_database as collation');
          
          console.log(`   MySQL Version: ${versionRows[0].version}`);
          console.log(`   Character Set: ${charsetRows[0].charset}`);
          console.log(`   Collation: ${collationRows[0].collation}`);
        } else {
          // For SQLite or other databases
          const dialectVersion = sequelize.options.dialectOptions?.version || 'Unknown';
          console.log(`   Database Type: ${dbType}`);
          console.log(`   Sequelize Version: ${require('sequelize/package.json').version}`);
        }
      } catch (error) {
        // If specific queries fail, just show basic info
        console.log(`   Database Type: ${dbType}`);
        console.log(`   Connection Status: Active`);
      }
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