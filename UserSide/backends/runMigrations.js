/**
 * Startup Script for AlertDavao (UserSide Node.js Backend)
 * Runs automatically on server startup
 * 
 * NOTE: One-time schema migrations (columns, tables, indexes) have been removed.
 * Those were already applied to the production database.
 * Only recurring startup tasks remain here.
 */

const db = require('./db');

async function runMigrations() {
  console.log('🚀 Running startup tasks...');

  try {
    // Health check - verify database connection
    console.log('🔍 Verifying database connection...');
    const result = await db.query('SELECT NOW() as server_time');
    console.log(`✅ Database connected. Server time: ${result[0][0].server_time}`);

    console.log('✅ Startup tasks completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Startup error:', error);
    console.warn('⚠️ Server will continue despite startup errors');
    return false;
  }
}

module.exports = { runMigrations };
