// Script to initialize the database
const { initializeDatabase, closeDatabase } = require('../lib/db/index.ts');

async function run() {
  console.log('🚀 Initializing database (Turso/libSQL)...');

  try {
    await initializeDatabase();
    console.log('✨ Database setup complete!');
    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

run();
