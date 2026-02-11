const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspectRestrictions() {
    try {
        console.log('Inspecting user_restrictions table schema...');

        // Check columns and default values
        const res = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_restrictions'
      ORDER BY ordinal_position;
    `);

        console.log('Columns:', res.rows);

    } catch (err) {
        console.error('Error inspecting table:', err);
    } finally {
        pool.end();
    }
}

inspectRestrictions();
