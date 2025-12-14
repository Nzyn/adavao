const { Pool } = require('pg');

const connectionString = 'postgresql://alertdavao_user:rcXDr9MjmEJ8Kk6l2Nw7SbDLnOaS1m0l@dpg-d4t0k8u3jp1c73fhvulg-a.singapore-postgres.render.com/alertdavao_f2ij';

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addColumns() {
    const client = await pool.connect();
    try {
        console.log('Adding missing columns to user_flags...');

        // Check if column exists before adding (idempotency)
        const checkColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_flags' AND column_name IN ('duration_days', 'expires_at');
    `);

        const existingColumns = checkColumns.rows.map(row => row.column_name);

        if (!existingColumns.includes('duration_days')) {
            console.log('Adding duration_days...');
            await client.query('ALTER TABLE user_flags ADD COLUMN duration_days INTEGER NULL;');
        } else {
            console.log('duration_days already exists.');
        }

        if (!existingColumns.includes('expires_at')) {
            console.log('Adding expires_at...');
            await client.query('ALTER TABLE user_flags ADD COLUMN expires_at TIMESTAMP NULL;');
        } else {
            console.log('expires_at already exists.');
        }

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

addColumns();
