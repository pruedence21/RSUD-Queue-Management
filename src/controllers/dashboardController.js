// src/controllers/dashboardController.js
const logger = require('../utils/logger');
const Poli = require('../models/Poli');
const Dokter = require('../models/Dokter');
const User = require('../models/User');
const Antrian = require('../models/Antrian'); // Diaktifkan
const db = require('../config/database'); // Untuk query raw jika diperlukan

/**
 * @desc    Get general statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin only)
 */
exports.getGeneralStats = async (req, res) => {
  try {
    const totalPoli = await Poli.count();
    const totalDokter = await Dokter.count();
    const totalUser = await User.count();
    // const totalAntrianHariIni = await Antrian.count({ /* kondisi hari ini */ });
    // const totalAntrianSelesai = await Antrian.count({ /* kondisi selesai */ });

    // Contoh data, lengkapi dengan query yang sebenarnya
    res.json({
      status: 'success',
      data: {
        statistics: {
          totalPoli,
          totalDokter,
          totalUser,
          // totalAntrianHariIni,
          // totalAntrianSelesai,
          // antrianAktifSaatIni: 0, // Perlu logika lebih lanjut
          // rataRataWaktuTunggu: '0 menit', // Perlu logika lebih lanjut
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Error getGeneralStats:', error);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};

/**
 * @desc    Get today's queue statistics
 * @route   GET /api/dashboard/antrian-today
 * @access  Private (Admin only)
 */
exports.getAntrianTodayStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

    const totalAntrian = await Antrian.count({
      where: db.literal(`DATE(tanggal_antrian) = '${today}' AND status_antrian != 'BATAL'`)
    });

    const antrianSelesai = await Antrian.count({
      where: {
        [db.Sequelize.Op.and]: [
          db.literal(`DATE(tanggal_antrian) = '${today}'`),
          { status_antrian: 'SELESAI' }
        ]
      }
    });

    const antrianMenunggu = await Antrian.count({
      where: {
        [db.Sequelize.Op.and]: [
          db.literal(`DATE(tanggal_antrian) = '${today}'`),
          { status_antrian: ['MENUNGGU', 'DIPANGGIL'] } // Asumsi status aktif
        ]
      }
    });

    const antrianPerPoli = await Antrian.findAll({
      attributes: [
        'poli_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'jumlah_antrian']
      ],
      include: [{
        model: Poli,
        attributes: ['nama_poli', 'kode_poli'],
        required: true
      }],
      where: db.literal(`DATE(Antrian.tanggal_antrian) = '${today}' AND Antrian.status_antrian != 'BATAL'`),
      group: ['poli_id', 'Poli.id', 'Poli.nama_poli', 'Poli.kode_poli'], // Group by Poli attributes as well
      raw: true, // Untuk mendapatkan hasil yang lebih bersih jika tidak memerlukan instance Sequelize
      nest: true // Untuk mengelompokkan atribut Poli
    });

    // Membersihkan hasil antrianPerPoli agar sesuai format yang diinginkan
    const formattedAntrianPerPoli = antrianPerPoli.map(item => ({
        poli_id: item.poli_id,
        nama_poli: item.Poli.nama_poli,
        kode_poli: item.Poli.kode_poli,
        jumlah_antrian: item.jumlah_antrian
    }));

    res.json({
      status: 'success',
      data: {
        stats: {
            totalAntrian,
            antrianSelesai,
            antrianMenunggu,
            antrianPerPoli: formattedAntrianPerPoli
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getAntrianTodayStats:', error);
    console.error(error); // Tambahkan ini untuk melihat error di console saat development
    res.status(500).json({ status: 'error', message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get this week's queue statistics
 * @route   GET /api/dashboard/antrian-week
 * @access  Private (Admin only)
 */
exports.getAntrianWeekStats = async (req, res) => {
  try {
    // Logika untuk mengambil statistik antrian minggu ini
    // Contoh: Tren antrian harian, poli teramai, dll.
    res.json({
      status: 'success',
      message: 'Antrian Week Stats - Not yet implemented',
      data: {
        stats: {
            totalAntrianMingguIni: 0,
            rataRataAntrianHarian: 0,
            detailPerHari: [] // { tanggal, jumlah_antrian }
        }
      }
    });
  } catch (error) {
    logger.error('Error getAntrianWeekStats:', error);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};

/**
 * @desc    Get recent activities (audit log)
 * @route   GET /api/dashboard/activity-log
 * @access  Private (Admin only)
 */
exports.getActivityLog = async (req, res) => {
  try {
    // Logika untuk mengambil log aktivitas terbaru
    // Contoh: Login user, pembuatan data baru, perubahan penting, dll.
    // Ini mungkin memerlukan tabel log terpisah atau query dari berbagai tabel.
    res.json({
      status: 'success',
      message: 'Activity Log - Not yet implemented',
      data: {
        logs: [] // { timestamp, user, action, details }
      }
    });
  } catch (error) {
    logger.error('Error getActivityLog:', error);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};

/**
 * @desc    Get system alerts
 * @route   GET /api/dashboard/alerts
 * @access  Private (Admin only)
 */
exports.getSystemAlerts = async (req, res) => {
  try {
    // Logika untuk mengambil peringatan sistem
    // Contoh: Error rate tinggi, antrian penuh, layanan down (jika ada monitoring)
    res.json({
      status: 'success',
      message: 'System Alerts - Not yet implemented',
      data: {
        alerts: [] // { type, message, timestamp, severity }
      }
    });
  } catch (error) {
    logger.error('Error getSystemAlerts:', error);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};

/**
 * @desc    Get system performance metrics
 * @route   GET /api/dashboard/performance
 * @access  Private (Admin only)
 */
exports.getSystemPerformance = async (req, res) => {
  try {
    // Logika untuk mengambil metrik performa sistem
    // Contoh: CPU usage, memory usage, response time rata-rata API
    // Ini mungkin memerlukan integrasi dengan tools monitoring server atau PM2 API jika digunakan.
    res.json({
      status: 'success',
      message: 'System Performance - Not yet implemented',
      data: {
        performance: {
            cpuUsage: 'N/A', // Contoh
            memoryUsage: 'N/A', // Contoh
            avgResponseTime: 'N/A' // Contoh
        }
      }
    });
  } catch (error) {
    logger.error('Error getSystemPerformance:', error);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};
