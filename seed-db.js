/**
 * Database Seeding Script
 * Run this script to populate the database with initial data
 */

const { seedData } = require('./src/migrations/seed');
const { initializeApp } = require('./src/app');

const runSeed = async () => {
  try {
    console.log('🌱 Starting database seeding process...\n');
    
    // Initialize the application first
    await initializeApp();
    
    // Run the seeding
    await seedData();
    
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
