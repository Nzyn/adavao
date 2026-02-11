/**
 * Debug why reports aren't being assigned
 */

const db = require("./db");

/**
 * Debug report structure
 */
async function debugReportStructure(req, res) {
  try {
    console.log("🔍 Debugging report structure...");

    // Check a sample report with its location
    const [sampleReports] = await db.query(
      `SELECT 
        r.report_id,
        r.title,
        r.location_id,
        r.station_id,
        l.location_id as loc_id,
        l.latitude,
        l.longitude,
        l.barangay
       FROM reports r
       LEFT JOIN locations l ON r.location_id = l.location_id
       LIMIT 5`
    );

    console.log("📊 Sample reports with locations:");
    console.log(JSON.stringify(sampleReports, null, 2));

    // Check if barangays have station_id
    const [barangayCheck] = await db.query(
      `SELECT 
        barangay_id,
        barangay_name,
        station_id,
        latitude,
        longitude
       FROM barangays
       LIMIT 10`
    );

    console.log("🗺️  Sample barangays:");
    console.log(JSON.stringify(barangayCheck, null, 2));

    // Count reports with valid location data
    const [validLocations] = await db.query(
      `SELECT COUNT(*) as count FROM reports r
       LEFT JOIN locations l ON r.location_id = l.location_id
       WHERE r.station_id IS NULL
       AND r.location_id IS NOT NULL
       AND l.latitude IS NOT NULL
       AND l.longitude IS NOT NULL`
    );

    console.log(`✅ Reports with valid location data: ${validLocations[0].count}`);

    // Count reports with NULL location_id
    const [nullLocations] = await db.query(
      `SELECT COUNT(*) as count FROM reports
       WHERE station_id IS NULL
       AND location_id IS NULL`
    );

    console.log(`❌ Reports with NULL location_id: ${nullLocations[0].count}`);

    res.json({
      success: true,
      sample_reports: sampleReports,
      sample_barangays: barangayCheck,
      stats: {
        reports_with_valid_location: validLocations[0].count,
        reports_with_null_location: nullLocations[0].count
      }
    });
  } catch (error) {
    console.error("❌ Debug failed:", error);
    res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message
    });
  }
}

/**
 * Manually assign all unassigned reports to a default station
 */
async function forceAssignReportsToStation(req, res) {
  const connection = await db.getConnection();
  
  try {
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: "stationId is required in body"
      });
    }

    console.log(`🔧 Force-assigning all unassigned reports to station ${stationId}...`);

    // Get all reports without station_id
    const [reportsToFix] = await connection.query(
      `SELECT report_id FROM reports WHERE station_id IS NULL`
    );

    console.log(`📋 Found ${reportsToFix.length} reports without station`);

    // Update all in one query
    const [result] = await connection.query(
      `UPDATE reports SET station_id = ? WHERE station_id IS NULL`,
      [stationId]
    );

    console.log(`✅ Updated ${result.affectedRows} reports`);

    res.json({
      success: true,
      message: `Assigned ${result.affectedRows} reports to station ${stationId}`,
      stats: {
        updated: result.affectedRows
      }
    });
  } catch (error) {
    console.error("❌ Force assignment failed:", error);
    res.status(500).json({
      success: false,
      message: "Force assignment failed",
      error: error.message
    });
  } finally {
    connection.release();
  }
}

/**
 * Force update user station assignment
 */
async function forceUpdateUserStation(req, res) {
  console.log("\n🔧🔧🔧 FORCE UPDATE USER STATION CALLED 🔧🔧🔧");
  console.log("Full request object keys:", Object.keys(req));
  console.log("Full body:", JSON.stringify(req.body));
  console.log("Content-Type:", req.headers['content-type']);
  
  const connection = await db.getConnection();
  
  try {
    const userId = req.body.userId || req.body.user_id;
    const stationId = req.body.stationId || req.body.station_id;
    
    console.log("🔧 Force update request received:");
    console.log("   Full Body:", req.body);
    console.log("   userId:", userId);
    console.log("   stationId:", stationId);

    if (!userId || !stationId) {
      return res.status(400).json({
        success: false,
        message: "userId and stationId are required",
        received: req.body
      });
    }

    console.log(`🔧 Force-updating user ${userId} station to ${stationId}...`);

    // Direct update with verification
    const [result] = await connection.query(
      `UPDATE users SET station_id = ? WHERE id = ?`,
      [stationId, userId]
    );

    console.log(`✅ Updated ${result.affectedRows} users`);

    // Verify the update
    const [verify] = await connection.query(
      `SELECT id, station_id FROM users WHERE id = ?`,
      [userId]
    );

    console.log(`✓ Verification:`, verify[0]);

    res.json({
      success: true,
      message: `Updated user ${userId} to station ${stationId}`,
      affected: result.affectedRows,
      verification: verify[0]
    });
  } catch (error) {
    console.error("❌ Force update failed:", error);
    res.status(500).json({
      success: false,
      message: "Force update failed",
      error: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  debugReportStructure,
  forceAssignReportsToStation,
  forceUpdateUserStation
};
