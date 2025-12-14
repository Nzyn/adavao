const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspectTable() {
    try {
        console.log('Inspecting user_flags table schema...');

        // Check columns and default values
        const res = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_flags'
      ORDER BY ordinal_position;
    `);

        console.log('Columns:', res.rows);

        // Check for sequences
        const seqRes = await pool.query(`
      SELECT c.relname FROM pg_class c 
      WHERE c.relkind = 'S';
    `);
        console.log('Sequences:', seqRes.rows);

    } catch (err) {
        console.error('Error inspecting table:', err);
    } finally {
        pool.end();
    }
}

inspectTable();
