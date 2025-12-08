const db = require("./db");

async function testNotifications() {
  try {
    console.log("Testing notification queries...");
    
    // Test the report status update query
    console.log("\n--- Testing Report Status Updates for user ID 4 ---");
    const [updatedReports] = await db.query(
      `SELECT 
        r.report_id,
        r.title,
        r.status,
        r.updated_at
      FROM reports r
      WHERE r.user_id = ?
      AND r.status != 'pending'
      AND r.updated_at > r.created_at
      ORDER BY r.updated_at DESC
      LIMIT 10`,
      [4] // Test with user ID 4
    );
    
    console.log("Updated reports for user 4:", updatedReports);
    
    // Test with user ID 5
    console.log("\n--- Testing with user ID 5 ---");
    const [updatedReports2] = await db.query(
      `SELECT 
        r.report_id,
        r.title,
        r.status,
        r.updated_at
      FROM reports r
      WHERE r.user_id = ?
      AND r.status != 'pending'
      AND r.updated_at > r.created_at
      ORDER BY r.updated_at DESC
      LIMIT 10`,
      [5] // Test with user ID 5
    );
    
    console.log("Updated reports for user 5:", updatedReports2);
    
  } catch (error) {
    console.error("Error testing notifications:", error);
  } finally {
    process.exit(0);
  }
}

testNotifications();