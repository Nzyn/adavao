// checkDatabase.js - Check and fix database schema
const db = require("./db");

async function checkAndFixDatabase() {
  console.log("\n🔍 Checking database schema...\n");
  
  try {
    // 1. Check if users table exists
    console.log("1️⃣ Checking if 'users' table exists...");
    const [tables] = await db.query("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log("❌ Users table does not exist!");
      console.log("Please create the users table first.");
      process.exit(1);
    }
    console.log("✅ Users table exists\n");
    
    // 2. Check current table structure
    console.log("2️⃣ Current table structure:");
    const [columns] = await db.query("DESCRIBE users");
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));
    
    // 3. Check if 'address' column exists
    const addressColumn = columns.find(col => col.Field === 'address');
    
    if (!addressColumn) {
      console.log("\n⚠️  'address' column is MISSING!");
      console.log("📝 Adding 'address' column to users table...");
      
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN address TEXT NULL AFTER contact
      `);
      
      console.log("✅ 'address' column added successfully!\n");
      
      // Show updated structure
      console.log("3️⃣ Updated table structure:");
      const [newColumns] = await db.query("DESCRIBE users");
      console.table(newColumns.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null
      })));
    } else {
      console.log("\n✅ 'address' column already exists!");
      console.log(`   Type: ${addressColumn.Type}`);
      console.log(`   Null: ${addressColumn.Null}\n`);
    }
    
    // 4. Check if there are any users
    console.log("4️⃣ Checking users in database...");
    const [users] = await db.query("SELECT id, firstname, lastname, email, contact, address FROM users LIMIT 5");
    
    if (users.length === 0) {
      console.log("⚠️  No users found in database");
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      console.table(users.map(user => ({
        ID: user.id,
        Name: `${user.firstname} ${user.lastname}`,
        Email: user.email,
        Contact: user.contact || 'N/A',
        Address: user.address || 'N/A'
      })));
    }
    
    // 5. Test update capability
    console.log("\n5️⃣ Testing address update capability...");
    const [testUsers] = await db.query("SELECT id FROM users LIMIT 1");
    
    if (testUsers.length > 0) {
      const testUserId = testUsers[0].id;
      const testAddress = "Test Address - " + new Date().toISOString();
      
      console.log(`   Testing update on user ID: ${testUserId}`);
      await db.query(
        "UPDATE users SET address = ? WHERE id = ?",
        [testAddress, testUserId]
      );
      
      const [updated] = await db.query(
        "SELECT address FROM users WHERE id = ?",
        [testUserId]
      );
      
      if (updated[0].address === testAddress) {
        console.log("✅ Address update test PASSED!");
        console.log(`   Successfully wrote: "${testAddress}"`);
      } else {
        console.log("❌ Address update test FAILED!");
      }
    }
    
    console.log("\n✅ Database check complete!\n");
    console.log("📋 Summary:");
    console.log("  ✓ Users table exists");
    console.log("  ✓ Address column exists");
    console.log("  ✓ Address column is writable");
    console.log("\n🚀 You can now run the server: node server.js\n");
    
  } catch (error) {
    console.error("\n❌ Error checking database:", error);
    console.error("\nDetails:", error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkAndFixDatabase();
