/**
 * Check Specific User - Debug script
 * Usage: node check-user.js 10
 * (replace 10 with the user ID you want to check)
 */

const mysql = require('mysql2/promise');

async function checkUser() {
  const userId = process.argv[2] || 10;
  
  let connection;
  
  try {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log(`🔍 CHECKING USER ${userId}`);
    console.log('═'.repeat(70));

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_DATABASE || 'alertdavao'
    });

    // 1. Check if user exists
    console.log('\n1️⃣  USER DETAILS:');
    console.log('─'.repeat(70));
    
    const [userExists] = await connection.query(
      'SELECT id, firstname, lastname, role FROM users WHERE id = ?',
      [userId]
    );

    if (userExists.length === 0) {
      console.log(`❌ User ${userId} does not exist!`);
      await connection.end();
      return;
    }

    const user = userExists[0];
    console.log(`✅ User ${userId}: ${user.firstname} ${user.lastname}`);
    console.log(`   Role: ${user.role}`);

    // 2. Check messages
    console.log('\n2️⃣  MESSAGES FOR THIS USER:');
    console.log('─'.repeat(70));
    
    const [messages] = await connection.query(`
      SELECT m.message_id, m.sender_id, m.receiver_id, m.message, m.sent_at,
             s.firstname as sender_fname, s.lastname as sender_lname, s.role as sender_role,
             r.firstname as receiver_fname, r.lastname as receiver_lname, r.role as receiver_role
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.sent_at DESC
    `, [userId, userId]);

    console.log(`✅ Found ${messages.length} messages:\n`);
    
    if (messages.length === 0) {
      console.log('   ❌ No messages! User hasn\'t received or sent any messages yet.');
      console.log('\n   💡 To test:');
      console.log('   1. Have admin send a message to this user');
      console.log('   2. Come back and run this script again');
    } else {
      messages.forEach((msg, i) => {
        console.log(`   Message ${i + 1}:`);
        console.log(`     From: ${msg.sender_fname} ${msg.sender_lname} (ID: ${msg.sender_id}, Role: ${msg.sender_role})`);
        console.log(`     To: ${msg.receiver_fname} ${msg.receiver_lname} (ID: ${msg.receiver_id}, Role: ${msg.receiver_role})`);
        console.log(`     Content: "${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}"`);
        console.log(`     Sent: ${msg.sent_at}\n`);
      });
    }

    // 3. Check message partners
    console.log('3️⃣  MESSAGE PARTNERS:');
    console.log('─'.repeat(70));
    
    const [partners] = await connection.query(`
      SELECT DISTINCT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `, [userId, userId, userId]);

    if (partners.length === 0) {
      console.log('   No partners (no messages)');
    } else {
      console.log(`   ✅ Found ${partners.length} partner(s):\n`);
      
      for (const partner of partners) {
        const [partnerData] = await connection.query(
          'SELECT firstname, lastname, role FROM users WHERE id = ?',
          [partner.partner_id]
        );

        if (partnerData.length > 0) {
          const p = partnerData[0];
          const isAdmin = p.role === 'admin' || p.role === 'police';
          const emoji = isAdmin ? '✅' : '❌';
          
          console.log(`   ${emoji} Partner ID ${partner.partner_id}: ${p.firstname} ${p.lastname} (Role: ${p.role})`);

          if (!isAdmin) {
            console.log(`      ⚠️  NOT admin/police! Conversation will be SKIPPED`);
            console.log(`      💡 Fix: UPDATE users SET role = 'admin' WHERE id = ${partner.partner_id};`);
          }
        }
      }
    }

    // 4. Simulate backend query
    console.log('\n4️⃣  SIMULATE BACKEND QUERY:');
    console.log('─'.repeat(70));

    // Check if admin/police exist
    const [adminCheck] = await connection.query(`
      SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'police')
    `);
    const hasAdminPolice = adminCheck[0].count > 0;

    console.log(`   Admin/Police users in system: ${hasAdminPolice ? 'YES ✅' : 'NONE ❌'}`);

    if (messages.length > 0 && partners.length > 0) {
      let visibleConversations = 0;
      
      for (const partner of partners) {
        const [partnerData] = await connection.query(
          'SELECT role FROM users WHERE id = ?',
          [partner.partner_id]
        );

        if (partnerData.length > 0) {
          const isAdmin = partnerData[0].role === 'admin' || partnerData[0].role === 'police';
          
          if (!hasAdminPolice || isAdmin) {
            visibleConversations++;
          }
        }
      }

      console.log(`   Visible conversations: ${visibleConversations}/${partners.length}`);
      
      if (visibleConversations === 0 && messages.length > 0) {
        console.log(`\n   ❌ PROBLEM FOUND!`);
        console.log(`   - Messages exist but all conversations are filtered out`);
        console.log(`   - Reason: All message partners are regular users, not admin/police`);
        console.log(`\n   🔧 SOLUTIONS:`);
        
        for (const partner of partners) {
          console.log(`   1. UPDATE users SET role = 'admin' WHERE id = ${partner.partner_id};`);
        }
      } else if (visibleConversations > 0) {
        console.log(`\n   ✅ Backend should return ${visibleConversations} conversation(s)`);
      }
    }

    // 5. Check backend logs indicator
    console.log('\n5️⃣  BACKEND STATUS:');
    console.log('─'.repeat(70));
    console.log('   Check your backend console (where server.js is running)');
    console.log('   Look for lines like:');
    console.log('   📨 Fetching conversations for user: 10');
    console.log('   📨 Found X message partners');
    console.log('   ✅ Found Y valid conversations');
    console.log('\n   If it says "Found 0 message partners" → No messages for this user');
    console.log('   If it says "Found 0 valid conversations" → Messages exist but filtered out');

    console.log('\n');
    console.log('═'.repeat(70));
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('═'.repeat(70));
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) await connection.end();
  }
}

checkUser();
