const { Pool } = require('pg');

const connectionString = 'postgresql://alertdavao_w07v_user:W7nLMXVel4jMKegzbLCEAn7CC8LFMIwT@dpg-d651i2ggjchc73fqnkqg-a.singapore-postgres.render.com/alertdavao_w07v';

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function dropConstraints() {
    const client = await pool.connect();
    try {
        console.log('Dropping constraints...');

        // We try to drop both if they exist
        const queries = [
            "ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_foreign;",
            "ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_foreign;"
        ];

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await client.query(query);
        }

        console.log('Constraints dropped successfully.');
    } catch (err) {
        console.error('Error dropping constraints:', err);
    } finally {
        client.release();
        pool.end();
    }
}

dropConstraints();
