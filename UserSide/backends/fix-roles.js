/**
 * Fix User Roles Script
 * Sets the first user as admin and any additional users as regular users
 * Run: node fix-roles.js
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

async function fixRoles() {
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
    console.log('ALERTDAVAO - USER ROLE FIXER');
    console.log('═'.repeat(60));

    // Get all users
    const [users] = await connection.query(`
      SELECT id, firstname, lastname, role 
      FROM users 
      ORDER BY id ASC
    `);

    if (users.length === 0) {
      console.log('\n❌ No users found in database!');
      rl.close();
      return;
    }

    console.log('\n📋 Current Users:');
    console.log('-'.repeat(60));
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.firstname} ${u.lastname} (ID: ${u.id}) - Current Role: ${u.role}`);
    });

    console.log('\n');
    console.log('🔧 ROLE ASSIGNMENT OPTIONS:');
    console.log('-'.repeat(60));
    console.log('1. Set first user as ADMIN (for AdminSide login)');
    console.log('2. Set specific user as ADMIN');
    console.log('3. Set specific user as POLICE');
    console.log('4. Reset all users to regular users');
    console.log('5. Manual assignment (interactive)');
    console.log('6. Cancel');

    const choice = await question('\nChoose option (1-6): ');

    switch(choice) {
      case '1':
        await setFirstAsAdmin(connection, users);
        break;
      case '2':
        await setSpecificAsAdmin(connection, users);
        break;
      case '3':
        await setSpecificAsPolice(connection, users);
        break;
      case '4':
        await resetAllToUser(connection);
        break;
      case '5':
        await manualAssignment(connection, users);
        break;
      case '6':
        console.log('\n✋ Cancelled');
        break;
      default:
        console.log('\n❌ Invalid option');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
}

async function setFirstAsAdmin(connection, users) {
  const firstUser = users[0];
  console.log(`\n⏳ Setting ${firstUser.firstname} ${firstUser.lastname} as ADMIN...`);
  
  await connection.query(
    'UPDATE users SET role = ? WHERE id = ?',
    ['admin', firstUser.id]
  );
  
  console.log(`✅ Done! ${firstUser.firstname} ${firstUser.lastname} is now ADMIN`);
  console.log(`\n💡 Use these credentials for AdminSide login:`);
  console.log(`   ID: ${firstUser.id}`);
  console.log(`   You can login with email and password used during registration`);
}

async function setSpecificAsAdmin(connection, users) {
  console.log('\nWhich user should be ADMIN?');
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.firstname} ${u.lastname} (ID: ${u.id})`);
  });
  
  const choice = await question('Choose (1-' + users.length + '): ');
  const index = parseInt(choice) - 1;
  
  if (index < 0 || index >= users.length) {
    console.log('❌ Invalid choice');
    return;
  }
  
  const user = users[index];
  console.log(`\n⏳ Setting ${user.firstname} ${user.lastname} as ADMIN...`);
  
  await connection.query(
    'UPDATE users SET role = ? WHERE id = ?',
    ['admin', user.id]
  );
  
  console.log(`✅ Done! ${user.firstname} ${user.lastname} is now ADMIN`);
}

async function setSpecificAsPolice(connection, users) {
  console.log('\nWhich user should be POLICE?');
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.firstname} ${u.lastname} (ID: ${u.id})`);
  });
  
  const choice = await question('Choose (1-' + users.length + '): ');
  const index = parseInt(choice) - 1;
  
  if (index < 0 || index >= users.length) {
    console.log('❌ Invalid choice');
    return;
  }
  
  const user = users[index];
  console.log(`\n⏳ Setting ${user.firstname} ${user.lastname} as POLICE...`);
  
  await connection.query(
    'UPDATE users SET role = ? WHERE id = ?',
    ['police', user.id]
  );
  
  console.log(`✅ Done! ${user.firstname} ${user.lastname} is now POLICE`);
}

async function resetAllToUser(connection) {
  const confirm = await question('\n⚠️  Are you sure? This will set all users to regular users. (yes/no): ');
  
  if (confirm.toLowerCase() === 'yes') {
    console.log('\n⏳ Resetting all users to regular users...');
    await connection.query('UPDATE users SET role = ?', ['user']);
    console.log('✅ Done! All users are now regular users');
  } else {
    console.log('✋ Cancelled');
  }
}

async function manualAssignment(connection, users) {
  console.log('\nManual Role Assignment:');
  console.log('(Enter role for each user - options: user, police, admin)');
  
  const updates = [];
  
  for (const user of users) {
    const role = await question(`\n${user.firstname} ${user.lastname} (current: ${user.role}) → `);
    
    if (['user', 'police', 'admin'].includes(role)) {
      updates.push({ id: user.id, role });
    } else {
      console.log(`⚠️  Skipping ${user.firstname} (invalid role: ${role})`);
    }
  }
  
  if (updates.length === 0) {
    console.log('\n❌ No valid updates');
    return;
  }
  
  console.log('\n' + updates.length + ' users will be updated:');
  updates.forEach(u => {
    const user = users.find(x => x.id === u.id);
    console.log(`  ${user.firstname} ${user.lastname} → ${u.role}`);
  });
  
  const confirm = await question('\nProceed? (yes/no): ');
  
  if (confirm.toLowerCase() === 'yes') {
    console.log('\n⏳ Updating...');
    
    for (const update of updates) {
      await connection.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [update.role, update.id]
      );
    }
    
    console.log(`✅ Done! ${updates.length} users updated`);
  } else {
    console.log('✋ Cancelled');
  }
}

fixRoles();
