const db = require('./db');
const { decrypt } = require('./encryptionService');

async function checkEncryptedData() {
    try {
        console.log('🔍 Checking encrypted data in database...\n');

        // Get a sample user
        const [users] = await db.query(
            'SELECT id, firstname, lastname, contact, address FROM users_public LIMIT 3'
        );

        users.forEach(user => {
            console.log(`\n👤 User ID: ${user.id} - ${user.firstname} ${user.lastname}`);
            console.log(`   Contact (raw): ${user.contact ? user.contact.substring(0, 50) + '...' : 'NULL'}`);
            console.log(`   Address (raw): ${user.address ? user.address.substring(0, 50) + '...' : 'NULL'}`);

            if (user.contact) {
                try {
                    const decrypted = decrypt(user.contact);
                    console.log(`   Contact (decrypted): ${decrypted}`);
                    console.log(`   Decryption successful: ${!decrypted.startsWith('ENC_') && decrypted !== user.contact}`);
                } catch (err) {
                    console.log(`   Contact decryption error: ${err.message}`);
                }
            }

            if (user.address) {
                try {
                    const decrypted = decrypt(user.address);
                    console.log(`   Address (decrypted): ${decrypted}`);
                    console.log(`   Decryption successful: ${!decrypted.startsWith('ENC_') && decrypted !== user.address}`);
                } catch (err) {
                    console.log(`   Address decryption error: ${err.message}`);
                }
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkEncryptedData();
