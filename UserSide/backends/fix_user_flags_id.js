const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixUserFlags() {
    try {
        console.log('Fixing user_flags ID sequence...');

        // 1. Create sequence if not exists
        await pool.query(`CREATE SEQUENCE IF NOT EXISTS user_flags_id_seq;`);

        // 2. Set default value for id column
        await pool.query(`ALTER TABLE user_flags ALTER COLUMN id SET DEFAULT nextval('user_flags_id_seq');`);

        // 3. Sync sequence with max id (just in case)
        await pool.query(`SELECT setval('user_flags_id_seq', COALESCE((SELECT MAX(id) FROM user_flags), 0) + 1, false);`);

        console.log('✅ Successfully added sequence to user_flags.id');

    } catch (err) {
        console.error('❌ Error fixing user_flags:', err);
    } finally {
        pool.end();
    }
}

fixUserFlags();
