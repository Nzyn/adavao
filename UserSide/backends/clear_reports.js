// Script to clear all test reports, dispatches, and related data
// Run on Render via: node clear_reports.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting cleanup...');
    
    await client.query('BEGIN');
    
    // Delete in order of foreign key dependencies
    const r1 = await client.query('DELETE FROM report_media');
    console.log(`  Deleted ${r1.rowCount} media records`);
    
    const r2 = await client.query('DELETE FROM patrol_dispatches');
    console.log(`  Deleted ${r2.rowCount} dispatch records`);
    
    const r3 = await client.query("DELETE FROM report_timeline");
    console.log(`  Deleted ${r3.rowCount} timeline records`);

    const r4 = await client.query("DELETE FROM messages WHERE report_id IS NOT NULL");
    console.log(`  Deleted ${r4.rowCount} report messages`);
    
    const r5 = await client.query('DELETE FROM reports');
    console.log(`  Deleted ${r5.rowCount} reports`);
    
    // Clean up orphaned locations (locations not referenced by any remaining report)
    const r6 = await client.query(`DELETE FROM locations WHERE location_id NOT IN (SELECT DISTINCT location_id FROM reports WHERE location_id IS NOT NULL)`);
    console.log(`  Deleted ${r6.rowCount} orphaned locations`);
    
    await client.query('COMMIT');
    console.log('✅ All reports and related data cleared successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
