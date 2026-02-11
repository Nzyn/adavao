// checkFlags.js - Diagnose flag notification system
const db = require("./db");

async function diagnoseFlagSystem() {
  console.log("\n🔍 Diagnosing Flag Notification System\n");
  
  try {
    // 1. Check if user_flags table exists
    console.log("1️⃣  Checking if 'user_flags' table exists...");
    try {
      const [tables] = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_flags'");
      if (tables.length === 0) {
        console.log("❌ user_flags table does NOT exist!");
      } else {
        console.log("✅ user_flags table EXISTS\n");
        
        // Show table structure
        console.log("2️⃣  Table structure:");
        const [columns] = await db.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'user_flags' ORDER BY ordinal_position");
        console.table(columns.map(col => ({
          Field: col.Field,
          Type: col.Type,
          Null: col.Null,
          Key: col.Key,
          Default: col.Default
        })));
      }
    } catch (error) {
      console.log("❌ Error checking user_flags table:", error.message);
    }
    
    // 2. Check if flag_types table exists
    console.log("\n3️⃣  Checking if 'flag_types' table exists...");
    try {
      const [tables] = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flag_types'");
      if (tables.length === 0) {
        console.log("❌ flag_types table does NOT exist!");
      } else {
        console.log("✅ flag_types table EXISTS\n");
        
        // Show flag types
        const [flagTypes] = await db.query("SELECT * FROM flag_types LIMIT 5");
        console.log("Flag types in database:");
        console.table(flagTypes);
      }
    } catch (error) {
      console.log("❌ Error checking flag_types table:", error.message);
    }
    
    // 3. Check if any flags exist
    console.log("\n4️⃣  Checking for existing flags in database...");
    try {
      const [flags] = await db.query(`
        SELECT 
          uf.flag_id,
          uf.user_id,
          uf.status,
          uf.created_at,
          u.email,
          u.firstname
        FROM user_flags uf
        LEFT JOIN users u ON u.id = uf.user_id
        ORDER BY uf.created_at DESC
        LIMIT 10
      `);
      
      if (flags.length === 0) {
        console.log("⚠️  No flags found in database");
      } else {
        console.log(`✅ Found ${flags.length} flag(s):\n`);
        console.table(flags);
      }
    } catch (error) {
      console.log("❌ Error checking flags:", error.message);
    }
    
    // 4. Test the query that handleNotifications.js uses
    console.log("\n5️⃣  Testing notification query...");
    try {
      // First, get a user ID with flags
      const [flagsCheck] = await db.query(`
        SELECT DISTINCT user_id FROM user_flags LIMIT 1
      `);
      
      if (flagsCheck.length > 0) {
        const testUserId = flagsCheck[0].user_id;
        console.log(`Testing query for user ID: ${testUserId}\n`);
        
        try {
          const [notifications] = await db.query(`
            SELECT 
              uf.id as flag_id,
              uf.user_id,
              uf.violation_type,
              uf.reason,
              uf.created_at as flagged_at,
              uf.status
            FROM user_flags uf
            WHERE uf.user_id = ? 
            AND uf.status IN ('pending', 'confirmed')
            ORDER BY uf.created_at DESC 
            LIMIT 10
          `, [testUserId]);
          
          if (notifications.length === 0) {
            console.log("⚠️  Query returned 0 results for this user");
          } else {
            console.log(`✅ Query returned ${notifications.length} notification(s):\n`);
            console.table(notifications);
          }
        } catch (error) {
          console.log("❌ Error running test query:", error.message);
        }
      } else {
        console.log("⚠️  No users with flags found to test query");
      }
    } catch (error) {
      console.log("❌ Error checking for test users:", error.message);
    }
    
    // 5. Test the full endpoint
    console.log("\n6️⃣  Testing /notifications endpoint simulation...");
    try {
      // Get a user with flags
      const [flagsCheck] = await db.query(`
        SELECT DISTINCT user_id FROM user_flags LIMIT 1
      `);
      
      if (flagsCheck.length > 0) {
        const testUserId = flagsCheck[0].user_id;
        
        try {
          // Simulate what handleNotifications.js does
          const notifications = [];
          
          // Check user flags
          const [userFlags] = await db.query(`
            SELECT 
              uf.id as flag_id,
              uf.user_id,
              uf.violation_type,
              uf.reason,
              uf.created_at as flagged_at,
              uf.status
            FROM user_flags uf
            WHERE uf.user_id = ? 
            AND uf.status IN ('pending', 'confirmed')
            ORDER BY uf.created_at DESC 
            LIMIT 10
          `, [testUserId]);
          
          userFlags.forEach((flag) => {
            // Format violation type
            const formattedViolationType = flag.violation_type
              ? flag.violation_type.replace(/_/g, ' ').toUpperCase()
              : 'Account Flagged';
            
            notifications.push({
              id: `flag_${flag.flag_id}`,
              title: "Account Flagged",
              message: `Your account has been flagged for: ${formattedViolationType}${flag.reason ? ' - ' + flag.reason : ''}`,
              timestamp: flag.flagged_at,
              read: false,
              type: 'user_flagged',
              data: {
                flag_id: flag.flag_id,
                violation_type: formattedViolationType,
                reason: flag.reason,
                total_flags: 1,
                restriction_applied: 'flagged'
              }
            });
          });
          
          console.log(`✅ Endpoint would return:\n`);
          console.log(JSON.stringify({ success: true, data: notifications }, null, 2));
          
        } catch (error) {
          console.log("❌ Error simulating endpoint:", error.message);
        }
      } else {
        console.log("⚠️  No users with flags found");
      }
    } catch (error) {
      console.log("❌ Error during endpoint simulation:", error.message);
    }
    
    // 6. Check users table for flag columns
    console.log("\n7️⃣  Checking users table for flag columns...");
    try {
      const [columns] = await db.query("DESCRIBE users");
      const flagColumns = ['flag_count', 'current_restriction_type', 'is_flagged', 'is_restricted'];
      const missingColumns = flagColumns.filter(col => 
        !columns.find(c => c.Field === col)
      );
      
      if (missingColumns.length === 0) {
        console.log("✅ All required columns exist in users table");
      } else {
        console.log("⚠️  Missing columns in users table:");
        missingColumns.forEach(col => console.log(`  - ${col}`));
      }
    } catch (error) {
      console.log("❌ Error checking users table:", error.message);
    }
    
    console.log("\n✅ Diagnosis complete!\n");
    
  } catch (error) {
    console.error("\n❌ Error during diagnosis:", error);
  } finally {
    process.exit(0);
  }
}

diagnoseFlagSystem();
