const db = require('./db');

async function verifyMigration() {
    console.log('🔄 internal verification: Testing PostgreSQL connection...');
    try {
        const start = Date.now();
        const [rows, fields] = await db.query('SELECT NOW() as now, version() as version');
        const duration = Date.now() - start;

        console.log('✅ Connection Successful!');
        console.log(`⏱️ Duration: ${duration}ms`);
        console.log('📊 Server Time:', rows[0].now);
        console.log('🐘 PostgreSQL Version:', rows[0].version);

        // Test a simple table query if possible
        try {
            console.log('🔄 internally verifying table access (users_public)...');
            const [users] = await db.query('SELECT count(*) as count FROM users_public');
            console.log(`✅ Accessed users_public. Count: ${users[0].count}`);
        } catch (tableError) {
            console.log('⚠️ Could not query users_public (table might not exist yet or empty):', tableError.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed:', error);
        process.exit(1);
    }
}

verifyMigration();
