// Test script for verification approval and rejection functionality
const fs = require('fs');

async function testVerificationApprovalRejection() {
  const baseUrl = 'http://localhost:3000'; // Backend server port
  const testUserId = '2'; // Use a different user ID to test rejection
  const testVerificationId = 1; // Use the verification ID from previous test
  
  console.log('Testing Verification Approval/Rejection API...\n');
  
  try {
    // Test 1: Approve verification
    console.log('1. Testing approve verification...');
    const approveResponse = await fetch(`${baseUrl}/api/verification/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationId: testVerificationId,
        userId: '1' // User ID 1 for approval
      })
    });
    
    const approveData = await approveResponse.json();
    console.log('Approve response:', JSON.stringify(approveData, null, 2));
    
    // Test 2: Get verification status after approval
    console.log('\n2. Testing get verification status after approval...');
    const statusResponse = await fetch(`${baseUrl}/api/verification/status/1`);
    const statusData = await statusResponse.json();
    console.log('Status response after approval:', JSON.stringify(statusData, null, 2));
    
    // Test 3: Submit a new verification request for user 2 (to test rejection)
    console.log('\n3. Testing submit new verification request for user 2...');
    const submitResponse = await fetch(`${baseUrl}/api/verification/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        idPicture: '/evidence/test-id2.jpg',
        idSelfie: '/evidence/test-selfie2.jpg',
        billingDocument: '/evidence/test-billing2.jpg'
      })
    });
    
    const submitData = await submitResponse.json();
    console.log('Submit response:', JSON.stringify(submitData, null, 2));
    
    // Get the new verification ID
    const newVerificationId = submitData.verificationId;
    
    // Test 4: Reject the new verification
    console.log('\n4. Testing reject verification...');
    const rejectResponse = await fetch(`${baseUrl}/api/verification/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationId: newVerificationId,
        userId: testUserId
      })
    });
    
    const rejectData = await rejectResponse.json();
    console.log('Reject response:', JSON.stringify(rejectData, null, 2));
    
    // Test 5: Get verification status after rejection
    console.log('\n5. Testing get verification status after rejection...');
    const statusResponse2 = await fetch(`${baseUrl}/api/verification/status/${testUserId}`);
    const statusData2 = await statusResponse2.json();
    console.log('Status response after rejection:', JSON.stringify(statusData2, null, 2));
    
    console.log('\n✅ Verification Approval/Rejection API tests completed');
  } catch (error) {
    console.error('❌ Error testing verification approval/rejection API:', error);
  }
}

// Run the test
testVerificationApprovalRejection();