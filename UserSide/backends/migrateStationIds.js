/**
 * Migrate station_id to assigned_station_id for existing reports
 * This fixes the issue where old reports are not visible to police officers
 */

const db = require('./db');

async function migrateStationIds() {
    try {
        console.log('🔄 Starting migration: station_id → assigned_station_id');
        
        // Update all reports that have station_id but not assigned_station_id
        const [result] = await db.query(`
            UPDATE reports 
            SET assigned_station_id = station_id 
            WHERE assigned_station_id IS NULL 
            AND station_id IS NOT NULL
        `);
        
        console.log(`✅ Migration complete! Updated ${result.affectedRows} reports`);
        
        // Verify the migration
        const [check] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN assigned_station_id IS NOT NULL THEN 1 ELSE 0 END) as with_assigned,
                SUM(CASE WHEN station_id IS NOT NULL AND assigned_station_id IS NULL THEN 1 ELSE 0 END) as missing_assigned
            FROM reports
        `);
        
        console.log('📊 Migration verification:');
        console.log(`   Total reports: ${check[0].total}`);
        console.log(`   With assigned_station_id: ${check[0].with_assigned}`);
        console.log(`   Missing assigned_station_id: ${check[0].missing_assigned}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateStationIds();
