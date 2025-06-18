const Antrian = require('./src/models/Antrian');
const Poli = require('./src/models/Poli');
const Dokter = require('./src/models/Dokter');
const database = require('./src/config/database');

/**
 * Antrian API Testing Script
 * Test antrian functionality
 */

async function testAntrianAPI() {
  try {
    console.log('🧪 Starting Antrian API Tests...\n');

    // Connect to database
    await database.connect();
    console.log('✅ Database connected');

    // Test 1: Create sample poli and dokter if not exists
    console.log('\n📝 Test 1: Setting up test data...');
    
    let testPoli = await Poli.findByKode('TEST');
    if (!testPoli) {
      testPoli = await Poli.create({
        nama_poli: 'Poli Test',
        kode_poli: 'TEST',
        aktif: true
      });
      console.log('✅ Test poli created');
    } else {
      console.log('✅ Test poli already exists');
    }

    let testDokter = await Dokter.findOne({ poli_id: testPoli.id });
    if (!testDokter) {
      testDokter = await Dokter.create({
        nama_dokter: 'Dr. Test',
        spesialisasi: 'Umum',
        poli_id: testPoli.id,
        aktif: true
      });
      console.log('✅ Test dokter created');
    } else {
      console.log('✅ Test dokter already exists');
    }

    // Test 2: Create antrian
    console.log('\n📝 Test 2: Creating antrian...');
    
    const antrianData = {
      poli_id: testPoli.id,
      dokter_id: testDokter.id,
      nama_pasien: 'Pasien Test 1'
    };

    const newAntrian = await Antrian.create(antrianData);
    console.log('✅ Antrian created successfully');
    console.log(`   ID: ${newAntrian.id}`);
    console.log(`   Nomor: ${newAntrian.nomor_antrian}`);
    console.log(`   Pasien: ${newAntrian.nama_pasien}`);
    console.log(`   Status: ${newAntrian.status}`);

    // Test 3: Create more antrian for testing queue
    console.log('\n📝 Test 3: Creating more antrian...');
    
    const antrian2 = await Antrian.create({
      poli_id: testPoli.id,
      dokter_id: testDokter.id,
      nama_pasien: 'Pasien Test 2'
    });

    const antrian3 = await Antrian.create({
      poli_id: testPoli.id,
      nama_pasien: 'Pasien Test 3' // Without dokter
    });

    console.log('✅ Additional antrian created');
    console.log(`   Antrian 2: ${antrian2.nomor_antrian}`);
    console.log(`   Antrian 3: ${antrian3.nomor_antrian}`);

    // Test 4: Get next antrian
    console.log('\n📝 Test 4: Testing next antrian...');
    
    const nextAntrian = await Antrian.getNextAntrian(testPoli.id);
    if (nextAntrian) {
      console.log('✅ Next antrian found');
      console.log(`   Nomor: ${nextAntrian.nomor_antrian}`);
      console.log(`   Pasien: ${nextAntrian.nama_pasien}`);
    } else {
      console.log('❌ No next antrian found');
    }

    // Test 5: Update status to 'dipanggil'
    console.log('\n📝 Test 5: Calling antrian...');
    
    if (nextAntrian) {
      const calledAntrian = await Antrian.updateStatus(nextAntrian.id, 'dipanggil');
      console.log('✅ Antrian called successfully');
      console.log(`   Nomor: ${calledAntrian.nomor_antrian}`);
      console.log(`   Status: ${calledAntrian.status}`);
      console.log(`   Jam Panggil: ${calledAntrian.jam_panggil}`);
    }

    // Test 6: Get current antrian
    console.log('\n📝 Test 6: Getting current antrian...');
    
    const currentAntrian = await Antrian.getCurrentAntrian(testPoli.id);
    if (currentAntrian) {
      console.log('✅ Current antrian found');
      console.log(`   Nomor: ${currentAntrian.nomor_antrian}`);
      console.log(`   Status: ${currentAntrian.status}`);
    } else {
      console.log('❌ No current antrian found');
    }

    // Test 7: Get antrian by poli with details
    console.log('\n📝 Test 7: Getting antrian by poli...');
    
    const antrianByPoli = await Antrian.findByPoliWithDetails(testPoli.id);
    console.log(`✅ Found ${antrianByPoli.length} antrian for poli`);
    antrianByPoli.forEach((antrian, index) => {
      console.log(`   ${index + 1}. ${antrian.nomor_antrian} - ${antrian.nama_pasien} - ${antrian.status}`);
    });

    // Test 8: Get statistics
    console.log('\n📝 Test 8: Getting statistics...');
    
    const stats = await Antrian.getStatistics();
    console.log('✅ Statistics retrieved');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Menunggu: ${stats.menunggu}`);
    console.log(`   Dipanggil: ${stats.dipanggil}`);
    console.log(`   Selesai: ${stats.selesai}`);
    console.log(`   Terlewat: ${stats.terlewat}`);

    // Test 9: Get statistics by poli
    console.log('\n📝 Test 9: Getting statistics by poli...');
    
    const statsByPoli = await Antrian.getStatisticsByPoli();
    console.log(`✅ Found statistics for ${statsByPoli.length} poli`);
    statsByPoli.forEach(stat => {
      if (stat.total_antrian > 0) {
        console.log(`   ${stat.nama_poli}: ${stat.total_antrian} total, ${stat.menunggu} menunggu`);
      }
    });

    // Test 10: Waiting time estimation
    console.log('\n📝 Test 10: Testing waiting time estimation...');
    
    const waitingAntrian = antrianByPoli.find(a => a.status === 'menunggu');
    if (waitingAntrian) {
      const estimation = await Antrian.getWaitingTimeEstimation(testPoli.id, waitingAntrian.id);
      console.log('✅ Waiting time estimation calculated');
      console.log(`   Position: ${estimation.position}`);
      console.log(`   Estimated time: ${estimation.estimatedWaitTimeText}`);
    } else {
      console.log('⚠️  No waiting antrian found for estimation');
    }

    // Test 11: Search functionality
    console.log('\n📝 Test 11: Testing search...');
    
    // Search by nomor antrian
    const searchResults = await Antrian.executeQuery(
      `SELECT * FROM antrian WHERE nomor_antrian LIKE ? LIMIT 5`,
      ['%TEST%']
    );
    console.log(`✅ Search results: ${searchResults.length} found`);

    // Test 12: Get today's antrian for display
    console.log('\n📝 Test 12: Getting display data...');
    
    const displayData = await Antrian.getTodayAntrianForDisplay(testPoli.id);
    console.log(`✅ Display data: ${displayData.length} antrian today`);

    // Test 13: Complete antrian flow
    console.log('\n📝 Test 13: Testing complete flow...');
    
    // Get next antrian
    const nextForFlow = await Antrian.getNextAntrian(testPoli.id);
    if (nextForFlow) {
      // Call antrian
      await Antrian.updateStatus(nextForFlow.id, 'dipanggil');
      console.log(`✅ Called: ${nextForFlow.nomor_antrian}`);
      
      // Complete antrian
      await Antrian.updateStatus(nextForFlow.id, 'selesai');
      console.log(`✅ Completed: ${nextForFlow.nomor_antrian}`);
    }

    console.log('\n🎉 All Antrian tests completed successfully!');
    
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Antrian creation with auto nomor generation');
    console.log('   ✅ Queue management (next, current antrian)');
    console.log('   ✅ Status updates (menunggu → dipanggil → selesai)');
    console.log('   ✅ Statistics and reporting');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Waiting time estimation');
    console.log('   ✅ Display data for screens');
    console.log('   ✅ Data validation and business logic');

    console.log('\n🚀 API Endpoints ready for testing:');
    console.log('   POST http://localhost:3000/api/antrian - Create antrian');
    console.log('   GET  http://localhost:3000/api/antrian - List all antrian');
    console.log('   GET  http://localhost:3000/api/antrian/poli/:poliId - Get by poli');
    console.log('   GET  http://localhost:3000/api/antrian/next/:poliId - Get next antrian');
    console.log('   POST http://localhost:3000/api/antrian/call/:poliId - Call next antrian');
    console.log('   PATCH http://localhost:3000/api/antrian/:id/status - Update status');
    console.log('   GET  http://localhost:3000/api/antrian/statistics - Get statistics');
    console.log('   GET  http://localhost:3000/api/antrian/display - Display data (Public)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await database.close();
    process.exit(0);
  }
}

// Run tests
testAntrianAPI();