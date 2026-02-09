const { Pool } = require('pg');
const fs = require('fs');

// Render PostgreSQL connection
const pool = new Pool({
    connectionString: 'postgresql://alertdavao_w07v_user:W7nLMXVel4jMKegzbLCEAn7CC8LFMIwT@dpg-d651i2ggjchc73fqnkqg-a.singapore-postgres.render.com/alertdavao_w07v',
    ssl: { rejectUnauthorized: false }
});

async function exportDatabase() {
    const client = await pool.connect();
    let sqlOutput = '-- AlertDavao Database Export\n';
    sqlOutput += `-- Exported at: ${new Date().toISOString()}\n\n`;

    try {
        // Get all tables
        const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

        console.log(`Found ${tablesResult.rows.length} tables`);

        for (const row of tablesResult.rows) {
            const tableName = row.tablename;
            console.log(`Exporting table: ${tableName}`);

            // Get table schema
            const schemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

            sqlOutput += `-- Table: ${tableName}\n`;

            // Get data
            const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
            console.log(`  - ${dataResult.rows.length} rows`);

            if (dataResult.rows.length > 0) {
                const columns = Object.keys(dataResult.rows[0]);

                for (const dataRow of dataResult.rows) {
                    const values = columns.map(col => {
                        const val = dataRow[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return val;
                    });
                    sqlOutput += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
                }
            }
            sqlOutput += '\n';
        }

        // Write to file
        fs.writeFileSync('alertdavao_live_backup.sql', sqlOutput);
        console.log('\n✅ Export complete! Saved to alertdavao_live_backup.sql');

    } catch (err) {
        console.error('Export error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

exportDatabase();
