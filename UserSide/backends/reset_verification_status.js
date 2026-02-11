const db = require('./db');

/**
 * Reset all users' verification status to unverified
 * This script sets is_verified = false for all users in users_public table
 */
async function resetAllUsersVerification() {
    try {
        console.log('🔄 Resetting all users to unverified status...\n');

        // Update all users to unverified
        const [result] = await db.query(
            'UPDATE users_public SET is_verified = false WHERE is_verified = true RETURNING id, firstname, lastname'
        );

        console.log(`✅ Reset ${result.length} users to unverified status\n`);

        if (result.length > 0) {
            console.log('Updated users:');
            result.forEach(user => {
                console.log(`  - ${user.firstname} ${user.lastname} (ID: ${user.id})`);
            });
        }

        // Show current verification status counts
        const [stats] = await db.query(
            'SELECT is_verified, COUNT(*) as count FROM users_public GROUP BY is_verified'
        );

        console.log('\n📊 Current verification status:');
        stats.forEach(stat => {
            console.log(`   ${stat.is_verified ? 'Verified' : 'Unverified'}: ${stat.count} users`);
        });

        console.log('\n✅ Verification reset complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting users:', error);
        process.exit(1);
    }
}

resetAllUsersVerification();
