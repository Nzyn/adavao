/**
 * Run IP Tracking Migration
 * Creates the report_ip_tracking table
 */

const db = require("./db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  console.log("\n" + "=".repeat(60));
  console.log("IP TRACKING MIGRATION");
  console.log("=".repeat(60) + "\n");

  try {
    console.log("📋 Creating report_ip_tracking table...\n");
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS report_ip_tracking (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        report_id BIGINT UNSIGNED NOT NULL,
        ip_address VARCHAR(45) NOT NULL COMMENT 'IPv4 or IPv6 address of the submitter',
        user_agent TEXT COMMENT 'Browser/client user agent string',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the report was submitted',
        FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
        INDEX idx_report_id (report_id),
        INDEX idx_ip_address (ip_address),
        INDEX idx_submitted_at (submitted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks IP addresses for report submissions'
    `;
    
    console.log(createTableSQL);
    console.log("\n");
    
    try {
      await db.query(createTableSQL);
      console.log(`✅ Table created successfully!\n`);
    } catch (err) {
      // Check if error is because table already exists
      if (err.code === "ER_TABLE_EXISTS_ERROR" || err.message.includes("already exists")) {
        console.log(`ℹ️  Table already exists - that's fine!\n`);
      } else {
        throw err;
      }
    }

    console.log("=".repeat(60));
    console.log("✅ MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60) + "\n");

    // Verify the table was created
    console.log("🔍 Verifying table structure...\n");
    const [columns] = await db.query("DESCRIBE report_ip_tracking");
    console.table(columns);

    console.log("\n✅ Table 'report_ip_tracking' is ready!");
    console.log("📊 IP addresses will now be tracked on report submissions.\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run migration
runMigration();
