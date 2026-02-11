const db = require("./db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  try {
    console.log("🔄 Starting migration: Creating notification_reads table...\n");

    // Read the SQL file
    const sqlFile = path.join(__dirname, "migrations", "create_notification_reads_table.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    console.log("📄 SQL to execute:");
    console.log(sql);
    console.log("\n" + "=".repeat(60) + "\n");

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Found ${statements.length} SQL statement(s) to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const result = await db.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
        console.log(`   Result:`, result);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        throw error;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration completed successfully!");
    console.log("=".repeat(60) + "\n");

    // Verify table was created
    console.log("🔍 Verifying table creation...\n");
    const [rows] = await db.query("DESCRIBE notification_reads");
    console.log("✅ Table structure:");
    console.log(rows);

    console.log("\n🎉 All done! The notification_reads table is ready to use.\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
