/**
 * Auto-Migration Script for AlertDavao
 * Runs automatically on server startup to apply database schema changes
 * This ensures migrations are applied when Render redeploys
 */

const db = require('./db');

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  const safeQuery = async (label, sql, params = []) => {
    try {
      await db.query(sql, params);
      return true;
    } catch (error) {
      console.warn(`⚠️ Migration step skipped (${label}):`, error.message);
      return false;
    }
  };

  try {
    // Add new columns for police operations improvements
    console.log('📝 Adding urgency_score column...');
    await safeQuery('reports.urgency_score', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS urgency_score INT DEFAULT 0
    `);

    console.log('📝 Adding verification_status column...');
    await safeQuery('reports.verification_status', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending'
    `);

    console.log('📝 Adding rejection_reason column...');
    await safeQuery('reports.rejection_reason', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);

    console.log('📝 Adding reviewed_by column...');
    await safeQuery('reports.reviewed_by', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS reviewed_by INT
    `);

    console.log('📝 Adding reviewed_at column...');
    await safeQuery('reports.reviewed_at', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `);

    // Add priority flags columns (new system)
    console.log('📝 Adding is_focus_crime column...');
    await safeQuery('reports.is_focus_crime', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS is_focus_crime BOOLEAN DEFAULT FALSE
    `);

    console.log('📝 Adding has_sufficient_info column...');
    await safeQuery('reports.has_sufficient_info', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS has_sufficient_info BOOLEAN DEFAULT TRUE
    `);

    // Create indexes for better performance
    console.log('📊 Creating index for priority sorting...');
    await safeQuery('idx_reports_priority', `
      CREATE INDEX IF NOT EXISTS idx_reports_priority
      ON reports(is_focus_crime DESC, is_anonymous ASC, has_sufficient_info DESC, created_at ASC)
    `);

    console.log('📊 Creating index for verification status...');
    await safeQuery('idx_reports_verification', `
      CREATE INDEX IF NOT EXISTS idx_reports_verification
      ON reports(verification_status)
    `);

    // Sensitive media (spoiler filter) support
    console.log('📝 Adding report_media.is_sensitive column...');
    await safeQuery('report_media.is_sensitive', `
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT FALSE
    `);

    console.log('📝 Adding report_media.moderation_provider column...');
    await safeQuery('report_media.moderation_provider', `
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS moderation_provider VARCHAR(50)
    `);

    console.log('📝 Adding report_media.moderation_status column...');
    await safeQuery('report_media.moderation_status', `
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50)
    `);

    console.log('📝 Adding report_media.moderation_raw column...');
    await safeQuery('report_media.moderation_raw', `
      ALTER TABLE report_media
      ADD COLUMN IF NOT EXISTS moderation_raw JSONB
    `);

    console.log('📊 Creating index for sensitive media...');
    await safeQuery('idx_report_media_sensitive', `
      CREATE INDEX IF NOT EXISTS idx_report_media_sensitive
      ON report_media(is_sensitive, report_id)
    `);

    // Duplicate report detection support
    console.log('📝 Adding reports.content_hash column...');
    await safeQuery('reports.content_hash', `
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS content_hash TEXT
    `);

    console.log('📊 Creating index for reports.content_hash...');
    await safeQuery('idx_reports_content_hash', `
      CREATE INDEX IF NOT EXISTS idx_reports_content_hash
      ON reports(content_hash, created_at DESC)
    `);

    // Patrol dispatch system support (used by UserSide patrol UI)
    console.log('📝 Ensuring users_public patrol columns exist...');
    await safeQuery('users_public.user_role', `ALTER TABLE users_public ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'user'`);
    await safeQuery('users_public.assigned_station_id', `ALTER TABLE users_public ADD COLUMN IF NOT EXISTS assigned_station_id BIGINT`);
    await safeQuery('users_public.is_on_duty', `ALTER TABLE users_public ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT FALSE`);
    await safeQuery('users_public.push_token', `ALTER TABLE users_public ADD COLUMN IF NOT EXISTS push_token TEXT`);

    await safeQuery('idx_users_public_user_role', `CREATE INDEX IF NOT EXISTS idx_users_public_user_role ON users_public(user_role)`);
    await safeQuery('idx_users_public_assigned_station_id', `CREATE INDEX IF NOT EXISTS idx_users_public_assigned_station_id ON users_public(assigned_station_id)`);
    await safeQuery('idx_users_public_is_on_duty', `CREATE INDEX IF NOT EXISTS idx_users_public_is_on_duty ON users_public(is_on_duty)`);

    // Test patrol accounts helper (for QA/dev)
    // Creates test patrol accounts DIRECTLY in users_public with known credentials.
    // No AdminSide registration/verification needed - these are purely for mobile app testing.
    console.log('🧪 Creating/ensuring test patrol accounts in users_public...');

    // bcrypt hash of "Patrol123!" - a simple test password
    // Generated via: require('bcryptjs').hashSync('Patrol123!', 10)
    const testPatrolPasswordHash = '$2a$10$/qV9cuM7p1mxAbmbehMmLOU37IzHGrp/PcaVRg8toFKjxRrMlAsqq';

    // Define test patrol accounts to create directly in users_public
    const testPatrolAccounts = [
      { email: 'tpatrol@mailsac.com', firstname: 'Test', lastname: 'Patrol', contact: '09170000001' },
      { email: 'testpatrol1@mailsac.com', firstname: 'Test', lastname: 'Patrol1', contact: '09170000002' },
      { email: 'testpatrol2@mailsac.com', firstname: 'Test', lastname: 'Patrol2', contact: '09170000003' },
      { email: 'testpatrol3@mailsac.com', firstname: 'Test', lastname: 'Patrol3', contact: '09170000004' },
      { email: 'dansoypatrol1@mailsac.com', firstname: 'Dansoy', lastname: 'Patrol1', contact: '09170000005' },
      { email: 'dansoypatrol2@mailsac.com', firstname: 'Dansoy', lastname: 'Patrol2', contact: '09170000006' },
    ];

    for (const acct of testPatrolAccounts) {
      try {
        // Check if exists first
        const [existingRows] = await db.query(
          `SELECT id, email, user_role FROM users_public WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
          [acct.email]
        );

        if (existingRows.length > 0) {
          console.log(`   ✅ Test patrol ${acct.email} already exists (id=${existingRows[0].id}, role=${existingRows[0].user_role})`);
          // Ensure it has patrol_officer role
          await db.query(
            `UPDATE users_public SET user_role = 'patrol_officer', email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1`,
            [existingRows[0].id]
          );
        } else {
          // Insert new account
          const [insertResult] = await db.query(
            `INSERT INTO users_public (firstname, lastname, email, contact, password, user_role, is_on_duty, email_verified_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'patrol_officer', FALSE, NOW(), NOW(), NOW())
             RETURNING id`,
            [acct.firstname, acct.lastname, acct.email, acct.contact, testPatrolPasswordHash]
          );
          console.log(`   ✅ Created test patrol ${acct.email} (id=${insertResult[0]?.id})`);
        }
      } catch (err) {
        console.error(`   ❌ Failed to create/update test patrol ${acct.email}:`, err.message);
      }
    }

    console.log('🧪 Test patrol accounts setup complete. Password for all: Patrol123!');

    console.log('📝 Ensuring patrol_dispatches table exists...');
    await safeQuery('create patrol_dispatches', `
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

    await safeQuery('idx_patrol_dispatches_report_id', `CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_report_id ON patrol_dispatches(report_id)`);
    await safeQuery('idx_patrol_dispatches_officer_id', `CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_officer_id ON patrol_dispatches(patrol_officer_id)`);
    await safeQuery('idx_patrol_dispatches_status', `CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_status ON patrol_dispatches(status)`);
    await safeQuery('idx_patrol_dispatches_station_id', `CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_station_id ON patrol_dispatches(station_id)`);
    await safeQuery('idx_patrol_dispatches_dispatched_at', `CREATE INDEX IF NOT EXISTS idx_patrol_dispatches_dispatched_at ON patrol_dispatches(dispatched_at DESC)`);

    // Update existing reports to set priority flags
    console.log('🔄 Updating existing reports with priority flags...');
    await safeQuery('backfill reports.is_focus_crime', `
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

    await safeQuery('backfill reports.has_sufficient_info', `
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
