// testAPI.js - Test the profile API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('\n🧪 Testing Profile API Endpoints...\n');
  
  try {
    // Test 1: Connection test
    console.log('1️⃣ Testing database connection...');
    try {
      const response = await axios.get(`${BASE_URL}/test-connection`);
      console.log('✅ Connection test:', response.data);
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
      return;
    }
    
    // Test 2: Get user by ID
    console.log('\n2️⃣ Testing get user by ID...');
    const testUserId = 1; // Change this to your user ID
    try {
      const response = await axios.get(`${BASE_URL}/users/${testUserId}`);
      console.log('✅ User fetched:', response.data.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Get user failed:', error.response.status, error.response.data);
      } else {
        console.log('❌ Get user failed:', error.message);
      }
    }
    
    // Test 3: Update user profile
    console.log('\n3️⃣ Testing update user profile...');
    const testData = {
      id: testUserId,
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      contact: '+1234567890',
      address: 'Test Address from API Test - ' + new Date().toISOString(),
      is_verified: 1,
      profile_image: null
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/users/upsert`, testData);
      console.log('✅ User updated:', response.data);
      console.log('📍 Address sent:', testData.address);
    } catch (error) {
      if (error.response) {
        console.log('❌ Update failed:', error.response.status, error.response.data);
      } else {
        console.log('❌ Update failed:', error.message);
      }
    }
    
    // Test 4: Verify the update
    console.log('\n4️⃣ Verifying the update...');
    try {
      const response = await axios.get(`${BASE_URL}/users/${testUserId}`);
      const savedAddress = response.data.data.address;
      console.log('✅ Address in database:', savedAddress);
      
      if (savedAddress === testData.address) {
        console.log('✅ Address update VERIFIED!');
      } else {
        console.log('❌ Address mismatch!');
        console.log('   Expected:', testData.address);
        console.log('   Got:', savedAddress);
      }
    } catch (error) {
      console.log('❌ Verification failed:', error.message);
    }
    
    // Test 5: Update address only
    console.log('\n5️⃣ Testing update address only...');
    const newAddress = 'Updated Address Only - ' + new Date().toISOString();
    try {
      const response = await axios.patch(`${BASE_URL}/users/${testUserId}/address`, {
        address: newAddress
      });
      console.log('✅ Address updated:', response.data);
      
      // Verify
      const verify = await axios.get(`${BASE_URL}/users/${testUserId}`);
      console.log('✅ Verified address:', verify.data.data.address);
    } catch (error) {
      if (error.response) {
        console.log('❌ Address update failed:', error.response.status, error.response.data);
      } else {
        console.log('❌ Address update failed:', error.message);
      }
    }
    
    console.log('\n✅ API test complete!\n');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

// Check if server is running
console.log('Checking if server is running on http://localhost:3000...\n');
axios.get('http://localhost:3000/api/test-connection')
  .then(() => {
    console.log('✅ Server is running!\n');
    testAPI();
  })
  .catch(() => {
    console.log('❌ Server is NOT running!');
    console.log('\nPlease start the server first:');
    console.log('  cd backends');
    console.log('  node server.js\n');
  });
