const { DataTypes } = require('sequelize');
const BaseModel = require('./BaseModel');

/**
 * Poli Model using Sequelize
 * Mengelola data poliklinik/ruang pelayanan
 */
class Poli extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nama_poli: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Nama poli tidak boleh kosong'
          },
          len: {
            args: [3, 100],
            msg: 'Nama poli harus antara 3-100 karakter'
          }
        }
      },
      kode_poli: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: {
          msg: 'Kode poli sudah digunakan'
        },
        validate: {
          notEmpty: {
            msg: 'Kode poli tidak boleh kosong'
          },
          len: {
            args: [2, 10],
            msg: 'Kode poli harus antara 2-10 karakter'
          },
          isAlphanumeric: {
            msg: 'Kode poli hanya boleh berisi huruf dan angka'
          }
        }
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    }, {
      sequelize,
      modelName: 'Poli',
      tableName: 'poli',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  // Instance methods
  async toggle() {
    this.aktif = !this.aktif;
    await this.save();
    return this;
  }

  // Static methods
  static async findActive() {
    return this.findAll({
      where: { aktif: true },
      order: [['nama_poli', 'ASC']]
    });
  }

  static async findByKode(kode_poli) {
    return this.findOne({
      where: { kode_poli }
    });
  }

  static async search(query) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        [Op.or]: [
          { nama_poli: { [Op.like]: `%${query}%` } },
          { kode_poli: { [Op.like]: `%${query}%` } },
          { deskripsi: { [Op.like]: `%${query}%` } }
        ]
      },
      order: [['nama_poli', 'ASC']]
    });
  }

  // Associations
  static associate(models) {
    // Poli has many Dokter
    this.hasMany(models.Dokter, {
      foreignKey: 'poli_id',
      as: 'dokter'
    });

    // Poli has many Antrian
    this.hasMany(models.Antrian, {
      foreignKey: 'poli_id',
      as: 'antrian'
    });
  }
}

module.exports = Poli;