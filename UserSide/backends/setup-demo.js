/**
 * Demo Setup Script
 * Creates demo data and sets up roles for testing
 * Run: node setup-demo.js
 */

const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupDemo() {
  let connection;
  
  try {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('🚀 ALERTDAVAO DEMO SETUP');
    console.log('═'.repeat(70));

    // Connect
    console.log('\n⏳ Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_DATABASE || 'alertdavao'
    });
    console.log('✅ Connected\n');

    // Get users
    const [users] = await connection.query(`
      SELECT id, firstname, lastname, role FROM users ORDER BY id ASC
    `);

    if (users.length === 0) {
      console.log('❌ No users found. Please register users first in the app.\n');
      await connection.end();
      rl.close();
      return;
    }

    console.log('📋 Current Users:');
    console.log('─'.repeat(70));
    users.forEach(u => {
      console.log(`  ${u.id}. ${u.firstname} ${u.lastname} - Role: ${u.role}`);
    });

    console.log('\n🔧 Setup Options:');
    console.log('  1. Auto-setup: Set user 1 as ADMIN, rest as regular users');
    console.log('  2. Manual: Choose which users are admin/police');
    console.log('  3. Skip setup (use current roles)');

    const choice = await question('\nChoose (1-3): ');

    if (choice === '1') {
      console.log('\n⏳ Setting up demo...');
      
      // Set first user as admin
      await connection.query('UPDATE users SET role = ? WHERE id = 1', ['admin']);
      
      // Set rest as regular users
      if (users.length > 1) {
        await connection.query('UPDATE users SET role = ? WHERE id > 1', ['user']);
      }
      
      console.log('✅ Setup complete!');
      console.log(`   User 1 (${users[0].firstname}) → ADMIN`);
      users.slice(1).forEach(u => {
        console.log(`   User ${u.id} (${u.firstname}) → REGULAR USER`);
      });
      
    } else if (choice === '2') {
      console.log('\nManual setup:');
      const updates = [];
      
      for (const user of users) {
        const role = await question(`User ${user.id} (${user.firstname} ${user.lastname}) → `);
        if (['user', 'admin', 'police'].includes(role)) {
          updates.push({ id: user.id, role });
        } else {
          console.log('   (skipped - invalid role)');
        }
      }
      
      if (updates.length > 0) {
        console.log('\n⏳ Updating roles...');
        for (const update of updates) {
          await connection.query('UPDATE users SET role = ? WHERE id = ?', [update.role, update.id]);
        }
        console.log('✅ Done!');
      }
      
    } else if (choice === '3') {
      console.log('\n✋ Skipping setup');
    }

    // Show final state
    console.log('\n' + '─'.repeat(70));
    console.log('Final User Roles:');
    console.log('─'.repeat(70));
    
    const [finalUsers] = await connection.query(`
      SELECT id, firstname, lastname, role FROM users ORDER BY id ASC
    `);
    
    finalUsers.forEach(u => {
      const emoji = u.role === 'admin' ? '👨‍💼' : u.role === 'police' ? '🚔' : '👤';
      console.log(`  ${emoji} ${u.id}. ${u.firstname} ${u.lastname} - ${u.role}`);
    });

    // Show messages
    const [msgCount] = await connection.query('SELECT COUNT(*) as count FROM messages');
    console.log(`\n📨 Messages in database: ${msgCount[0].count}`);

    console.log('\n' + '─'.repeat(70));
    console.log('✅ READY TO TEST!');
    console.log('─'.repeat(70));
    console.log('\n📝 Next Steps:');
    console.log('  1. Restart UserSide backend: node backends/server.js');
    console.log('  2. Open AdminSide (http://localhost:8000)');
    console.log('  3. Login as admin (user 1)');
    console.log('  4. Go to Messages → Select a user');
    console.log('  5. Send a test message');
    console.log('  6. Open UserSide app');
    console.log('  7. Login as that user');
    console.log('  8. Go to Chat');
    console.log('  9. Message should appear in 3 seconds ✅');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
}

setupDemo();
