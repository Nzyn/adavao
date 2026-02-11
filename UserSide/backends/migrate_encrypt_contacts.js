/**
 * Migration Script: Encrypt Existing Plaintext Contact Data
 * 
 * This script encrypts all plaintext phone numbers in the users_public table
 * using AES-256-CBC encryption to match the new registration flow.
 */

const db = require('./db');
const { encrypt } = require('./encryptionService');

async function encryptExistingData() {
    console.log('🔐 Starting encryption of existing contact data...\n');

    try {
        // Get all users with contact data
        const [users] = await db.query(
            'SELECT id, contact FROM users_public WHERE contact IS NOT NULL AND contact != \'\''
        );

        console.log(`📊 Found ${users.length} users with contact data\n`);

        if (users.length === 0) {
            console.log('✅ No data to encrypt. Exiting.');
            process.exit(0);
        }

        let encryptedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const user of users) {
            try {
                const { id, contact } = user;

                // Check if already encrypted (encrypted data is longer and base64)
                if (contact.length > 50 && /^[A-Za-z0-9+/=]+$/.test(contact)) {
                    console.log(`⏭️  User ${id}: Already encrypted, skipping`);
                    skippedCount++;
                    continue;
                }

                // Encrypt the contact
                const encryptedContact = encrypt(contact);

                // Update database
                await db.query(
                    'UPDATE users_public SET contact = $1 WHERE id = $2',
                    [encryptedContact, id]
                );

                console.log(`✅ User ${id}: Encrypted contact (${contact.substring(0, 5)}...)`);
                encryptedCount++;

            } catch (error) {
                console.error(`❌ User ${user.id}: Encryption failed -`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 ENCRYPTION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Encrypted: ${encryptedCount}`);
        console.log(`⏭️  Skipped (already encrypted): ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📦 Total processed: ${users.length}`);
        console.log('='.repeat(50));

        if (encryptedCount > 0) {
            console.log('\n🎉 Encryption completed successfully!');
            console.log('📝 All new registrations will now use encrypted contact data.');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Fatal error during encryption:', error);
        process.exit(1);
    }
}

// Run the migration
encryptExistingData();
