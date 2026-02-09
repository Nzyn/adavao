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

    // ── Repair corrupted encrypted data ──────────────────────────
    // Previously, VARCHAR(15) truncated encrypted values making them unrecoverable.
    // Detect values that look like truncated base64 (24-50 chars of pure base64)
    // and clear them so the user can re-enter their info.
    console.log('🔧 Checking for corrupted encrypted data...');
    const repairTables = [
      { table: 'users_public', idCol: 'id' },
      { table: 'user_admin', idCol: 'id' },
    ];
    for (const { table, idCol } of repairTables) {
      try {
        const [rows] = await db.query(
          `SELECT ${idCol}, contact, address FROM ${table} 
           WHERE (contact IS NOT NULL AND LENGTH(contact) BETWEEN 20 AND 50 AND contact ~ '^[A-Za-z0-9+/=]+$')
              OR (address IS NOT NULL AND LENGTH(address) BETWEEN 20 AND 50 AND address ~ '^[A-Za-z0-9+/=]+$')`
        );
        for (const row of rows) {
          const updates = [];
          const vals = [];
          let idx = 1;
          // A valid encrypted value is 60+ chars. 20-50 chars of pure base64 = truncated/corrupted.
          if (row.contact && row.contact.length >= 20 && row.contact.length <= 50 && /^[A-Za-z0-9+/=]+$/.test(row.contact)) {
            updates.push(`contact = $${idx++}`);
            vals.push(null);
            console.log(`  ⚠️  ${table} ${idCol}=${row[idCol]}: clearing corrupted contact (len=${row.contact.length})`);
          }
          if (row.address && row.address.length >= 20 && row.address.length <= 50 && /^[A-Za-z0-9+/=]+$/.test(row.address)) {
            updates.push(`address = $${idx++}`);
            vals.push(null);
            console.log(`  ⚠️  ${table} ${idCol}=${row[idCol]}: clearing corrupted address (len=${row.address.length})`);
          }
          if (updates.length > 0) {
            vals.push(row[idCol]);
            await db.query(`UPDATE ${table} SET ${updates.join(', ')} WHERE ${idCol} = $${idx}`, vals);
          }
        }
      } catch (repairErr) {
        console.warn(`  ℹ️  Could not repair ${table}: ${repairErr.message}`);
      }
    }
    console.log('✅ Data integrity check complete.');

    console.log('✅ Startup tasks completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Startup error:', error);
    console.warn('⚠️ Server will continue despite startup errors');
    return false;
  }
}

module.exports = { runMigrations };
