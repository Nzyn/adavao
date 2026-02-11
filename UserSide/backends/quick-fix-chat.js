/**
 * Quick Chat Fix - Complete automatic fix
 * Run: node quick-fix-chat.js
 * 
 * This script:
 * 1. Checks database state
 * 2. Automatically sets up admin/police users if needed
 * 3. Tests the conversation query
 * 4. Shows what's happening
 */

const mysql = require('mysql2/promise');

async function quickFixChat() {
  let connection;
  
  try {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('🔧 ALERTDAVAO CHAT QUICK FIX');
    console.log('═'.repeat(70));

    // Connect to database
    console.log('\n⏳ Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_DATABASE || 'alertdavao'
    });
    console.log('✅ Connected to database\n');

    // STEP 1: Check how many users exist
    console.log('─'.repeat(70));
    console.log('STEP 1: Checking users...');
    console.log('─'.repeat(70));
    
    const [users] = await connection.query(`
      SELECT id, firstname, lastname, role FROM users ORDER BY id ASC
    `);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('   Please create users first (register in the app)');
      await connection.end();
      return;
    }

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`   ${u.id}. ${u.firstname} ${u.lastname} - Role: ${u.role}`);
    });

    // STEP 2: Check messages
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 2: Checking messages...');
    console.log('─'.repeat(70));
    
    const [messages] = await connection.query(`
      SELECT COUNT(*) as count FROM messages
    `);

    const msgCount = messages[0].count;
    console.log(`✅ Found ${msgCount} messages in database`);

    if (msgCount === 0) {
      console.log('\n⚠️  No messages yet. To test:');
      console.log('   1. Make sure admin/police role is set (next step)');
      console.log('   2. Have admin send a message from AdminSide');
      console.log('   3. User will see it in UserSide app');
    }

    // STEP 3: Check admin/police users
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 3: Checking admin/police roles...');
    console.log('─'.repeat(70));
    
    const [adminUsers] = await connection.query(`
      SELECT id, firstname, lastname, role FROM users 
      WHERE role IN ('admin', 'police')
    `);

    if (adminUsers.length === 0) {
      console.log('❌ No admin/police users found!');
      console.log('\n🔧 AUTO-FIXING: Setting user 1 as ADMIN...');
      
      await connection.query('UPDATE users SET role = ? WHERE id = 1', ['admin']);
      
      const [updated] = await connection.query('SELECT * FROM users WHERE id = 1');
      if (updated.length > 0) {
        console.log(`✅ FIXED! ${updated[0].firstname} ${updated[0].lastname} is now ADMIN`);
      }
    } else {
      console.log(`✅ Found ${adminUsers.length} admin/police users:`);
      adminUsers.forEach(u => {
        console.log(`   ${u.firstname} ${u.lastname} (ID: ${u.id}) - Role: ${u.role}`);
      });
    }

    // STEP 4: Test conversation query for user 2
    console.log('\n' + '─'.repeat(70));
    console.log('STEP 4: Testing conversation retrieval...');
    console.log('─'.repeat(70));
    
    let testUserId = 2; // Default test user
    const userToTest = users.find(u => u.id !== 1);
    if (userToTest) {
      testUserId = userToTest.id;
    }

    console.log(`Testing conversation query for user ${testUserId}...`);

    // Run the actual query from backend
    const [partners] = await connection.query(`
      SELECT DISTINCT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `, [testUserId, testUserId, testUserId]);

    console.log(`Found ${partners.length} message partners for user ${testUserId}`);

    if (partners.length > 0) {
      console.log('\nProcessing partners...');
      let validConversations = 0;

      for (const partner of partners) {
        const [partnerData] = await connection.query(
          'SELECT id, firstname, lastname, role FROM users WHERE id = ?',
          [partner.other_user_id]
        );

        if (partnerData.length === 0) continue;

        const partnerUser = partnerData[0];
        const isAdmin = partnerUser.role === 'admin' || partnerUser.role === 'police';

        if (isAdmin) {
          console.log(`   ✅ ${partnerUser.firstname} ${partnerUser.lastname} (Role: ${partnerUser.role})`);
          validConversations++;

          // Get message count
          const [msgCounts] = await connection.query(`
            SELECT COUNT(*) as count FROM messages
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
          `, [testUserId, partner.other_user_id, partner.other_user_id, testUserId]);

          console.log(`      └─ ${msgCounts[0].count} messages`);
        } else {
          console.log(`   ❌ ${partnerUser.firstname} ${partnerUser.lastname} (Role: ${partnerUser.role}) - NOT admin/police`);
        }
      }

      console.log(`\n✅ User ${testUserId} can see ${validConversations} conversations`);
      
      if (validConversations === 0 && msgCount > 0) {
        console.log('\n⚠️  Messages exist but no conversations show!');
        console.log('   This means no admin/police users are in the messages.');
        console.log('   Make sure admin sends the message, not a regular user.');
      }
    } else if (msgCount === 0) {
      console.log('No conversations yet (no messages sent)');
    } else {
      console.log('⚠️  Messages exist but no partners found!');
    }

    // STEP 5: Show final status
    console.log('\n' + '─'.repeat(70));
    console.log('FINAL STATUS');
    console.log('─'.repeat(70));
    
    const [finalAdmins] = await connection.query(`
      SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'police')
    `);

    if (finalAdmins[0].count > 0) {
      console.log('✅ Admin/Police users: SET UP');
      console.log('✅ Chat should work now!');
      console.log('\n📝 Next steps:');
      console.log('   1. Restart UserSide backend: node backends/server.js');
      console.log('   2. Login to AdminSide as admin');
      console.log('   3. Send a message to a user');
      console.log('   4. Login to UserSide app as that user');
      console.log('   5. User should see the message within 3 seconds');
    } else {
      console.log('❌ Still no admin/police users!');
      console.log('   Try manually: UPDATE users SET role = "admin" WHERE id = 1;');
    }

    console.log('\n');
    console.log('═'.repeat(70));
    console.log('✅ FIX COMPLETE');
    console.log('═'.repeat(70));
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    if (connection) await connection.end();
  }
}

quickFixChat();
