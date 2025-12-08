/**
 * Assign Existing Reports to Police Stations
 * 
 * This script processes all existing reports and assigns them to the correct
 * police station based on their GPS coordinates and barangay polygon boundaries.
 */

const db = require("./db");

// Point-in-polygon algorithm (Ray Casting)
function isPointInPolygon(lat, lon, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lon) !== (yj > lon)) &&
      (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

async function assignExistingReports() {
  console.log("\n🔄 ASSIGNING EXISTING REPORTS TO POLICE STATIONS");
  console.log("=" .repeat(70));
  
  try {
    // Get all reports that need assignment (both NULL and existing assignments will be processed)
    const [reports] = await db.query(`
      SELECT 
        r.report_id,
        r.title,
        r.report_type,
        r.assigned_station_id as current_station_id,
        l.latitude,
        l.longitude,
        l.barangay
      FROM reports r
      LEFT JOIN locations l ON r.location_id = l.location_id
      WHERE r.location_id IS NOT NULL
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
        AND l.latitude != 0
        AND l.longitude != 0
      ORDER BY r.created_at ASC
    `);

    console.log(`\n📊 Found ${reports.length} reports with valid coordinates\n`);

    // Get Cybercrime Division station
    const [cybercrimeStation] = await db.query(
      `SELECT station_id FROM police_stations WHERE station_name = 'Cybercrime Division' LIMIT 1`
    );
    const cybercrimeStationId = cybercrimeStation.length > 0 ? cybercrimeStation[0].station_id : null;

    // Get all barangays with station assignments (polygon or not)
    const [barangays] = await db.query(`
      SELECT barangay_id, barangay_name, station_id, boundary_polygon 
      FROM barangays 
      WHERE station_id IS NOT NULL
    `);

    console.log(`📍 Loaded ${barangays.length} barangays with station assignments\n`);
    
    // Count how many have polygons
    const withPolygons = barangays.filter(b => b.boundary_polygon !== null).length;
    console.log(`   ${withPolygons} barangays have polygon boundaries`);
    console.log(`   ${barangays.length - withPolygons} barangays will use name matching\n`);

    // Statistics
    let assigned = 0;
    let reassigned = 0;
    let unassigned = 0;
    let cybercrime = 0;
    let errors = 0;

    // Process each report
    for (const report of reports) {
      try {
        let newStationId = null;

        // Check if it's a cybercrime report
        let reportTypes = [];
        try {
          reportTypes = typeof report.report_type === 'string' 
            ? JSON.parse(report.report_type) 
            : report.report_type;
        } catch (e) {
          reportTypes = [report.report_type];
        }

        const isCybercrime = reportTypes.some(crime => {
          const normalized = crime.toLowerCase().trim();
          return normalized === 'cybercrime' || 
                 normalized === 'cyber crime' ||
                 normalized.startsWith('cybercrime -') ||
                 normalized.startsWith('cyber crime -');
        });

        if (isCybercrime && cybercrimeStationId) {
          // Assign to Cybercrime Division
          newStationId = cybercrimeStationId;
          cybercrime++;
          console.log(`🔐 Report #${report.report_id}: Cybercrime → Station ${newStationId}`);
        } else {
          // Use point-in-polygon to find the correct station OR name matching as fallback
          let foundBarangay = null;

          // First try polygon matching
          for (const barangay of barangays) {
            if (barangay.boundary_polygon) {
              try {
                const polygon = JSON.parse(barangay.boundary_polygon);
                if (polygon && polygon.coordinates && polygon.coordinates[0]) {
                  if (isPointInPolygon(report.latitude, report.longitude, polygon.coordinates[0])) {
                    foundBarangay = barangay;
                    break;
                  }
                }
              } catch (parseError) {
                // Skip invalid polygons
              }
            }
          }
          
          // Fallback: Try name matching if no polygon match
          if (!foundBarangay && report.barangay) {
            const reportBarangayName = report.barangay.trim().toUpperCase();
            foundBarangay = barangays.find(b => {
              const barangayName = b.barangay_name.trim().toUpperCase();
              // Try exact match or contains match
              return barangayName === reportBarangayName || 
                     barangayName.includes(reportBarangayName) ||
                     reportBarangayName.includes(barangayName);
            });
            
            if (foundBarangay) {
              console.log(`📌 Report #${report.report_id}: Matched by name "${report.barangay}" → ${foundBarangay.barangay_name} (Station ${foundBarangay.station_id})`);
            }
          }

          if (foundBarangay && foundBarangay.station_id) {
            newStationId = foundBarangay.station_id;
            if (!report.barangay || foundBarangay.barangay_name !== report.barangay) {
              console.log(`📍 Report #${report.report_id}: ${foundBarangay.barangay_name} → Station ${newStationId}`);
            }
          } else {
            console.log(`⚠️  Report #${report.report_id}: Outside all polygons → UNASSIGNED`);
            unassigned++;
          }
        }

        // Update the report if station changed
        if (newStationId !== report.current_station_id) {
          await db.query(
            `UPDATE reports SET assigned_station_id = ? WHERE report_id = ?`,
            [newStationId, report.report_id]
          );

          if (report.current_station_id === null) {
            assigned++;
          } else {
            reassigned++;
          }
        }

      } catch (reportError) {
        console.error(`❌ Error processing report #${report.report_id}:`, reportError.message);
        errors++;
      }
    }

    // Display summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 ASSIGNMENT SUMMARY");
    console.log("=".repeat(70));
    console.log(`Total Reports Processed: ${reports.length}`);
    console.log(`✅ Newly Assigned: ${assigned}`);
    console.log(`🔄 Reassigned: ${reassigned}`);
    console.log(`🔐 Cybercrime Cases: ${cybercrime}`);
    console.log(`⚠️  Unassigned (outside polygons): ${unassigned}`);
    console.log(`❌ Errors: ${errors}`);

    // Get final statistics
    console.log("\n" + "=".repeat(70));
    console.log("📈 FINAL REPORT DISTRIBUTION");
    console.log("=".repeat(70));

    const [stationStats] = await db.query(`
      SELECT 
        ps.station_id,
        ps.station_name,
        COUNT(r.report_id) as report_count
      FROM police_stations ps
      LEFT JOIN reports r ON r.assigned_station_id = ps.station_id
      GROUP BY ps.station_id, ps.station_name
      HAVING report_count > 0
      ORDER BY report_count DESC
    `);

    stationStats.forEach(stat => {
      console.log(`   ${stat.station_name}: ${stat.report_count} reports`);
    });

    const [unassignedCount] = await db.query(`
      SELECT COUNT(*) as count FROM reports WHERE assigned_station_id IS NULL
    `);
    console.log(`   UNASSIGNED: ${unassignedCount[0].count} reports`);

    console.log("\n✅ Assignment process complete!");
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    console.error("❌ Fatal error during assignment:", error);
  } finally {
    process.exit(0);
  }
}

// Run the assignment
assignExistingReports();
