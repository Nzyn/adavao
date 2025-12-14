const db = require('./db');

async function run() {
    try {
        const [rows] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', rows.map(r => r.table_name));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();
