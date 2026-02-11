/**
 * Test Registration Endpoint
 * Run: node test_register.js
 */

const db = require('./db');
const bcrypt = require('bcryptjs');

async function testRegister() {
  const testData = {
    firstname: 'Test',
    lastname: 'User',
    email: `testuser${Date.now()}@test.com`,
    contact: '+639123456789',
    password: 'TestPass123@'
  };

  console.log('🧪 Testing /register-direct endpoint...\n');
  console.log('📝 Test data:', testData);

  try {
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    
    const sql = `
      INSERT INTO users (firstname, lastname, email, contact, password, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, NULL, NULL)
    `;

    const [result] = await db.query(sql, [
      testData.firstname,
      testData.lastname,
      testData.email,
      testData.contact,
      hashedPassword
    ]);

    console.log('✅ User registered successfully!');
    console.log('   User ID:', result.insertId);
    console.log('   Email:', testData.email);
    
    // Verify the user was created
    const [rows] = await db.query('SELECT id, firstname, lastname, email FROM users WHERE id = ?', [result.insertId]);
    if (rows.length > 0) {
      console.log('\n✅ Verification successful:');
      console.log('   ', rows[0]);
    }

  } catch (err) {
    console.error('❌ Registration failed:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('   Email already exists');
    }
  } finally {
    process.exit(0);
  }
}

testRegister();
