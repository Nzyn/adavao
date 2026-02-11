// Test script for complete verification workflow
const fs = require('fs');

async function testCompleteVerificationWorkflow() {
  const baseUrl = 'http://localhost:3000'; // Backend server port
  const testUserId = '3'; // Use a new user ID for complete workflow test
  
  console.log('Testing Complete Verification Workflow...\n');
  
  try {
    // Test 1: Check initial verification status (should be null)
    console.log('1. Testing initial verification status...');
    const initialStatusResponse = await fetch(`${baseUrl}/api/verification/status/${testUserId}`);
    const initialStatusData = await initialStatusResponse.json();
    console.log('Initial status response:', JSON.stringify(initialStatusData, null, 2));
    
    // Test 2: Submit verification request
    console.log('\n2. Testing submit verification request...');
    const submitResponse = await fetch(`${baseUrl}/api/verification/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        idPicture: '/evidence/workflow-test-id.jpg',
        idSelfie: '/evidence/workflow-test-selfie.jpg',
        billingDocument: '/evidence/workflow-test-billing.jpg'
      })
    });
    
    const submitData = await submitResponse.json();
    console.log('Submit response:', JSON.stringify(submitData, null, 2));
    
    // Test 3: Check verification status after submission
    console.log('\n3. Testing verification status after submission...');
    const statusAfterSubmitResponse = await fetch(`${baseUrl}/api/verification/status/${testUserId}`);
    const statusAfterSubmitData = await statusAfterSubmitResponse.json();
    console.log('Status after submission:', JSON.stringify(statusAfterSubmitData, null, 2));
    
    // Test 4: Approve the verification
    console.log('\n4. Testing approve verification...');
    const approveResponse = await fetch(`${baseUrl}/api/verification/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationId: submitData.verificationId,
        userId: testUserId
      })
    });
    
    const approveData = await approveResponse.json();
    console.log('Approve response:', JSON.stringify(approveData, null, 2));
    
    // Test 5: Check final verification status
    console.log('\n5. Testing final verification status...');
    const finalStatusResponse = await fetch(`${baseUrl}/api/verification/status/${testUserId}`);
    const finalStatusData = await finalStatusResponse.json();
    console.log('Final status response:', JSON.stringify(finalStatusData, null, 2));
    
    // Verify the final status
    if (finalStatusData.success && finalStatusData.data) {
      const verification = finalStatusData.data;
      if (verification.status === 'verified' && verification.is_verified === 1) {
        console.log('\n✅ VERIFICATION WORKFLOW COMPLETED SUCCESSFULLY');
        console.log('   - User is now verified');
        console.log('   - Status is set to "verified"');
        console.log('   - is_verified flag is set to 1');
      } else {
        console.log('\n❌ VERIFICATION WORKFLOW FAILED');
        console.log('   - Status:', verification.status);
        console.log('   - is_verified:', verification.is_verified);
      }
    } else {
      console.log('\n❌ VERIFICATION WORKFLOW FAILED - No verification data found');
    }
    
    console.log('\n✅ Complete Verification Workflow test completed');
  } catch (error) {
    console.error('❌ Error testing complete verification workflow:', error);
  }
}

// Run the test
testCompleteVerificationWorkflow();