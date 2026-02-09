const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://alertdavao_w07v_user:W7nLMXVel4jMKegzbLCEAn7CC8LFMIwT@dpg-d651i2ggjchc73fqnkqg-a.singapore-postgres.render.com/alertdavao_w07v',
    ssl: { rejectUnauthorized: false }
});

async function generateDataDictionary() {
    try {
        // Get all tables and their columns
        const schemaQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `;

        const result = await pool.query(schemaQuery);

        // Get row counts for each table
        const countQuery = `
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
        const tables = await pool.query(countQuery);

        const counts = {};
        for (const t of tables.rows) {
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${t.tablename}"`);
            counts[t.tablename] = parseInt(countResult.rows[0].count);
        }

        // Group by table
        const tableData = {};
        for (const row of result.rows) {
            if (!tableData[row.table_name]) {
                tableData[row.table_name] = [];
            }
            tableData[row.table_name].push(row);
        }

        // Generate markdown
        let md = `# AlertDavao Database Data Dictionary\n\n`;
        md += `**Database:** alertdavao_w07v (PostgreSQL)  \n`;
        md += `**Generated:** ${new Date().toISOString()}  \n`;
        md += `**Total Tables:** ${Object.keys(tableData).length}\n\n`;
        md += `---\n\n`;

        // Table of Contents
        md += `## Table of Contents\n\n`;
        const sortedTables = Object.keys(tableData).sort();
        for (const table of sortedTables) {
            md += `- [${table}](#${table.toLowerCase().replace(/_/g, '-')}) (${counts[table] || 0} rows)\n`;
        }
        md += `\n---\n\n`;

        // Each table
        for (const table of sortedTables) {
            const columns = tableData[table];
            md += `## ${table}\n\n`;
            md += `**Row Count:** ${counts[table] || 0}\n\n`;
            md += `| Column | Data Type | Nullable | Default |\n`;
            md += `|--------|-----------|----------|----------|\n`;

            for (const col of columns) {
                let dataType = col.data_type;
                if (col.character_maximum_length) {
                    dataType += `(${col.character_maximum_length})`;
                }
                const nullable = col.is_nullable === 'YES' ? 'Yes' : 'No';
                let defaultVal = col.column_default || '-';
                if (defaultVal.length > 30) {
                    defaultVal = defaultVal.substring(0, 27) + '...';
                }
                md += `| ${col.column_name} | ${dataType} | ${nullable} | ${defaultVal} |\n`;
            }
            md += `\n`;
        }

        fs.writeFileSync('data_dictionary.md', md);
        console.log('Data dictionary generated: data_dictionary.md');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

generateDataDictionary();
