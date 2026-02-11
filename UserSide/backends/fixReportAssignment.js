/**
 * Fix report assignment - assign station_id to reports that don't have one
 */

const db = require("./db");

/**
 * Check report assignment status
 */
async function checkReportAssignment(req, res) {
  try {
    console.log("📊 Checking report assignment status...");

    // Count reports with NULL assigned_station_id
    const [nullStationReports] = await db.query(
      `SELECT COUNT(*) as count FROM reports WHERE assigned_station_id IS NULL`
    );

    // Count reports with assigned_station_id set
    const [withStationReports] = await db.query(
      `SELECT COUNT(*) as count FROM reports WHERE assigned_station_id IS NOT NULL`
    );

    // Get sample reports without assigned_station_id
    const [sampleReports] = await db.query(
      `SELECT report_id, title, report_type, user_id, created_at, assigned_station_id
       FROM reports
       WHERE assigned_station_id IS NULL
       LIMIT 10`
    );

    // Get Cybercrime Division station
    const [cybercrimeStation] = await db.query(
      `SELECT station_id, station_name FROM police_stations WHERE station_name LIKE '%Cybercrime%'`
    );

    console.log(`⚠️  Reports with NULL station_id: ${nullStationReports[0].count}`);
    console.log(`✅ Reports with station_id: ${withStationReports[0].count}`);
    console.log(`🔐 Cybercrime Division station:`, cybercrimeStation[0]);

    // Parse report_type for sample reports
    const formattedSampleReports = sampleReports.map((report) => {
      let parsedReportType;
      try {
        parsedReportType = typeof report.report_type === 'string' 
          ? JSON.parse(report.report_type) 
          : report.report_type;
      } catch (e) {
        parsedReportType = [report.report_type];
      }
      return {
        ...report,
        report_type: parsedReportType
      };
    });

    res.json({
      success: true,
      stats: {
        reports_without_station: nullStationReports[0].count,
        reports_with_station: withStationReports[0].count,
        total_reports: nullStationReports[0].count + withStationReports[0].count
      },
      cybercrime_station: cybercrimeStation[0],
      sample_reports_without_station: formattedSampleReports
    });
  } catch (error) {
    console.error("❌ Check failed:", error);
    res.status(500).json({
      success: false,
      message: "Check failed",
      error: error.message
    });
  }
}

/**
 * Auto-assign station_id to reports that don't have one
 */
async function autoAssignStationToReports(req, res) {
  const connection = await db.getConnection();
  
  try {
    console.log("🔧 Starting auto-assignment of stations to reports...");

    // Get Cybercrime Division station
    const [cybercrimeStation] = await connection.query(
      `SELECT station_id FROM police_stations WHERE station_name LIKE '%Cybercrime%'`
    );

    const cybercrimeStationId = cybercrimeStation.length > 0 ? cybercrimeStation[0].station_id : null;

    // Get all reports without assigned_station_id with location data
    const [reportsToFix] = await connection.query(
      `SELECT r.report_id, r.report_type, l.latitude, l.longitude
       FROM reports r
       LEFT JOIN locations l ON r.location_id = l.location_id
       WHERE r.assigned_station_id IS NULL`
    );

    console.log(`📋 Found ${reportsToFix.length} reports without station assignment`);

    if (reportsToFix.length === 0) {
      return res.json({
        success: true,
        message: "All reports are already assigned",
        updated_count: 0
      });
    }

    // Update reports
    let cybercrimCount = 0;
    let locationAssignedCount = 0;
    let unassignedCount = 0;

    for (const report of reportsToFix) {
      let stationId = null;

      // Check if it's a cybercrime report
      if (report.report_type) {
        const reportTypeStr = typeof report.report_type === 'string' 
          ? report.report_type 
          : JSON.stringify(report.report_type);
        
        const isCybercrime = reportTypeStr.toLowerCase().includes('cybercrime') ||
                            reportTypeStr.toLowerCase().includes('cyber crime') ||
                            reportTypeStr.toLowerCase().includes('online fraud') ||
                            reportTypeStr.toLowerCase().includes('hacking') ||
                            reportTypeStr.toLowerCase().includes('phishing') ||
                            reportTypeStr.toLowerCase().includes('identity theft') ||
                            reportTypeStr.toLowerCase().includes('ransomware');

        if (isCybercrime && cybercrimeStationId) {
          stationId = cybercrimeStationId;
          cybercrimCount++;
        }
      }

      // If not cybercrime, try location-based assignment
      if (!stationId && report.latitude && report.longitude) {
        try {
          // Find nearest barangay and get its station
          const [nearestStation] = await connection.query(
            `SELECT b.station_id FROM barangays b 
             WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
             ORDER BY (
               6371 * acos(
                 cos(radians(90 - b.latitude)) * cos(radians(90 - ?)) +
                 sin(radians(90 - b.latitude)) * sin(radians(90 - ?)) * cos(radians(b.longitude - ?))
               )
             ) ASC
             LIMIT 1`,
            [report.latitude, report.latitude, report.longitude]
          );

          if (nearestStation && nearestStation.length > 0) {
            stationId = nearestStation[0].station_id;
            locationAssignedCount++;
          }
        } catch (err) {
          console.log(`⚠️  Could not find nearest station for report ${report.report_id}`);
        }
      }

      // If we determined a station, update it
      if (stationId) {
        await connection.query(
          `UPDATE reports SET assigned_station_id = ? WHERE report_id = ?`,
          [stationId, report.report_id]
        );
      } else {
        unassignedCount++;
      }
    }

    console.log(`✅ Updated ${cybercrimCount} reports to Cybercrime Division`);
    console.log(`✅ Updated ${locationAssignedCount} reports via location-based assignment`);
    console.log(`⚠️  ${unassignedCount} reports could not be assigned`);

    res.json({
      success: true,
      message: "Auto-assignment complete",
      stats: {
        total_processed: reportsToFix.length,
        assigned_to_cybercrime: cybercrimCount,
        assigned_by_location: locationAssignedCount,
        not_assigned: unassignedCount
      }
    });
  } catch (error) {
    console.error("❌ Auto-assignment failed:", error);
    res.status(500).json({
      success: false,
      message: "Auto-assignment failed",
      error: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  checkReportAssignment,
  autoAssignStationToReports
};
