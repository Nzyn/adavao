/**
 * Auto-assign barangays to police stations based on geographic proximity
 * Uses latitude/longitude to calculate distance and assign each barangay to nearest station
 * 
 * Run: node auto_assign_barangays_to_stations.js
 */

const db = require('./db');

// Haversine formula to calculate distance between two coordinates (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function autoAssignBarangaysToStations() {
  let connection;
  try {
    connection = await db.getConnection();
    
    console.log('🔍 Fetching all barangays with coordinates...');
    const [barangays] = await connection.query(
      `SELECT barangay_id, barangay_name, latitude, longitude 
       FROM barangays 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    
    console.log(`📍 Found ${barangays.length} barangays with coordinates`);

    console.log('🚔 Fetching all police stations with coordinates...');
    const [stations] = await connection.query(
      `SELECT station_id, station_name, latitude, longitude 
       FROM police_stations 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    
    console.log(`🚔 Found ${stations.length} police stations`);

    if (barangays.length === 0 || stations.length === 0) {
      console.error('❌ No barangays or stations with coordinates found!');
      return;
    }

    console.log('\n📊 Calculating assignments based on geographic proximity...\n');

    // For each barangay, find the nearest station
    const assignments = [];
    for (const barangay of barangays) {
      let nearestStation = null;
      let minDistance = Infinity;

      for (const station of stations) {
        const distance = calculateDistance(
          barangay.latitude,
          barangay.longitude,
          station.latitude,
          station.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = station;
        }
      }

      if (nearestStation) {
        assignments.push({
          barangay_id: barangay.barangay_id,
          barangay_name: barangay.barangay_name,
          station_id: nearestStation.station_id,
          station_name: nearestStation.station_name,
          distance_km: minDistance.toFixed(2),
        });

        console.log(
          `✅ ${barangay.barangay_name.padEnd(25)} → ${nearestStation.station_name.padEnd(20)} (${minDistance.toFixed(2)} km)`
        );
      }
    }

    console.log('\n📝 Updating barangays table...');

    let updated = 0;
    let failed = 0;

    for (const assignment of assignments) {
      try {
        await connection.query(
          `UPDATE barangays SET station_id = ? WHERE barangay_id = ?`,
          [assignment.station_id, assignment.barangay_id]
        );
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${assignment.barangay_name}:`, error.message);
        failed++;
      }
    }

    console.log(`\n✅ Updated: ${updated} barangays`);
    if (failed > 0) {
      console.log(`⚠️  Failed: ${failed} barangays`);
    }

    // Verify results
    console.log('\n📊 Verification...');
    const [verifyResult] = await connection.query(
      `SELECT COUNT(*) as assigned FROM barangays WHERE station_id IS NOT NULL`
    );
    console.log(`✅ Total barangays with stations: ${verifyResult[0].assigned}/${barangays.length}`);

    // Show summary by station
    console.log('\n📈 Summary by Station:');
    const [summary] = await connection.query(
      `SELECT 
        ps.station_id,
        ps.station_name,
        COUNT(b.barangay_id) as barangay_count,
        GROUP_CONCAT(b.barangay_name SEPARATOR ', ') as barangays
      FROM police_stations ps
      LEFT JOIN barangays b ON ps.station_id = b.station_id
      GROUP BY ps.station_id, ps.station_name
      ORDER BY ps.station_id`
    );

    for (const row of summary) {
      const count = row.barangay_count || 0;
      console.log(`  ${row.station_name.padEnd(20)} - ${count} barangay(s)`);
      if (row.barangays) {
        console.log(`    └─ ${row.barangays}`);
      }
    }

    console.log('\n✨ Auto-assignment complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

// Run the function
autoAssignBarangaysToStations();
