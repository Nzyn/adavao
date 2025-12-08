// Test script for verification functionality
const fs = require('fs');

async function testVerificationAPI() {
  const baseUrl = 'http://localhost:3000'; // Backend server port
  const testUserId = '1'; // Use a valid user ID from your database
  
  console.log('Testing Verification API...\n');
  
  try {
    // Test 1: Get verification status for a user
    console.log('1. Testing get verification status...');
    const statusResponse = await fetch(`${baseUrl}/api/verification/status/${testUserId}`);
    const statusData = await statusResponse.json();
    console.log('Status response:', JSON.stringify(statusData, null, 2));
    
    // Test 2: Submit a verification request
    console.log('\n2. Testing submit verification...');
    
    const submitResponse = await fetch(`${baseUrl}/api/verification/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        idPicture: '/evidence/test-id.jpg',
        idSelfie: '/evidence/test-selfie.jpg',
        billingDocument: '/evidence/test-billing.jpg'
      })
    });
    
    const submitData = await submitResponse.json();
    console.log('Submit response:', JSON.stringify(submitData, null, 2));
    
    // Test 3: Get verification status again to confirm it was created
    console.log('\n3. Testing get verification status after submission...');
    const statusResponse2 = await fetch(`${baseUrl}/api/verification/status/${testUserId}`);
    const statusData2 = await statusResponse2.json();
    console.log('Status response after submission:', JSON.stringify(statusData2, null, 2));
    
    console.log('\n✅ Verification API tests completed');
  } catch (error) {
    console.error('❌ Error testing verification API:', error);
  }
}

// Run the test
testVerificationAPI();