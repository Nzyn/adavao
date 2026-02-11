const { Pool } = require('pg');

const connectionString = 'postgresql://alertdavao_w07v_user:W7nLMXVel4jMKegzbLCEAn7CC8LFMIwT@dpg-d651i2ggjchc73fqnkqg-a.singapore-postgres.render.com/alertdavao_w07v';

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function inspectSchema() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();

        const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_flags';
    `);

        console.log('Columns in user_flags:', columns.rows);

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

inspectSchema();
