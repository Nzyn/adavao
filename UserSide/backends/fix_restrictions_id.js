const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixRestrictionsId() {
    try {
        console.log('Fixing user_restrictions ID sequence...');

        // 1. Create sequence if not exists
        await pool.query(`CREATE SEQUENCE IF NOT EXISTS user_restrictions_id_seq;`);

        // 2. Set default value for id column
        await pool.query(`ALTER TABLE user_restrictions ALTER COLUMN id SET DEFAULT nextval('user_restrictions_id_seq');`);

        // 3. Sync sequence with max id (just in case)
        await pool.query(`SELECT setval('user_restrictions_id_seq', COALESCE((SELECT MAX(id) FROM user_restrictions), 0) + 1, false);`);

        console.log('✅ Successfully added sequence to user_restrictions.id');

    } catch (err) {
        console.error('❌ Error fixing user_restrictions:', err);
    } finally {
        pool.end();
    }
}

fixRestrictionsId();
