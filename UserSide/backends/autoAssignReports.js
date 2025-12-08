const db = require("./db");

/**
 * Auto-assign reports to police stations based on location
 * This assigns reports with NULL station_id to the nearest police station
 * based on their coordinates matching barangays
 */
async function autoAssignReports(req, res) {
  const connection = await db.getConnection();
  
  try {
    console.log("🔄 Starting auto-assignment of reports to stations...");

    // Count unassigned reports
    const [unassignedCount] = await connection.query(
      `SELECT COUNT(*) as count
       FROM reports r
       JOIN locations l ON r.location_id = l.location_id
       WHERE r.station_id IS NULL
         AND l.latitude IS NOT NULL
         AND l.longitude IS NOT NULL
         AND l.latitude != 0
         AND l.longitude != 0`
    );

    const totalUnassigned = unassignedCount[0].count;
    console.log(`📊 Found ${totalUnassigned} unassigned reports`);

    if (totalUnassigned === 0) {
      return res.json({
        success: true,
        message: "No unassigned reports found",
        data: {
          unassigned_before: 0,
          assigned: 0,
          still_unassigned: 0
        }
      });
    }

    // Update reports by finding nearest barangay with station_id
    const [updateResult] = await connection.query(
      `UPDATE reports r
       JOIN locations l ON r.location_id = l.location_id
       SET r.station_id = (
         SELECT b.station_id
         FROM barangays b
         WHERE b.station_id IS NOT NULL
           AND b.latitude IS NOT NULL
           AND b.longitude IS NOT NULL
         ORDER BY (
           6371 * acos(
             cos(radians(90 - b.latitude)) * cos(radians(90 - l.latitude)) +
             sin(radians(90 - b.latitude)) * sin(radians(90 - l.latitude)) * 
             cos(radians(b.longitude - l.longitude))
           )
         ) ASC
         LIMIT 1
       )
       WHERE r.station_id IS NULL
         AND l.latitude IS NOT NULL
         AND l.longitude IS NOT NULL
         AND l.latitude != 0
         AND l.longitude != 0`
    );

    const assignedCount = updateResult.affectedRows;
    console.log(`✅ Assigned ${assignedCount} reports to stations`);

    // Count remaining unassigned
    const [remainingCount] = await connection.query(
      `SELECT COUNT(*) as count
       FROM reports r
       JOIN locations l ON r.location_id = l.location_id
       WHERE r.station_id IS NULL
         AND l.latitude IS NOT NULL
         AND l.longitude IS NOT NULL`
    );

    const stillUnassigned = remainingCount[0].count;

    // Get assignment summary
    const [summary] = await connection.query(
      `SELECT 
         ps.station_id,
         ps.station_name,
         COUNT(r.report_id) as report_count
       FROM reports r
       JOIN police_stations ps ON r.station_id = ps.station_id
       GROUP BY ps.station_id, ps.station_name
       ORDER BY ps.station_id`
    );

    console.log("📈 Assignment Summary:");
    summary.forEach(s => {
      console.log(`   ${s.station_name}: ${s.report_count} reports`);
    });

    res.json({
      success: true,
      message: `Successfully assigned ${assignedCount} reports to stations`,
      data: {
        unassigned_before: totalUnassigned,
        assigned: assignedCount,
        still_unassigned: stillUnassigned,
        summary: summary
      }
    });

  } catch (error) {
    console.error("❌ Error auto-assigning reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to auto-assign reports",
      error: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  autoAssignReports
};
