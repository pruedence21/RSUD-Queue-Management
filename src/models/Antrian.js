const { DataTypes } = require('sequelize');
const BaseModel = require('./BaseModel');

/**
 * Antrian Model using Sequelize
 * Mengelola data antrian pasien
 */
class Antrian extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nomor_antrian: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Nomor antrian tidak boleh kosong'
          }
        }
      },
      poli_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'poli',
          key: 'id'
        },
        validate: {
          notNull: {
            msg: 'Poli ID diperlukan'
          },
          isInt: {
            msg: 'Poli ID harus berupa angka'
          }
        }
      },
      dokter_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'dokter',
          key: 'id'
        },
        validate: {
          isInt: {
            msg: 'Dokter ID harus berupa angka'
          }
        }
      },
      nama_pasien: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Nama pasien tidak boleh kosong'
          },
          len: {
            args: [2, 100],
            msg: 'Nama pasien harus antara 2-100 karakter'
          }
        }
      },
      tanggal_antrian: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          notNull: {
            msg: 'Tanggal antrian diperlukan'
          },
          isDate: {
            msg: 'Tanggal antrian harus berupa tanggal yang valid'
          }
        }
      },
      waktu_checkin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      waktu_panggil: {
        type: DataTypes.DATE,
        allowNull: true
      },
      waktu_selesai: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status_antrian: {
        type: DataTypes.ENUM('MENUNGGU', 'DIPANGGIL', 'SEDANG_DILAYANI', 'SELESAI', 'TIDAK_HADIR', 'BATAL'),
        allowNull: false,
        defaultValue: 'MENUNGGU',
        validate: {
          notEmpty: {
            msg: 'Status antrian tidak boleh kosong'
          },
          isIn: {
            args: [['MENUNGGU', 'DIPANGGIL', 'SEDANG_DILAYANI', 'SELESAI', 'TIDAK_HADIR', 'BATAL']],
            msg: 'Status antrian tidak valid'
          }
        }
      },
      prioritas: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Antrian',
      tableName: 'antrian',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  // Instance methods
  async panggil() {
    this.status_antrian = 'DIPANGGIL';
    this.waktu_panggil = new Date();
    await this.save();
    return this;
  }

  async mulaiLayanan() {
    this.status_antrian = 'SEDANG_DILAYANI';
    await this.save();
    return this;
  }

  async selesai() {
    this.status_antrian = 'SELESAI';
    this.waktu_selesai = new Date();
    await this.save();
    return this;
  }

  async batal(keterangan = null) {
    this.status_antrian = 'BATAL';
    if (keterangan) {
      this.keterangan = keterangan;
    }
    await this.save();
    return this;
  }

  async tidakHadir() {
    this.status_antrian = 'TIDAK_HADIR';
    await this.save();
    return this;
  }

  // Static methods
  static async findByTanggal(tanggal) {
    return this.findAll({
      where: { tanggal_antrian: tanggal },
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        },
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [['nomor_antrian', 'ASC']]
    });
  }

  static async findByPoliAndTanggal(poli_id, tanggal) {
    return this.findAll({
      where: { 
        poli_id,
        tanggal_antrian: tanggal 
      },
      include: [
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [['nomor_antrian', 'ASC']]
    });
  }

  static async findMenunggu(poli_id = null) {
    const where = { 
      status_antrian: 'MENUNGGU',
      tanggal_antrian: new Date().toISOString().split('T')[0] // Today
    };
    
    if (poli_id) {
      where.poli_id = poli_id;
    }

    return this.findAll({
      where,
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        },
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [
        ['prioritas', 'DESC'],
        ['created_at', 'ASC']
      ]
    });
  }

  static async getNextNumber(poli_id, tanggal) {
    const Poli = require('./Poli');
    const poli = await Poli.findByPk(poli_id);
    
    if (!poli) {
      throw new Error('Poli tidak ditemukan');
    }

    const lastAntrian = await this.findOne({
      where: {
        poli_id,
        tanggal_antrian: tanggal
      },
      order: [['nomor_antrian', 'DESC']]
    });

    let nextNumber = 1;
    if (lastAntrian) {
      // Extract number from last queue number (e.g., "A001" -> 1)
      const lastNumber = parseInt(lastAntrian.nomor_antrian.slice(-3)) || 0;
      nextNumber = lastNumber + 1;
    }

    // Format: [KODE_POLI][001]
    const nomorAntrian = `${poli.kode_poli}${nextNumber.toString().padStart(3, '0')}`;
    
    return nomorAntrian;
  }

  static async createAntrian(data) {
    const { poli_id, tanggal_antrian } = data;
    
    // Generate nomor antrian
    const nomorAntrian = await this.getNextNumber(poli_id, tanggal_antrian);
    
    return this.create({
      ...data,
      nomor_antrian: nomorAntrian,
      waktu_checkin: new Date()
    });
  }

  // Additional static methods required by tests
  static async updateStatus(id, status, additionalData = {}) {
    const antrian = await this.findByPk(id);
    
    if (!antrian) {
      throw new Error('Antrian tidak ditemukan');
    }

    // Validate status
    const validStatuses = ['MENUNGGU', 'DIPANGGIL', 'SEDANG_DILAYANI', 'SELESAI', 'TIDAK_HADIR', 'BATAL'];
    const upperStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperStatus)) {
      throw new Error('Status antrian tidak valid');
    }

    // Update timestamps based on status
    const updateData = {
      status_antrian: upperStatus,
      ...additionalData
    };

    switch (upperStatus) {
      case 'DIPANGGIL':
        updateData.waktu_panggil = new Date();
        break;
      case 'SEDANG_DILAYANI':
        if (!antrian.waktu_panggil) {
          updateData.waktu_panggil = new Date();
        }
        break;
      case 'SELESAI':
        updateData.waktu_selesai = new Date();
        break;
    }

    await antrian.update(updateData);
    
    // Return with lowercase status for API consistency
    const result = antrian.toJSON();
    result.status = result.status_antrian.toLowerCase();
    return result;
  }

  static async getCurrentAntrian(poliId, dokterId = null) {
    const where = {
      poli_id: poliId,
      status_antrian: ['DIPANGGIL', 'SEDANG_DILAYANI'],
      tanggal_antrian: new Date().toISOString().split('T')[0]
    };

    if (dokterId) {
      where.dokter_id = dokterId;
    }

    const antrian = await this.findOne({
      where,
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        },
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [['waktu_panggil', 'DESC']]
    });

    if (antrian) {
      const result = antrian.toJSON();
      result.status = result.status_antrian.toLowerCase();
      return result;
    }
    
    return null;
  }

  static async getStatistics(date = null) {
    const filterDate = date || new Date().toISOString().split('T')[0];
    
    const stats = await this.findAll({
      attributes: [
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'total'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN status_antrian = 'MENUNGGU' THEN 1 END")), 'menunggu'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN status_antrian = 'DIPANGGIL' THEN 1 END")), 'dipanggil'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN status_antrian = 'SEDANG_DILAYANI' THEN 1 END")), 'sedang_dilayani'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN status_antrian = 'SELESAI' THEN 1 END")), 'selesai'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN status_antrian = 'TIDAK_HADIR' THEN 1 END")), 'terlewat'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN status_antrian = 'BATAL' THEN 1 END")), 'batal']
      ],
      where: {
        tanggal_antrian: filterDate
      }
    });

    const result = stats[0].toJSON();
    
    // Convert to numbers and add calculated fields
    Object.keys(result).forEach(key => {
      result[key] = parseInt(result[key]) || 0;
    });

    return result;
  }

  static async getStatisticsByPoli(date = null) {
    const filterDate = date || new Date().toISOString().split('T')[0];
    
    const stats = await this.findAll({
      attributes: [
        'poli_id',
        [this.sequelize.fn('COUNT', this.sequelize.col('Antrian.id')), 'total_antrian'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN \"Antrian\".\"status_antrian\" = 'MENUNGGU' THEN 1 END")), 'menunggu'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN \"Antrian\".\"status_antrian\" = 'DIPANGGIL' THEN 1 END")), 'dipanggil'],
        [this.sequelize.fn('COUNT', this.sequelize.literal("CASE WHEN \"Antrian\".\"status_antrian\" = 'SELESAI' THEN 1 END")), 'selesai']
      ],
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['nama_poli', 'kode_poli']
        }
      ],
      where: {
        tanggal_antrian: filterDate
      },
      group: ['Antrian.poli_id', 'poli.id', 'poli.nama_poli', 'poli.kode_poli'],
      order: [['poli_id', 'ASC']]
    });

    return stats.map(stat => {
      const result = stat.toJSON();
      // Convert counts to numbers
      result.total_antrian = parseInt(result.total_antrian) || 0;
      result.menunggu = parseInt(result.menunggu) || 0;
      result.dipanggil = parseInt(result.dipanggil) || 0;
      result.selesai = parseInt(result.selesai) || 0;
      
      // Add poli info
      if (result.poli) {
        result.nama_poli = result.poli.nama_poli;
        result.kode_poli = result.poli.kode_poli;
      }
      
      return result;
    });
  }

  static async getWaitingTimeEstimation(poliId, antrianId) {
    const targetAntrian = await this.findByPk(antrianId);
    
    if (!targetAntrian || targetAntrian.status_antrian !== 'MENUNGGU') {
      throw new Error('Antrian tidak ditemukan atau tidak dalam status menunggu');
    }

    // Count antrian before this one
    const { Op } = require('sequelize');
    const antrianSebelum = await this.count({
      where: {
        poli_id: poliId,
        tanggal_antrian: targetAntrian.tanggal_antrian,
        status_antrian: 'MENUNGGU',
        created_at: {
          [Op.lt]: targetAntrian.created_at
        }
      }
    });

    // Average service time (estimated 15 minutes per patient)
    const avgServiceTimeMinutes = 15;
    const estimatedWaitMinutes = (antrianSebelum + 1) * avgServiceTimeMinutes;
    
    // Calculate estimated time
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + (estimatedWaitMinutes * 60000));
    
    return {
      position: antrianSebelum + 1,
      estimatedWaitTime: estimatedWaitMinutes,
      estimatedWaitTimeText: `${Math.floor(estimatedWaitMinutes / 60)} jam ${estimatedWaitMinutes % 60} menit`,
      estimatedCallTime: estimatedTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  static async getTodayAntrianForDisplay(poliId = null) {
    const today = new Date().toISOString().split('T')[0];
    
    const where = {
      tanggal_antrian: today
    };
    
    if (poliId) {
      where.poli_id = poliId;
    }

    const antrian = await this.findAll({
      where,
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        },
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [
        ['poli_id', 'ASC'],
        ['nomor_antrian', 'ASC']
      ]
    });

    return antrian.map(item => {
      const result = item.toJSON();
      result.status = result.status_antrian.toLowerCase();
      return result;
    });
  }

  static async findByPoliWithDetails(poliId, status = null, date = null) {
    const filterDate = date || new Date().toISOString().split('T')[0];
    
    const where = {
      poli_id: poliId,
      tanggal_antrian: filterDate
    };

    if (status) {
      where.status_antrian = status.toUpperCase();
    }

    const antrian = await this.findAll({
      where,
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        },
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [['nomor_antrian', 'ASC']]
    });

    return antrian.map(item => {
      const result = item.toJSON();
      result.status = result.status_antrian.toLowerCase();
      return result;
    });
  }

  static async getNextAntrian(poliId, dokterId = null) {
    const today = new Date().toISOString().split('T')[0];
    
    const where = {
      poli_id: poliId,
      status_antrian: 'MENUNGGU',
      tanggal_antrian: today
    };

    if (dokterId) {
      where.dokter_id = dokterId;
    }

    const antrian = await this.findOne({
      where,
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        },
        {
          model: require('./Dokter'),
          as: 'dokter',
          attributes: ['id', 'nama_dokter', 'spesialisasi']
        }
      ],
      order: [
        ['prioritas', 'DESC'],
        ['created_at', 'ASC']
      ]
    });

    if (antrian) {
      const result = antrian.toJSON();
      result.status = result.status_antrian.toLowerCase();
      return result;
    }
    
    return null;
  }

  // Associations
  static associate(models) {
    // Antrian belongs to Poli
    this.belongsTo(models.Poli, {
      foreignKey: 'poli_id',
      as: 'poli'
    });

    // Antrian belongs to Dokter
    this.belongsTo(models.Dokter, {
      foreignKey: 'dokter_id',
      as: 'dokter'
    });
  }
}

module.exports = Antrian;
