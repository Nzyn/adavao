/**
 * Diagnostics handler - for debugging police report assignment issues
 */

const db = require("./db");

/**
 * Check police officer assignment and reports
 */
async function checkPoliceOfficerSetup(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    console.log(`🔍 Checking setup for user ${userId}...`);

    // 1. Check user's station assignment
    const [userRows] = await db.query(
      `SELECT id, firstname, lastname, email, role, station_id FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = userRows[0];
    console.log(`👤 User found:`, user);

    // 2. Check station details
    const [stationRows] = await db.query(
      `SELECT station_id, station_name FROM police_stations WHERE station_id = ?`,
      [user.station_id]
    );

    const station = stationRows.length > 0 ? stationRows[0] : null;
    console.log(`🚔 Station:`, station);

    // 3. Check Cybercrime Division station
    const [cybercrimeRows] = await db.query(
      `SELECT station_id, station_name FROM police_stations WHERE station_name LIKE '%Cybercrime%'`
    );

    console.log(`🔐 Cybercrime stations:`, cybercrimeRows);

    // 4. Count reports for this user's station
    let reportCount = 0;
    if (user.station_id) {
      const [reportRows] = await db.query(
        `SELECT COUNT(*) as count FROM reports WHERE station_id = ?`,
        [user.station_id]
      );
      reportCount = reportRows[0]?.count || 0;
    }

    console.log(`📊 Reports for station ${user.station_id}: ${reportCount}`);

    // 5. Check all stations and their report counts
    const [allStationsRows] = await db.query(
      `SELECT ps.station_id, ps.station_name, COUNT(r.report_id) as report_count
       FROM police_stations ps
       LEFT JOIN reports r ON ps.station_id = r.station_id
       GROUP BY ps.station_id, ps.station_name
       ORDER BY report_count DESC`
    );

    console.log(`📈 All stations with report counts:`, allStationsRows);

    res.json({
      success: true,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        station_id: user.station_id
      },
      assigned_station: station,
      all_stations: allStationsRows,
      reports_for_user_station: reportCount,
      cybercrime_stations: cybercrimeRows
    });
  } catch (error) {
    console.error("❌ Diagnostic check failed:", error);
    res.status(500).json({
      success: false,
      message: "Diagnostic check failed",
      error: error.message
    });
  }
}

/**
 * List all reports with station assignment
 */
async function listAllReportsWithStations(req, res) {
  try {
    console.log(`📋 Listing all reports with station assignment...`);

    const [reports] = await db.query(
      `SELECT 
        r.report_id,
        r.title,
        r.report_type,
        r.status,
        r.station_id,
        ps.station_name,
        u.firstname,
        u.lastname,
        r.created_at
       FROM reports r
       LEFT JOIN police_stations ps ON r.station_id = ps.station_id
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC
       LIMIT 50`
    );

    // Parse report_type from JSON string to array
    const formattedReports = reports.map((report) => {
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

    console.log(`✅ Found ${reports.length} reports`);

    res.json({
      success: true,
      count: reports.length,
      reports: formattedReports
    });
  } catch (error) {
    console.error("❌ Failed to list reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list reports",
      error: error.message
    });
  }
}

/**
 * Check if user is police and get their station
 */
async function debugUserStation(req, res) {
  try {
    const { userId } = req.params;

    const [users] = await db.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, u.station_id,
              ps.station_id as ps_station_id, ps.station_name
       FROM users u
       LEFT JOIN police_stations ps ON u.station_id = ps.station_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];
    
    res.json({
      success: true,
      debug_info: {
        user_id: user.id,
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role,
        station_id_in_users_table: user.station_id,
        station_name: user.station_name,
        station_found: !!user.ps_station_id,
        query_result: user
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

module.exports = {
  checkPoliceOfficerSetup,
  listAllReportsWithStations,
  debugUserStation
};
