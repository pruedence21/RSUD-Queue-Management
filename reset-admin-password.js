const User = require('./src/models/User');
const database = require('./src/config/database');
const { initializeModels } = require('./src/models/index');

async function resetAdminPassword() {
  try {
    console.log('🔄 Resetting admin password...');
    
    await database.connect();
    await initializeModels();
    
    const admin = await User.findByUsername('admin');
    if (admin) {
      await admin.update({ password: 'Admin123!' });
      console.log('✅ Admin password updated to: Admin123!');
    } else {
      console.log('❌ Admin user not found');
    }
    
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await database.close();
    process.exit(1);
  }
}

resetAdminPassword();