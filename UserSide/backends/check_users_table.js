const db = require("./db");

async function checkUsersTable() {
  try {
    console.log("📋 Checking users table structure...\n");

    const [columns] = await db.query("DESCRIBE users");
    console.log("Users table columns:");
    columns.forEach((col) => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULLABLE' : 'NOT NULL'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkUsersTable();
