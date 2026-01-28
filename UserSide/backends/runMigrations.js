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

    // Sensitive media (spoiler filter) support
    console.log('📝 Adding report_media.is_sensitive column...');
    await db.query(`
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT FALSE
    `);

    console.log('📝 Adding report_media.moderation_provider column...');
    await db.query(`
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS moderation_provider VARCHAR(50)
    `);

    console.log('📝 Adding report_media.moderation_status column...');
    await db.query(`
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50)
    `);

    console.log('📝 Adding report_media.moderation_raw column...');
    await db.query(`
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS moderation_raw JSONB
    `);

    console.log('📊 Creating index for sensitive media...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_media_sensitive
      ON report_media(is_sensitive, report_id)
    `);

    // Duplicate report detection support
    console.log('📝 Adding reports.content_hash column...');
    await db.query(`
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS content_hash TEXT
    `);

    console.log('📊 Creating index for reports.content_hash...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_content_hash
      ON reports(content_hash, created_at DESC)
    `);

    // Patrol dispatch system support (used by UserSide patrol UI)
    console.log('📝 Ensuring users_public patrol columns exist...');
    await db.query(`ALTER TABLE users_public ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'user'`);
    await db.query(`ALTER TABLE users_public ADD COLUMN IF NOT EXISTS assigned_station_id BIGINT`);
    await db.query(`ALTER TABLE users_public ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE users_public ADD COLUMN IF NOT EXISTS push_token TEXT`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_public_user_role ON users_public(user_role)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_public_assigned_station_id ON users_public(assigned_station_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_public_is_on_duty ON users_public(is_on_duty)`);

    console.log('📝 Ensuring patrol_dispatches table exists...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS patrol_dispatches (
        dispatch_id BIGSERIAL PRIMARY KEY,
        report_id BIGINT NOT NULL,
        station_id BIGINT NOT NULL,
        patrol_officer_id BIGINT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        dispatched_at TIMESTAMP NOT NULL DEFAULT NOW(),
        accepted_at TIMESTAMP NULL,
        declined_at TIMESTAMP NULL,
        en_route_at TIMESTAMP NULL,
        arrived_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        acceptance_time INT NULL,
        response_time INT NULL,
        completion_time INT NULL,
        three_minute_rule_met BOOLEAN NULL,
        three_minute_rule_time INT NULL,
        is_valid BOOLEAN NULL,
        validation_notes TEXT NULL,
        validated_at TIMESTAMP NULL,
        dispatched_by BIGINT NULL,
        decline_reason TEXT NULL,
        cancellation_reason TEXT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_report_id ON patrol_dispatches(report_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_officer_id ON patrol_dispatches(patrol_officer_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_status ON patrol_dispatches(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_station_id ON patrol_dispatches(station_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_dispatched_at ON patrol_dispatches(dispatched_at DESC)`);

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
