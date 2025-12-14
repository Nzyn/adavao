const db = require('./db');

async function run() {
    try {
        console.log('Creating users_public view...');
        await db.query(`
      CREATE OR REPLACE VIEW users_public AS
      SELECT id, firstname, lastname, email, role, station_id
      FROM users;
    `);
        console.log('View created successfully.');
    } catch (err) {
        console.error('Error creating view:', err);
    } finally {
        process.exit();
    }
}

run();
