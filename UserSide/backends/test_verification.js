const db = require('./db');

async function testVerificationQuery() {
    try {
        console.log('Testing verification query...');
        
        // Test connection
        const [connectionTest] = await db.query('SELECT 1 as test');
        console.log('Database connection successful:', connectionTest);
        
        // Test verification query with a sample user ID
        const userId = 1; // Test with user ID 1
        console.log(`Fetching verification status for user ID: ${userId}`);
        
        const [verifications] = await db.query(
            "SELECT * FROM verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            [userId]
        );
        
        console.log('Verification query result:', verifications);
        
        if (verifications.length > 0) {
            console.log('Found verification record:');
            console.log('Verification ID:', verifications[0].verification_id);
            console.log('User ID:', verifications[0].user_id);
            console.log('Status:', verifications[0].status);
            console.log('Created At:', verifications[0].created_at);
            console.log('Updated At:', verifications[0].updated_at);
        } else {
            console.log('No verification records found for user ID:', userId);
        }
        
        // Also test fetching all verifications
        console.log('\nFetching all verifications:');
        const [allVerifications] = await db.query("SELECT * FROM verifications ORDER BY created_at DESC LIMIT 5");
        console.log('All verifications count:', allVerifications.length);
        allVerifications.forEach((v, i) => {
            console.log(`${i+1}. User: ${v.user_id}, Status: ${v.status}, Created: ${v.created_at}`);
        });
        
    } catch (error) {
        console.error('Error testing verification query:', error);
    }
}

testVerificationQuery();