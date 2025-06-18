const mysql = require('mysql2/promise');
const config = require('./env');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        timezone: '+07:00'
      });
      
      console.log('✅ Koneksi database MySQL berhasil');
      return this.connection;
    } catch (error) {
      console.error('❌ Gagal terhubung ke database:', error.message);
      throw error;
    }
  }

  async createDatabase() {
    try {
      const tempConnection = await mysql.createConnection({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        timezone: '+07:00'
      });

      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${config.database.database}`);
      console.log(`✅ Database '${config.database.database}' berhasil dibuat/sudah ada`);
      
      await tempConnection.end();
      return true;
    } catch (error) {
      console.error('❌ Gagal membuat database:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.connection) {
        await this.connect();
      }
      
      const [rows] = await this.connection.execute('SELECT 1 as test');
      console.log('✅ Test koneksi database berhasil');
      return true;
    } catch (error) {
      console.error('❌ Test koneksi database gagal:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Koneksi database ditutup');
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();