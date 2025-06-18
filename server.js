const { initializeApp } = require('./src/app');
const app = require('./src/app');
const config = require('./src/config/env');
const database = require('./src/config/database');

const startServer = async () => {
  try {
    console.log('🚀 Memulai RSUD Queue System Server...\n');
    
    // Initialize application (database, models, etc.)
    console.log('� Menginisialisasi aplikasi...');
    await initializeApp();
    
    // Start Express server
    const server = app.listen(config.PORT, () => {
      console.log(`\n✅ Server berhasil berjalan!`);
      console.log(`🌐 URL: http://localhost:${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🗄️  Database: ${config.database.type}://${config.database.host}:${config.database.port}/${config.database.database}`);
      console.log(`\n📋 Endpoints tersedia:`);
      console.log(`   - GET  /           : Halaman utama`);
      console.log(`   - GET  /health     : Health check`);
      console.log(`   - GET  /api        : API information`);
      console.log(`   - GET  /admin      : Admin panel`);
      console.log(`\n🎯 Server siap menerima request!`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Menerima signal ${signal}, memulai graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server ditutup');
        
        try {
          await database.close();
          console.log('✅ Graceful shutdown selesai');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error saat shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Gagal memulai server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();