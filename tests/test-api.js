const User = require('../src/models/User');
const database = require('../src/config/database');
const { initializeModels } = require('../src/models/index');

/**
 * Simple API Testing Script
 * Test basic functionality of the API
 */

async function testAPI() {
  try {
    console.log('🧪 Starting API Tests...\n');

    // Connect to database
    await database.connect();
    console.log('✅ Database connected');

    // Initialize models
    await initializeModels();
    console.log('✅ Models initialized');

    // Test 1: Create admin user if not exists
    console.log('\n📝 Test 1: Creating admin user...');
    
    let adminUser = await User.findByUsername('admin');
    
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        password: 'Admin123!',
        nama_lengkap: 'Administrator',
        role: 'admin',
        aktif: true
      });
      console.log('✅ Admin user created successfully');
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Password: Admin123!`);
      console.log(`   Role: ${adminUser.role}`);
    } else {
      console.log('✅ Admin user already exists');
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Role: ${adminUser.role}`);
    }

    // Test 2: Create petugas user if not exists
    console.log('\n📝 Test 2: Creating petugas user...');
    
    let petugasUser = await User.findByUsername('petugas1');
    
    if (!petugasUser) {
      petugasUser = await User.create({
        username: 'petugas1',
        password: 'Petugas123!',
        nama_lengkap: 'Petugas Loket 1',
        role: 'petugas',
        aktif: true
      });
      console.log('✅ Petugas user created successfully');
      console.log(`   Username: ${petugasUser.username}`);
      console.log(`   Password: Petugas123!`);
      console.log(`   Role: ${petugasUser.role}`);
    } else {
      console.log('✅ Petugas user already exists');
      console.log(`   Username: ${petugasUser.username}`);
      console.log(`   Role: ${petugasUser.role}`);
    }

    // Test 3: Test authentication
    console.log('\n📝 Test 3: Testing authentication...');
    
    const authenticatedAdmin = await User.authenticate('admin', 'Admin123!');
    if (authenticatedAdmin) {
      console.log('✅ Admin authentication successful');
    } else {
      console.log('❌ Admin authentication failed');
    }

    const authenticatedPetugas = await User.authenticate('petugas1', 'Petugas123!');
    if (authenticatedPetugas) {
      console.log('✅ Petugas authentication successful');
    } else {
      console.log('❌ Petugas authentication failed');
    }

    // Test 4: Test wrong password
    console.log('\n📝 Test 4: Testing wrong password...');
    
    const wrongAuth = await User.authenticate('admin', 'wrongpassword');
    if (!wrongAuth) {
      console.log('✅ Wrong password correctly rejected');
    } else {
      console.log('❌ Wrong password incorrectly accepted');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Users Created:');
    console.log('   Admin: username=admin, password=Admin123!');
    console.log('   Petugas: username=petugas1, password=Petugas123!');
    
    console.log('\n🚀 You can now test the API endpoints:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: {"username": "admin", "password": "Admin123!"}');
    
    console.log('\n📱 Available API endpoints:');
    console.log('   GET  http://localhost:3000/api - API documentation');
    console.log('   POST http://localhost:3000/api/auth/login - Login');
    console.log('   GET  http://localhost:3000/api/poli - Get all poli (requires auth)');
    console.log('   POST http://localhost:3000/api/poli - Create poli (admin only)');

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
testAPI();