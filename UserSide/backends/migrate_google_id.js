// Standalone migration script - connects directly to Render PostgreSQL
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://alertdavao_pi0t_user:EijmJTlSlEUnGZY0GxTqun9e0fTEuodU@dpg-d5h79g75r7bs73b97mug-a.singapore-postgres.render.com/alertdavao_pi0t',
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
});

async function migrate() {
    console.log('🔧 Connecting to Render PostgreSQL...');

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Add all potentially missing columns for Google Auth
        const migrations = [
            { name: 'google_id', sql: 'ALTER TABLE users_public ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE' },
            { name: 'last_login', sql: 'ALTER TABLE users_public ADD COLUMN IF NOT EXISTS last_login TIMESTAMP' },
            { name: 'is_verified', sql: 'ALTER TABLE users_public ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false' },
            { name: 'email_verified', sql: 'ALTER TABLE users_public ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false' },
            { name: 'profile_image', sql: 'ALTER TABLE users_public ADD COLUMN IF NOT EXISTS profile_image TEXT' },
        ];

        for (const migration of migrations) {
            console.log(`🔧 Adding column: ${migration.name}...`);
            try {
                await client.query(migration.sql);
                console.log(`   ✅ ${migration.name} added/exists`);
            } catch (error) {
                if (error.code === '42701') {
                    console.log(`   ℹ️ ${migration.name} already exists`);
                } else {
                    console.log(`   ⚠️ ${migration.name} error: ${error.message}`);
                }
            }
        }

        console.log('✅ All migrations complete!');
        await client.end();
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        await client.end();
        process.exit(1);
    }

    process.exit(0);
}

migrate();
