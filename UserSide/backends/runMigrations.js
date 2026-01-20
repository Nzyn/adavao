/**
 * Auto-Migration Script for AlertDavao
 * Runs automatically on server startup to apply database schema changes
 * This ensures migrations are applied when Render redeploys
 */

const db = require('./db');

async function runMigrations() {
    console.log('🔄 Running database migrations...');

    try {
        // Add new columns for police operations improvements
        console.log('📝 Adding urgency_score column...');
        await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS urgency_score INT DEFAULT 0
    `);

        console.log('📝 Adding verification_status column...');
        await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending'
    `);

        console.log('📝 Adding rejection_reason column...');
        await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);

        console.log('📝 Adding reviewed_by column...');
        await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS reviewed_by INT
    `);

        console.log('📝 Adding reviewed_at column...');
        await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `);

        // Create indexes for better performance
        console.log('📊 Creating index for urgency sorting...');
        await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_urgency 
      ON reports(urgency_score DESC, created_at DESC)
    `);

        console.log('📊 Creating index for verification status...');
        await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_verification 
      ON reports(verification_status)
    `);

        // Update existing reports to have urgency score
        console.log('🔄 Updating existing reports...');
        await db.query(`
      UPDATE reports 
      SET urgency_score = 0 
      WHERE urgency_score IS NULL
    `);

        console.log('✅ All migrations completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Migration error:', error);
        // Don't throw - allow server to start even if migrations fail
        // This prevents deployment failures
        console.warn('⚠️ Server will continue despite migration errors');
        return false;
    }
}

module.exports = { runMigrations };
