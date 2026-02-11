// Diagnostic script to check database issues
const db = require("./db");

async function diagnose() {
  console.log("🔍 Diagnosing database issues...\n");
  
  try {
    // 1. Check police_stations table
    console.log("1️⃣ Checking police_stations table...");
    const [stations] = await db.query("SELECT station_id, station_name, latitude, longitude FROM police_stations LIMIT 5");
    console.log(`   Found ${stations.length} stations`);
    if (stations.length > 0) {
      console.log("   Sample station:", stations[0]);
      const stationsWithCoords = stations.filter(s => s.latitude && s.longitude);
      console.log(`   Stations with coordinates: ${stationsWithCoords.length}/${stations.length}`);
    }
    console.log("");

    // 2. Check reports table
    console.log("2️⃣ Checking reports table for user 10...");
    const [reports] = await db.query(`
      SELECT r.report_id, r.title, r.status, l.latitude, l.longitude, l.barangay
      FROM reports r
      LEFT JOIN locations l ON r.location_id = l.location_id
      WHERE r.user_id = 10
      LIMIT 5
    `);
    console.log(`   Found ${reports.length} reports`);
    if (reports.length > 0) {
      console.log("   Sample report:", reports[0]);
    }
    console.log("");

    // 3. Check messages table
    console.log("3️⃣ Checking messages table for user 10...");
    const [messages] = await db.query(`
      SELECT message_id, sender_id, receiver_id, message, status, sent_at
      FROM messages
      WHERE sender_id = 10 OR receiver_id = 10
      LIMIT 5
    `);
    console.log(`   Found ${messages.length} messages`);
    if (messages.length > 0) {
      console.log("   Sample message:", messages[0]);
    }
    console.log("");

    // 4. Check users table
    console.log("4️⃣ Checking users table for user 10...");
    const [users] = await db.query(`
      SELECT id, firstname, lastname, email, contact, role, is_verified
      FROM users
      WHERE id = 10
    `);
    console.log(`   Found ${users.length} users`);
    if (users.length > 0) {
      console.log("   User data:", users[0]);
    }
    console.log("");

    // 5. Check locations table
    console.log("5️⃣ Checking locations table...");
    const [locations] = await db.query(`
      SELECT location_id, barangay, latitude, longitude
      FROM locations
      WHERE latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0
      LIMIT 5
    `);
    console.log(`   Found ${locations.length} locations with missing/invalid coordinates`);
    if (locations.length > 0) {
      console.log("   Sample invalid location:", locations[0]);
    }
    console.log("");

    // 6. Check report_media table
    console.log("6️⃣ Checking report_media table...");
    const [media] = await db.query(`
      SELECT rm.media_id, rm.report_id, rm.media_url, rm.media_type
      FROM report_media rm
      INNER JOIN reports r ON rm.report_id = r.report_id
      WHERE r.user_id = 10
      LIMIT 5
    `);
    console.log(`   Found ${media.length} media files for user 10's reports`);
    if (media.length > 0) {
      console.log("   Sample media:", media[0]);
    }
    console.log("");

    // 7. Test getUserConversations query
    console.log("7️⃣ Testing getUserConversations query for user 10...");
    const userId = 10;
    const [allMessagePartners] = await db.query(`
      SELECT DISTINCT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `, [userId, userId, userId]);
    console.log(`   Found ${allMessagePartners.length} conversation partners`);
    if (allMessagePartners.length > 0) {
      console.log("   Partners:", allMessagePartners.map(p => p.other_user_id).join(', '));
    }
    console.log("");

    console.log("✅ Diagnostic complete!");
    
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  } finally {
    process.exit(0);
  }
}

diagnose();
