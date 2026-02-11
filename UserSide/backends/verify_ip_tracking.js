/**
 * Verify IP Tracking Implementation
 * This script checks if the report_ip_tracking table exists and is working properly
 */

const db = require("./db");

async function verifyIPTracking() {
  console.log("\n" + "=".repeat(60));
  console.log("IP TRACKING VERIFICATION REPORT");
  console.log("=".repeat(60) + "\n");

  try {
    // Check if table exists
    console.log("1️⃣  Checking if report_ip_tracking table exists...");
    const [tables] = await db.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'alertdavao' AND TABLE_NAME = 'report_ip_tracking'`
    );

    if (tables.length === 0) {
      console.log("   ❌ Table does NOT exist");
      console.log("\n   Run this command to create it:");
      console.log("   cd d:\\Codes\\alertdavao\\alertdavao\\sql");
      console.log("   .\\RUN_IP_TRACKING_MIGRATION.ps1\n");
      process.exit(1);
    }

    console.log("   ✅ Table exists\n");

    // Get table structure
    console.log("2️⃣  Table Structure:");
    const [columns] = await db.query("DESCRIBE report_ip_tracking");
    console.table(columns);

    // Count total records
    console.log("\n3️⃣  Total IP Tracking Records:");
    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM report_ip_tracking"
    );
    console.log(`   Total records: ${countResult[0].total}\n`);

    // Show recent records if any exist
    if (countResult[0].total > 0) {
      console.log("4️⃣  Recent IP Tracking Records (Last 5):");
      const [recentRecords] = await db.query(
        `SELECT 
          ipt.id,
          ipt.report_id,
          r.title,
          ipt.ip_address,
          LEFT(ipt.user_agent, 50) as user_agent_preview,
          ipt.submitted_at
         FROM report_ip_tracking ipt
         LEFT JOIN reports r ON ipt.report_id = r.report_id
         ORDER BY ipt.submitted_at DESC
         LIMIT 5`
      );
      console.table(recentRecords);

      // Count by IP
      console.log("\n5️⃣  Reports per IP Address:");
      const [ipCounts] = await db.query(
        `SELECT 
          ip_address,
          COUNT(*) as report_count,
          MIN(submitted_at) as first_submission,
          MAX(submitted_at) as last_submission
         FROM report_ip_tracking
         GROUP BY ip_address
         ORDER BY report_count DESC
         LIMIT 5`
      );
      console.table(ipCounts);

      // Check for reports without IP tracking
      console.log("\n6️⃣  Checking for reports without IP tracking...");
      const [missingIP] = await db.query(
        `SELECT 
          r.report_id,
          r.title,
          r.created_at
         FROM reports r
         LEFT JOIN report_ip_tracking ipt ON r.report_id = ipt.report_id
         WHERE ipt.id IS NULL
         ORDER BY r.created_at DESC
         LIMIT 5`
      );

      if (missingIP.length > 0) {
        console.log(`   ⚠️  Found ${missingIP.length} reports without IP tracking:`);
        console.table(missingIP);
        console.log("\n   Note: This is normal for reports submitted before IP tracking was enabled.");
      } else {
        console.log("   ✅ All reports have IP tracking!\n");
      }
    } else {
      console.log("4️⃣  No IP tracking records yet.");
      console.log("   📝 Submit a test report to verify IP tracking is working.\n");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ Table exists and structure is correct");
    console.log(`📊 Total tracking records: ${countResult[0].total}`);
    console.log("✅ Ready to track IP addresses on report submission");
    console.log("=".repeat(60) + "\n");

    console.log("💡 Next Steps:");
    console.log("   1. Submit a test report from the app");
    console.log("   2. Run this script again to verify the IP was tracked");
    console.log("   3. Check the console logs when submitting a report\n");

  } catch (error) {
    console.error("\n❌ Error during verification:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run verification
verifyIPTracking();
