/**
 * Diagnostic Script - Check Message Database
 * Run: node diagnostic.js
 */

const mysql = require('mysql2/promise');

async function runDiagnostics() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_DATABASE || 'alertdavao'
    });

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('ALERTDAVAO MESSAGE DIAGNOSTIC REPORT');
    console.log('═'.repeat(60));

    // 1. Check users with admin/police role
    console.log('\n1️⃣  USERS WITH ADMIN/POLICE ROLES:');
    console.log('-'.repeat(60));
    const [adminPoliceUsers] = await connection.query(`
      SELECT id, firstname, lastname, email, role 
      FROM users 
      WHERE role IN ('admin', 'police')
      ORDER BY role DESC
    `);
    
    if (adminPoliceUsers.length === 0) {
      console.log('❌ NO ADMIN/POLICE USERS FOUND!');
    } else {
      console.log(`✅ Found ${adminPoliceUsers.length} admin/police users:`);
      adminPoliceUsers.forEach(u => {
        console.log(`   - ${u.firstname} ${u.lastname} (ID: ${u.id}, Role: ${u.role})`);
      });
    }

    // 2. Check regular users
    console.log('\n2️⃣  REGULAR USERS:');
    console.log('-'.repeat(60));
    const [regularUsers] = await connection.query(`
      SELECT id, firstname, lastname, email, role 
      FROM users 
      WHERE role = 'user'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (regularUsers.length === 0) {
      console.log('⚠️  No regular users found');
    } else {
      console.log(`✅ Found ${regularUsers.length} users (showing first 10):`);
      regularUsers.forEach(u => {
        console.log(`   - ${u.firstname} ${u.lastname} (ID: ${u.id})`);
      });
    }

    // 3. Check messages in database
    console.log('\n3️⃣  MESSAGES IN DATABASE:');
    console.log('-'.repeat(60));
    const [messageCount] = await connection.query(`
      SELECT COUNT(*) as total FROM messages
    `);
    console.log(`✅ Total messages: ${messageCount[0].total}`);

    if (messageCount[0].total > 0) {
      const [recentMessages] = await connection.query(`
        SELECT m.message_id, m.sender_id, m.receiver_id, m.message, m.sent_at,
               s.firstname as sender_fname, s.lastname as sender_lname, s.role as sender_role,
               r.firstname as receiver_fname, r.lastname as receiver_lname, r.role as receiver_role
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        ORDER BY m.sent_at DESC
        LIMIT 10
      `);
      
      console.log('\nRecent messages (showing 10 most recent):');
      recentMessages.forEach(msg => {
        console.log(`\n  Message ID: ${msg.message_id}`);
        console.log(`  From: ${msg.sender_fname} ${msg.sender_lname} (ID: ${msg.sender_id}, Role: ${msg.sender_role})`);
        console.log(`  To: ${msg.receiver_fname} ${msg.receiver_lname} (ID: ${msg.receiver_id}, Role: ${msg.receiver_role})`);
        console.log(`  Content: "${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}"`);
        console.log(`  Sent: ${msg.sent_at}`);
      });
    }

    // 4. Test conversation retrieval for a specific user
    console.log('\n4️⃣  TEST: Get conversations for user ID 1:');
    console.log('-'.repeat(60));
    
    const userId = 1;
    const [partners] = await connection.query(`
      SELECT DISTINCT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `, [userId, userId, userId]);
    
    console.log(`✅ User ${userId} has messages with ${partners.length} people`);
    
    for (const partner of partners) {
      const [userDetails] = await connection.query(
        'SELECT id, firstname, lastname, role FROM users WHERE id = ?',
        [partner.other_user_id]
      );
      
      if (userDetails.length === 0) {
        console.log(`   ❌ User ${partner.other_user_id} not found!`);
        continue;
      }
      
      const user = userDetails[0];
      const isOfficerOrAdmin = user.role === 'admin' || user.role === 'police';
      
      console.log(`   ${isOfficerOrAdmin ? '✅' : '❌'} ${user.firstname} ${user.lastname} (ID: ${user.id}, Role: ${user.role})`);
      
      if (isOfficerOrAdmin) {
        const [msgCount] = await connection.query(`
          SELECT COUNT(*) as count FROM messages
          WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        `, [userId, partner.other_user_id, partner.other_user_id, userId]);
        console.log(`      Messages: ${msgCount[0].count}`);
      }
    }

    // 5. Check database schema
    console.log('\n5️⃣  DATABASE SCHEMA - Messages Table:');
    console.log('-'.repeat(60));
    const [schema] = await connection.query(`
      DESCRIBE messages
    `);
    schema.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(required)' : '(nullable)'}`);
    });

    // 6. Check database schema - Users table
    console.log('\n6️⃣  DATABASE SCHEMA - Users Table:');
    console.log('-'.repeat(60));
    const [usersSchema] = await connection.query(`
      DESCRIBE users
    `);
    const hasRoleColumn = usersSchema.some(col => col.Field === 'role');
    console.log(`✅ Role column exists: ${hasRoleColumn}`);
    
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n💡 NEXT STEPS:');
    console.log('   If no admin/police users found, you need to:');
    console.log('   1. Manually update user roles in database:');
    console.log('      UPDATE users SET role = "admin" WHERE id = 1;');
    console.log('   2. Or use AdminSide UI to promote users to officer');
    console.log('   3. Verify messages are being sent to correct receiver_id');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error running diagnostics:', error.message);
    console.error(error);
  } finally {
    if (connection) await connection.end();
  }
}

runDiagnostics();
