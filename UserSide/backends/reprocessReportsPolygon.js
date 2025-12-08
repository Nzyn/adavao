/**
 * Re-process all existing reports using polygon-based assignment
 * Reports outside polygons will be set to NULL (unassigned)
 */

const db = require('./db');

/**
 * Point-in-polygon algorithm (Ray Casting)
 */
function isPointInPolygon(lat, lon, polygon) {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // longitude
    const yi = polygon[i][1]; // latitude
    const xj = polygon[j][0]; // longitude
    const yj = polygon[j][1]; // latitude

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }

  return inside;
}

async function reprocessReports() {
  const connection = await db.getConnection();
  
  try {
    console.log('🔄 Starting polygon-based re-assignment of all reports...\n');

    // Get all barangays with boundary polygons
    const [barangays] = await connection.query(
      `SELECT barangay_id, barangay_name, station_id, boundary_polygon 
       FROM barangays 
       WHERE boundary_polygon IS NOT NULL`
    );

    console.log(`📍 Found ${barangays.length} barangays with polygon boundaries\n`);

    // Get all reports with coordinates (excluding cybercrime reports)
    const [reports] = await connection.query(
      `SELECT r.report_id, r.report_type, r.assigned_station_id, l.latitude, l.longitude
       FROM reports r
       LEFT JOIN locations l ON r.location_id = l.location_id
       WHERE l.latitude IS NOT NULL 
       AND l.longitude IS NOT NULL
       AND l.latitude != 0
       AND l.longitude != 0`
    );

    console.log(`📊 Processing ${reports.length} reports with valid coordinates...\n`);

    let assignedCount = 0;
    let unassignedCount = 0;
    let cybercrimeCount = 0;
    let keptAssignmentCount = 0;
    let changedAssignmentCount = 0;

    for (const report of reports) {
      // Check if it's a cybercrime report
      let reportTypes = [];
      try {
        reportTypes = JSON.parse(report.report_type);
      } catch {
        reportTypes = [report.report_type];
      }

      const isCybercrime = reportTypes.some(type => {
        const normalized = String(type).toLowerCase().trim();
        return normalized === 'cybercrime' || 
               normalized === 'cyber crime' ||
               normalized.startsWith('cybercrime -') ||
               normalized.startsWith('cyber crime -');
      });

      if (isCybercrime) {
        cybercrimeCount++;
        continue; // Skip cybercrime reports - they keep their assignment
      }

      // Check if point falls within any polygon
      let foundBarangay = null;
      
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

      const oldStationId = report.assigned_station_id;
      const newStationId = foundBarangay ? foundBarangay.station_id : null;

      // Update the report
      await connection.query(
        `UPDATE reports SET assigned_station_id = ? WHERE report_id = ?`,
        [newStationId, report.report_id]
      );

      if (newStationId) {
        assignedCount++;
        if (oldStationId === newStationId) {
          keptAssignmentCount++;
        } else {
          changedAssignmentCount++;
        }
      } else {
        unassignedCount++;
      }
    }

    console.log('\n✅ Re-processing complete!\n');
    console.log('RESULTS:');
    console.log('═══════════════════════════════════════');
    console.log(`Total Reports Processed: ${reports.length}`);
    console.log(`Cybercrime (skipped): ${cybercrimeCount}`);
    console.log(`\nAssigned to Stations: ${assignedCount}`);
    console.log(`  - Kept same station: ${keptAssignmentCount}`);
    console.log(`  - Changed station: ${changedAssignmentCount}`);
    console.log(`\nUnassigned (outside polygons): ${unassignedCount}`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Re-processing failed:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

reprocessReports();
