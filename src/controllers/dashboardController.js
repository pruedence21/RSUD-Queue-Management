// src/controllers/dashboardController.js
const logger = require('../utils/logger');
const Poli = require('../models/Poli');
const Dokter = require('../models/Dokter');
const User = require('../models/User');
const Antrian = require('../models/Antrian'); // Diaktifkan
const db = require('../config/database'); // Database instance
const { Sequelize } = require('sequelize'); // Sequelize operators

/**
 * @desc    Get general statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin only)
 */
exports.getGeneralStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalPoli = await Poli.count();
    const totalDokter = await Dokter.count();
    const totalUser = await User.count();
    
    const totalAntrianHariIni = await Antrian.count({
      where: {
        tanggal_antrian: today,
        status_antrian: {
          [Sequelize.Op.ne]: 'BATAL'
        }
      }
    });
    
    const totalAntrianSelesai = await Antrian.count({
      where: {
        tanggal_antrian: today,
        status_antrian: 'SELESAI'
      }
    });

    const antrianAktifSaatIni = await Antrian.count({
      where: {
        tanggal_antrian: today,
        status_antrian: {
          [Sequelize.Op.in]: ['MENUNGGU', 'DIPANGGIL', 'SEDANG_DILAYANI']
        }
      }
    });

    // Calculate average waiting time (simple estimation)
    const avgWaitingTime = antrianAktifSaatIni > 0 ?
      Math.round(antrianAktifSaatIni * 15) : 0; // 15 minutes per patient estimate

    res.json({
      status: 'success',
      data: {
        statistics: {
          totalPoli,
          totalDokter,
          totalUser,
          totalAntrianHariIni,
          totalAntrianSelesai,
          antrianAktifSaatIni,
          rataRataWaktuTunggu: `${avgWaitingTime} menit`,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Error getGeneralStats:', error);
    res.status(500).json({ status: 'error', message: 'Server Error', error: error.message });
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
      where: {
        tanggal_antrian: today,
        status_antrian: {
          [Sequelize.Op.ne]: 'BATAL'
        }
      }
    });

    const antrianSelesai = await Antrian.count({
      where: {
        tanggal_antrian: today,
        status_antrian: 'SELESAI'
      }
    });

    const antrianMenunggu = await Antrian.count({
      where: {
        tanggal_antrian: today,
        status_antrian: {
          [Sequelize.Op.in]: ['MENUNGGU', 'DIPANGGIL']
        }
      }
    });

    const antrianPerPoli = await Antrian.findAll({
      attributes: [
        'poli_id',
        [Sequelize.fn('COUNT', Sequelize.col('Antrian.id')), 'jumlah_antrian']
      ],
      include: [{
        model: Poli,
        as: 'poli',
        attributes: ['nama_poli', 'kode_poli'],
        required: true
      }],
      where: {
        tanggal_antrian: today,
        status_antrian: {
          [Sequelize.Op.ne]: 'BATAL'
        }
      },
      group: ['poli_id', 'poli.id', 'poli.nama_poli', 'poli.kode_poli'], // Group by Poli attributes as well
      raw: true, // Untuk mendapatkan hasil yang lebih bersih jika tidak memerlukan instance Sequelize
      nest: true // Untuk mengelompokkan atribut Poli
    });

    // Membersihkan hasil antrianPerPoli agar sesuai format yang diinginkan
    const formattedAntrianPerPoli = antrianPerPoli.map(item => ({
        poli_id: item.poli_id,
        nama_poli: item.poli?.nama_poli || 'Unknown',
        kode_poli: item.poli?.kode_poli || 'Unknown',
        jumlah_antrian: parseInt(item.jumlah_antrian) || 0
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
    // Mendapatkan tanggal awal minggu ini (Senin)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysFromMonday = (currentDay === 0) ? 6 : currentDay - 1; // Adjust for Sunday
    const mondayThisWeek = new Date(today);
    mondayThisWeek.setDate(today.getDate() - daysFromMonday);
    mondayThisWeek.setHours(0, 0, 0, 0);

    const sundayThisWeek = new Date(mondayThisWeek);
    sundayThisWeek.setDate(mondayThisWeek.getDate() + 6);
    sundayThisWeek.setHours(23, 59, 59, 999);

    // Total antrian minggu ini
    const totalAntrianMingguIni = await Antrian.count({
      where: {
        tanggal_antrian: {
          [Sequelize.Op.between]: [mondayThisWeek, sundayThisWeek]
        },
        status_antrian: {
          [Sequelize.Op.ne]: 'BATAL'
        }
      }
    });

    // Detail per hari
    const detailPerHari = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(mondayThisWeek);
      currentDate.setDate(mondayThisWeek.getDate() + i);
      
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const jumlahAntrian = await Antrian.count({
        where: {
          tanggal_antrian: {
            [Sequelize.Op.between]: [startOfDay, endOfDay]
          },
          status_antrian: {
            [Sequelize.Op.ne]: 'BATAL'
          }
        }
      });

      detailPerHari.push({
        tanggal: currentDate.toISOString().slice(0, 10),
        hari: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][i],
        jumlah_antrian: jumlahAntrian
      });
    }

    const rataRataAntrianHarian = totalAntrianMingguIni > 0 ? 
      Math.round(totalAntrianMingguIni / 7 * 100) / 100 : 0;

    res.json({
      status: 'success',
      data: {
        stats: {
          totalAntrianMingguIni,
          rataRataAntrianHarian,
          detailPerHari,
          periodeFrom: mondayThisWeek.toISOString().slice(0, 10),
          periodeTo: sundayThisWeek.toISOString().slice(0, 10)
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getAntrianWeekStats:', error);
    res.status(500).json({ status: 'error', message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get recent activities (audit log)
 * @route   GET /api/dashboard/activity-log
 * @access  Private (Admin only)
 */
exports.getActivityLog = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Mengambil aktivitas dari berbagai tabel
    const activities = [];

    // Antrian terbaru
    const recentAntrian = await Antrian.findAll({
      include: [
        { model: Poli, as: 'poli', attributes: ['nama_poli'] },
        { model: Dokter, as: 'dokter', attributes: ['nama_dokter'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['id', 'nomor_antrian', 'nama_pasien', 'status_antrian', 'created_at']
    });

    recentAntrian.forEach(antrian => {
      activities.push({
        id: `antrian_${antrian.id}`,
        timestamp: antrian.created_at,
        type: 'ANTRIAN',
        action: 'BUAT_ANTRIAN',
        user: 'Sistem',
        details: `Antrian ${antrian.nomor_antrian} dibuat untuk ${antrian.nama_pasien} di ${antrian.poli?.nama_poli || 'Poli tidak diketahui'}`,
        severity: 'INFO'
      });
    });

    // User terbaru (jika ada data created_at)
    try {
      const recentUsers = await User.findAll({
        order: [['created_at', 'DESC']],
        limit: 5,
        attributes: ['id', 'username', 'role', 'created_at']
      });

      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          timestamp: user.created_at,
          type: 'USER',
          action: 'BUAT_USER',
          user: 'Admin',
          details: `User baru '${user.username}' dengan role '${user.role}' dibuat`,
          severity: 'INFO'
        });
      });
    } catch (userError) {
      logger.warn('Could not fetch recent users:', userError.message);
    }

    // Poli dan Dokter terbaru
    try {
      const recentPoli = await Poli.findAll({
        order: [['created_at', 'DESC']],
        limit: 3,
        attributes: ['id', 'nama_poli', 'created_at']
      });

      recentPoli.forEach(poli => {
        activities.push({
          id: `poli_${poli.id}`,
          timestamp: poli.created_at,
          type: 'POLI',
          action: 'BUAT_POLI',
          user: 'Admin',
          details: `Poli baru '${poli.nama_poli}' ditambahkan`,
          severity: 'INFO'
        });
      });
    } catch (poliError) {
      logger.warn('Could not fetch recent poli:', poliError.message);
    }

    // Sort by timestamp descending dan ambil sesuai limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const paginatedActivities = activities.slice(offset, offset + limit);

    res.json({
      status: 'success',
      data: {
        logs: paginatedActivities,
        pagination: {
          total: activities.length,
          limit,
          offset,
          hasMore: offset + limit < activities.length
        }
      }
    });
  } catch (error) {
    logger.error('Error getActivityLog:', error);
    res.status(500).json({ status: 'error', message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get system alerts
 * @route   GET /api/dashboard/alerts
 * @access  Private (Admin only)
 */
exports.getSystemAlerts = async (req, res) => {
  try {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check 1: Antrian hari ini melebihi kapasitas normal
    const totalAntrianToday = await Antrian.count({
      where: {
        tanggal_antrian: {
          [Sequelize.Op.gte]: today
        },
        status_antrian: {
          [Sequelize.Op.ne]: 'BATAL'
        }
      }
    });

    if (totalAntrianToday > 100) { // Threshold bisa disesuaikan
      alerts.push({
        id: 'high_queue_count',
        type: 'WARNING',
        severity: 'HIGH',
        message: `Antrian hari ini (${totalAntrianToday}) melebihi kapasitas normal`,
        timestamp: new Date().toISOString(),
        actionable: true,
        action: 'Pertimbangkan untuk menambah sesi layanan'
      });
    }

    // Check 2: Antrian menunggu terlalu lama
    const longWaitingQueue = await Antrian.count({
      where: {
        status_antrian: 'MENUNGGU',
        created_at: {
          [Sequelize.Op.lt]: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 jam lalu
        }
      }
    });

    if (longWaitingQueue > 0) {
      alerts.push({
        id: 'long_waiting_queue',
        type: 'CRITICAL',
        severity: 'HIGH',
        message: `${longWaitingQueue} antrian sudah menunggu lebih dari 2 jam`,
        timestamp: new Date().toISOString(),
        actionable: true,
        action: 'Periksa status layanan dan panggil antrian tertunda'
      });
    }

    // Check 3: Dokter tidak aktif hari ini
    const inactiveDoctorsToday = await Dokter.count({
      where: {
        aktif: false
      }
    });

    if (inactiveDoctorsToday > 0) {
      alerts.push({
        id: 'inactive_doctors',
        type: 'INFO',
        severity: 'MEDIUM',
        message: `${inactiveDoctorsToday} dokter dalam status tidak aktif`,
        timestamp: new Date().toISOString(),
        actionable: true,
        action: 'Periksa jadwal dokter dan update status jika perlu'
      });
    }

    // Check 4: Poli tidak ada antrian hari ini (might indicate issue)
    const poliWithoutQueue = await Poli.count({
      where: {
        aktif: true,
        id: {
          [Sequelize.Op.notIn]: Sequelize.literal(`(
            SELECT DISTINCT poli_id FROM antrian
            WHERE tanggal_antrian = '${new Date().toISOString().split('T')[0]}'
            AND status_antrian != 'BATAL'
          )`)
        }
      }
    });

    if (poliWithoutQueue > 0) {
      alerts.push({
        id: 'poli_no_queue',
        type: 'INFO',
        severity: 'LOW',
        message: `${poliWithoutQueue} poli aktif belum memiliki antrian hari ini`,
        timestamp: new Date().toISOString(),
        actionable: false,
        action: null
      });
    }

    // System health check (basic)
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (memoryUsagePercent > 80) {
      alerts.push({
        id: 'high_memory_usage',
        type: 'WARNING',
        severity: 'MEDIUM',
        message: `Penggunaan memori tinggi: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        actionable: true,
        action: 'Pertimbangkan restart aplikasi atau optimasi query'
      });
    }

    res.json({
      status: 'success',
      data: {
        alerts: alerts.sort((a, b) => {
          const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }),
        summary: {
          total: alerts.length,
          critical: alerts.filter(a => a.type === 'CRITICAL').length,
          warning: alerts.filter(a => a.type === 'WARNING').length,
          info: alerts.filter(a => a.type === 'INFO').length
        }
      }
    });
  } catch (error) {
    logger.error('Error getSystemAlerts:', error);
    res.status(500).json({ status: 'error', message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Get system performance metrics
 * @route   GET /api/dashboard/performance
 * @access  Private (Admin only)
 */
exports.getSystemPerformance = async (req, res) => {
  try {
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStats = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapUsagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 10000) / 100
    };

    // Process uptime
    const uptimeSeconds = process.uptime();
    const uptimeFormatted = {
      seconds: Math.floor(uptimeSeconds % 60),
      minutes: Math.floor((uptimeSeconds / 60) % 60),
      hours: Math.floor((uptimeSeconds / 3600) % 24),
      days: Math.floor(uptimeSeconds / 86400)
    };

    // CPU usage (basic - not real-time monitoring)
    const cpuUsage = process.cpuUsage();

    // Database connection test
    let dbStatus = 'OK';
    let dbResponseTime = 0;
    try {
      const startTime = Date.now();
      await db.testConnection();
      dbResponseTime = Date.now() - startTime;
    } catch (dbError) {
      dbStatus = 'ERROR';
      logger.error('Database connection test failed:', dbError);
    }

    // API performance simulation (basic metrics)
    const apiMetrics = {
      totalRequests: 'N/A', // Would need middleware to track
      avgResponseTime: dbResponseTime + ' ms (DB only)',
      errorRate: 'N/A', // Would need error tracking middleware
      requestsPerSecond: 'N/A' // Would need request tracking
    };

    // Resource utilization
    const resourceUsage = {
      memory: memoryStats,
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        usage: 'N/A' // Real CPU percentage would need additional calculation
      },
      uptime: {
        raw: uptimeSeconds,
        formatted: `${uptimeFormatted.days}d ${uptimeFormatted.hours}h ${uptimeFormatted.minutes}m ${uptimeFormatted.seconds}s`
      }
    };

    // Database performance
    const dbMetrics = {
      status: dbStatus,
      responseTime: dbResponseTime,
      connectionPool: 'N/A', // Would need Sequelize pool info
      activeConnections: 'N/A'
    };

    // System health score (basic calculation)
    let healthScore = 100;
    if (memoryStats.heapUsagePercent > 80) healthScore -= 20;
    if (dbResponseTime > 1000) healthScore -= 15;
    if (dbStatus !== 'OK') healthScore -= 30;

    const healthStatus = healthScore >= 80 ? 'EXCELLENT' : 
                        healthScore >= 60 ? 'GOOD' : 
                        healthScore >= 40 ? 'WARNING' : 'CRITICAL';

    res.json({
      status: 'success',
      data: {
        performance: {
          healthScore,
          healthStatus,
          api: apiMetrics,
          database: dbMetrics,
          resources: resourceUsage,
          timestamp: new Date().toISOString()
        },
        recommendations: [
          ...(memoryStats.heapUsagePercent > 70 ? ['Pertimbangkan optimasi penggunaan memori'] : []),
          ...(dbResponseTime > 500 ? ['Database response time lambat, periksa query optimization'] : []),
          ...(uptimeSeconds < 3600 ? ['Aplikasi baru saja restart, monitor stabilitas'] : [])
        ]
      }
    });
  } catch (error) {
    logger.error('Error getSystemPerformance:', error);
    res.status(500).json({ status: 'error', message: 'Server Error', error: error.message });
  }
};
