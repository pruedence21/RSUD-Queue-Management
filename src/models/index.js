const database = require('../config/database');

// Import all models
const Poli = require('./Poli');
const Dokter = require('./Dokter');
const User = require('./User');
const Antrian = require('./Antrian');
const Settings = require('./Settings');

// Initialize models
const initializeModels = async () => {
  try {
    // Get sequelize instance
    const sequelize = database.getSequelize();
    
    if (!sequelize) {
      throw new Error('Sequelize instance not found. Make sure database is connected.');
    }

    // Initialize all models
    Poli.init(sequelize);
    Dokter.init(sequelize);
    User.init(sequelize);
    Antrian.init(sequelize);
    Settings.init(sequelize);

    console.log('✅ All models initialized');

    // Define associations
    defineAssociations();

    console.log('✅ Model associations defined');

    return {
      Poli,
      Dokter,
      User,
      Antrian,
      Settings,
      sequelize
    };
  } catch (error) {
    console.error('❌ Failed to initialize models:', error);
    throw error;
  }
};

// Define model associations
const defineAssociations = () => {
  // Poli -> Dokter (One to Many)
  Poli.hasMany(Dokter, {
    foreignKey: 'poli_id',
    as: 'dokters'
  });
  
  Dokter.belongsTo(Poli, {
    foreignKey: 'poli_id',
    as: 'poli'
  });

  // Poli -> Antrian (One to Many)
  Poli.hasMany(Antrian, {
    foreignKey: 'poli_id',
    as: 'antrians'
  });
  
  Antrian.belongsTo(Poli, {
    foreignKey: 'poli_id',
    as: 'poli'
  });

  // Dokter -> Antrian (One to Many)
  Dokter.hasMany(Antrian, {
    foreignKey: 'dokter_id',
    as: 'antrians'
  });
  
  Antrian.belongsTo(Dokter, {
    foreignKey: 'dokter_id',
    as: 'dokter'
  });

  // User -> Antrian (One to Many) - if user can have multiple queues
  User.hasMany(Antrian, {
    foreignKey: 'user_id',
    as: 'antrians'
  });
  
  Antrian.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Export models and initialization function
module.exports = {
  initializeModels,
  defineAssociations,
  models: {
    Poli,
    Dokter,
    User,
    Antrian,
    Settings
  }
};
