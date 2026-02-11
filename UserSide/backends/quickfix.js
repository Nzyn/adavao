const db = require("./db");

async function updateUserStation() {
  try {
    console.log("🔧 Updating user 10 station_id to 40...");
    
    const [result] = await db.query(
      "UPDATE users SET station_id = ? WHERE id = ?",
      [40, 10]
    );
    
    console.log(`✅ Updated ${result.affectedRows} rows`);
    
    // Verify
    const [verify] = await db.query(
      "SELECT id, firstname, lastname, station_id FROM users WHERE id = ?",
      [10]
    );
    
    console.log("✓ Verification:", verify[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateUserStation();
