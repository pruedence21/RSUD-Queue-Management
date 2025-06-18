const { DataTypes } = require('sequelize');
const BaseModel = require('./BaseModel');

/**
 * Dokter Model using Sequelize
 * Mengelola data dokter yang bertugas di poliklinik
 */
class Dokter extends BaseModel {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        nama_dokter: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'Nama dokter tidak boleh kosong',
            },
            len: {
              args: [2, 100],
              msg: 'Nama dokter harus antara 2-100 karakter',
            },
          },
        },
        spesialisasi: {
          type: DataTypes.STRING(100),
          allowNull: true,
          validate: {
            len: {
              args: [0, 100],
              msg: 'Spesialisasi maksimal 100 karakter',
            },
          },
        },
        no_telp: {
          type: DataTypes.STRING(20),
          allowNull: true,
          validate: {
            isNumeric: {
              msg: 'Nomor telepon harus berupa angka',
            },
          },
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: true,
          validate: {
            isEmail: {
              msg: 'Format email tidak valid',
            },
          },
        },
        jadwal_praktek: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'JSON format: {"senin": "08:00-12:00", "selasa": "14:00-17:00"}',
        },
        poli_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'poli',
            key: 'id',
          },
          validate: {
            notEmpty: {
              msg: 'Poli harus dipilih',
            },
          },
        },
        aktif: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: 'Dokter',
        tableName: 'dokter',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          {
            fields: ['poli_id'],
          },
          {
            fields: ['aktif'],
          },
          {
            fields: ['nama_dokter'],
          },
        ],
      }
    );
  }

  // Instance methods
  getJadwalHari(hari) {
    if (!this.jadwal_praktek) return null;
    return this.jadwal_praktek[hari.toLowerCase()] || null;
  }

  async updateJadwal(jadwalBaru) {
    const jadwalSaatIni = this.jadwal_praktek || {};
    const jadwalUpdate = { ...jadwalSaatIni, ...jadwalBaru };
    await this.update({ jadwal_praktek: jadwalUpdate });
  }

  getFullInfo() {
    return {
      id: this.id,
      nama_dokter: this.nama_dokter,
      spesialisasi: this.spesialisasi,
      no_telp: this.no_telp,
      email: this.email,
      jadwal_praktek: this.jadwal_praktek,
      poli_id: this.poli_id,
      aktif: this.aktif,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Static methods
  static async findByPoli(poliId, options = {}) {
    return await this.findAll({
      where: { poli_id: poliId, aktif: true },
      ...options,
    });
  }

  static async findWithPoli(options = {}) {
    return await this.findAll({
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli', 'aktif']
        }
      ],
      where: { aktif: true },
      ...options,
    });
  }

  static async search(query, options = {}) {
    const { Op } = require('sequelize');
    return await this.findAll({
      where: {
        [Op.or]: [
          {
            nama_dokter: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            spesialisasi: {
              [Op.iLike]: `%${query}%`
            }
          }
        ],
        aktif: true
      },
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['id', 'nama_poli', 'kode_poli']
        }
      ],
      ...options,
    });
  }

  static async getStatistics() {
    const { Op } = require('sequelize');
    
    const total = await this.count();
    const aktif = await this.count({ where: { aktif: true } });
    const nonAktif = await this.count({ where: { aktif: false } });
    
    // Statistics per poli
    const perPoli = await this.findAll({
      attributes: [
        'poli_id',
        [this.sequelize.fn('COUNT', this.sequelize.col('Dokter.id')), 'jumlah_dokter']
      ],
      include: [
        {
          model: require('./Poli'),
          as: 'poli',
          attributes: ['nama_poli', 'kode_poli']
        }
      ],
      group: ['Dokter.poli_id', 'poli.id', 'poli.nama_poli', 'poli.kode_poli'],
      raw: false
    });

    // Statistics by specialization
    const perSpesialisasi = await this.findAll({
      attributes: [
        'spesialisasi',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'jumlah']
      ],
      where: {
        spesialisasi: { [Op.ne]: null },
        aktif: true
      },
      group: ['spesialisasi'],
      order: [[this.sequelize.fn('COUNT', this.sequelize.col('id')), 'DESC']],
      raw: true
    });

    return {
      total,
      aktif,
      nonAktif,
      perPoli: perPoli.map(item => ({
        poli_id: item.poli_id,
        nama_poli: item.poli?.nama_poli || 'Unknown',
        kode_poli: item.poli?.kode_poli || 'Unknown',
        jumlah_dokter: parseInt(item.get('jumlah_dokter')) || 0
      })),
      perSpesialisasi: perSpesialisasi.map(item => ({
        spesialisasi: item.spesialisasi,
        jumlah: parseInt(item.jumlah) || 0
      }))
    };
  }

  static async findBySpecialization(spesialisasi, options = {}) {
    return await this.findAll({
      where: {
        spesialisasi: {
          [sequelize.Op.iLike]: `%${spesialisasi}%`,
        },
        aktif: true,
      },
      ...options,
    });
  }

  static async searchByName(nama, options = {}) {
    const { Op } = require('sequelize');
    return await this.findAll({
      where: {
        nama_dokter: {
          [Op.iLike]: `%${nama}%`,
        },
        aktif: true,
      },
      ...options,
    });
  }

  static async getWithPoli(options = {}) {
    return await this.findAll({
      include: [
        {
          association: 'poli',
          required: false,
        },
      ],
      where: { aktif: true },
      ...options,
    });
  }

  static async countByPoli(poliId) {
    return await this.count({
      where: { poli_id: poliId, aktif: true },
    });
  }

  // Validation methods
  async validateBeforeDelete() {
    // Check if doctor has active queues
    const { models } = require('./index');
    const activeQueues = await models.Antrian.count({
      where: {
        dokter_id: this.id,
        status: ['menunggu', 'dipanggil'],
      },
    });

    if (activeQueues > 0) {
      throw new Error('Tidak dapat menghapus dokter yang masih memiliki antrian aktif');
    }

    return true;
  }

  // Associations
  static associate(models) {
    // Dokter belongs to Poli
    this.belongsTo(models.Poli, {
      foreignKey: 'poli_id',
      as: 'poli'
    });

    // Dokter has many Antrian
    this.hasMany(models.Antrian, {
      foreignKey: 'dokter_id',
      as: 'antrian'
    });
  }
}

module.exports = Dokter;
