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

    // ── Widen contact & address columns to TEXT for encrypted data ────
    // Encrypted values are 60+ chars; VARCHAR(15) truncates/errors on PostgreSQL.
    console.log('🔧 Ensuring contact/address columns are TEXT type...');
    const columnWidenQueries = [
      `ALTER TABLE users_public ALTER COLUMN contact TYPE TEXT`,
      `ALTER TABLE users_public ALTER COLUMN address TYPE TEXT`,
      `ALTER TABLE user_admin ALTER COLUMN contact TYPE TEXT`,
      `ALTER TABLE user_admin ALTER COLUMN address TYPE TEXT`,
      `ALTER TABLE pending_user_admin_registrations ALTER COLUMN contact TYPE TEXT`,
    ];
    for (const q of columnWidenQueries) {
      try {
        await db.query(q);
      } catch (colErr) {
        // Column might already be TEXT, or table/column might not exist — safe to ignore
        if (!colErr.message.includes('does not exist')) {
          console.log(`  ℹ️  ${q.split('ALTER COLUMN ')[1]?.split(' ')[0] || ''}: ${colErr.message.includes('already') ? 'already TEXT' : colErr.message}`);
        }
      }
    }
    console.log('✅ Column type check complete.');

    console.log('✅ Startup tasks completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Startup error:', error);
    console.warn('⚠️ Server will continue despite startup errors');
    return false;
  }
}

module.exports = { runMigrations };
