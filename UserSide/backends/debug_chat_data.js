const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugChat() {
    try {
        console.log('--- DEBUGGING CHAT ---');

        // 1. Count messages
        const msgCount = await pool.query('SELECT count(*) FROM messages');
        console.log('Total Messages:', msgCount.rows[0].count);

        // 2. Sample messages
        const sample = await pool.query('SELECT sender_id, receiver_id, message, sent_at FROM messages LIMIT 5');
        console.log('Sample Messages:', sample.rows);

        // 3. Count Users
        const userCount = await pool.query('SELECT count(*) FROM users_public');
        console.log('Total Public Users:', userCount.rows[0].count);

        // 4. Count Admins
        // Check if table exists first
        try {
            const adminCount = await pool.query('SELECT count(*) FROM user_admin');
            console.log('Total Admins:', adminCount.rows[0].count);

            // Sample admins
            const sampleAdmins = await pool.query('SELECT id, username, role FROM user_admin LIMIT 5');
            console.log('Sample Admins:', sampleAdmins.rows);
        } catch (e) {
            console.log('user_admin table might not exist or empty');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debugChat();
