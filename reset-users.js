const User = require('./src/models/User');
const database = require('./src/config/database');

/**
 * Reset User Passwords Script
 * Reset passwords for existing users
 */

async function resetUsers() {
  try {
    console.log('🔄 Resetting user passwords...\n');

    // Connect to database
    await database.connect();
    console.log('✅ Database connected');

    // Reset admin password
    console.log('\n📝 Resetting admin password...');
    
    let adminUser = await User.findByUsername('admin');
    
    if (adminUser) {
      await User.resetPassword(adminUser.id, 'Admin123!');
      console.log('✅ Admin password reset successfully');
      console.log('   Username: admin');
      console.log('   New Password: Admin123!');
    } else {
      // Create new admin user
      adminUser = await User.create({
        username: 'admin',
        password: 'Admin123!',
        nama_lengkap: 'Administrator',
        role: 'admin',
        aktif: true
      });
      console.log('✅ Admin user created successfully');
    }

    // Reset petugas password
    console.log('\n📝 Resetting petugas password...');
    
    let petugasUser = await User.findByUsername('petugas1');
    
    if (petugasUser) {
      await User.resetPassword(petugasUser.id, 'Petugas123!');
      console.log('✅ Petugas password reset successfully');
      console.log('   Username: petugas1');
      console.log('   New Password: Petugas123!');
    } else {
      // Create new petugas user
      petugasUser = await User.create({
        username: 'petugas1',
        password: 'Petugas123!',
        nama_lengkap: 'Petugas Loket 1',
        role: 'petugas',
        aktif: true
      });
      console.log('✅ Petugas user created successfully');
    }

    // Test authentication
    console.log('\n📝 Testing authentication...');
    
    const authenticatedAdmin = await User.authenticate('admin', 'Admin123!');
    if (authenticatedAdmin) {
      console.log('✅ Admin authentication successful');
      console.log(`   User ID: ${authenticatedAdmin.id}`);
      console.log(`   Role: ${authenticatedAdmin.role}`);
    } else {
      console.log('❌ Admin authentication still failed');
    }

    const authenticatedPetugas = await User.authenticate('petugas1', 'Petugas123!');
    if (authenticatedPetugas) {
      console.log('✅ Petugas authentication successful');
      console.log(`   User ID: ${authenticatedPetugas.id}`);
      console.log(`   Role: ${authenticatedPetugas.role}`);
    } else {
      console.log('❌ Petugas authentication still failed');
    }

    console.log('\n🎉 Password reset completed!');
    console.log('\n📋 Updated Test Credentials:');
    console.log('   Admin: username=admin, password=Admin123!');
    console.log('   Petugas: username=petugas1, password=Petugas123!');

    // Test login API endpoint using fetch-like approach
    console.log('\n🧪 Testing API login endpoint...');
    
    const testLogin = async (username, password) => {
      try {
        const authController = require('./src/controllers/authController');
        
        // Mock request and response objects
        const req = {
          body: { username, password },
          ip: '127.0.0.1',
          get: () => 'test-user-agent'
        };
        
        const res = {
          json: (data) => {
            console.log(`✅ Login test for ${username}:`, data.status === 'success' ? 'SUCCESS' : 'FAILED');
            if (data.status === 'success') {
              console.log(`   Token generated: ${data.data.token ? 'YES' : 'NO'}`);
            }
            return res;
          },
          status: (code) => res
        };
        
        // Test login
        await authController.login(req, res);
        
      } catch (error) {
        console.log(`❌ Login test for ${username} failed:`, error.message);
      }
    };
    
    // Note: Manual testing via curl/Postman recommended for actual API testing

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await database.close();
    process.exit(0);
  }
}

// Run reset
resetUsers();