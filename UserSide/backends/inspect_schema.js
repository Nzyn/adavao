const { Pool } = require('pg');

const connectionString = 'postgresql://alertdavao_user:rcXDr9MjmEJ8Kk6l2Nw7SbDLnOaS1m0l@dpg-d4t0k8u3jp1c73fhvulg-a.singapore-postgres.render.com/alertdavao_f2ij';

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
