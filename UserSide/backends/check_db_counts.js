
const { Pool } = require('pg');
require('dotenv').config();

async function checkCounts() {
    console.log('🔌 Connecting to database...');
    console.log('   URL:', process.env.DATABASE_URL ? 'Set (Hidden)' : 'NOT SET');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected!');

        const tables = ['users_public', 'reports', 'police_stations', 'barangays', 'locations'];

        for (const table of tables) {
            try {
                const res = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`📊 ${table}: ${res.rows[0].count} rows`);
            } catch (err) {
                console.log(`❌ ${table}: Error - ${err.message}`);
            }
        }

        client.release();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkCounts();
