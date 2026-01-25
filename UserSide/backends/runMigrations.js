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

    // Add priority flags columns (new system)
    console.log('📝 Adding is_focus_crime column...');
    await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS is_focus_crime BOOLEAN DEFAULT FALSE
    `);

    console.log('📝 Adding has_sufficient_info column...');
    await db.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS has_sufficient_info BOOLEAN DEFAULT TRUE
    `);

    // Create indexes for better performance
    console.log('📊 Creating index for priority sorting...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_priority 
      ON reports(is_focus_crime DESC, is_anonymous ASC, has_sufficient_info DESC, created_at ASC)
    `);

    console.log('📊 Creating index for verification status...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_verification 
      ON reports(verification_status)
    `);

    // Update existing reports to set priority flags
    console.log('🔄 Updating existing reports with priority flags...');
    await db.query(`
      UPDATE reports 
      SET is_focus_crime = CASE 
        WHEN report_type::text ILIKE '%Murder%' THEN true
        WHEN report_type::text ILIKE '%Homicide%' THEN true
        WHEN report_type::text ILIKE '%Physical Injury%' THEN true
        WHEN report_type::text ILIKE '%Rape%' THEN true
        WHEN report_type::text ILIKE '%Robbery%' THEN true
        WHEN report_type::text ILIKE '%Theft%' THEN true
        WHEN report_type::text ILIKE '%Carnapping%' THEN true
        WHEN report_type::text ILIKE '%Motorcycle Theft%' THEN true
        WHEN report_type::text ILIKE '%Motornapping%' THEN true
        ELSE false 
      END
      WHERE is_focus_crime IS NULL OR is_focus_crime = FALSE
    `);

    await db.query(`
      UPDATE reports 
      SET has_sufficient_info = CASE 
        WHEN description IS NOT NULL 
          AND LENGTH(description) >= 20 
          AND location_id IS NOT NULL 
        THEN true
        ELSE false 
      END
      WHERE has_sufficient_info IS NULL
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
