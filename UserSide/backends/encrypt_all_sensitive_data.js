/**
 * Comprehensive Encryption Script
 * Encrypts all sensitive fields in the database:
 * - users_public: contact, address
 * - user_verifications: id_picture, selfie_with_id, billing_document
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = 'base64:ciPqFYTQJ2bGZ0NUrfY7mvwODuOZ6zyUTlIh1D+pb+w=';

function getEncryptionKey() {
    let key = ENCRYPTION_KEY;
    if (key.startsWith('base64:')) {
        key = key.substring(7);
        return Buffer.from(key, 'base64');
    }
    return Buffer.from(key.padEnd(32, '0').substring(0, 32));
}

function encrypt(text) {
    if (!text || text.trim() === '') return text;
    try {
        const iv = crypto.randomBytes(16);
        const key = getEncryptionKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const combined = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
        return combined.toString('base64');
    } catch (error) {
        console.error('Encryption error:', error.message);
        return text;
    }
}

function isAlreadyEncrypted(value) {
    if (!value) return true;
    // Encrypted data is long base64 string
    return value.length > 50 && /^[A-Za-z0-9+/=]+$/.test(value);
}

function buildUpdateQuery(tableName, idColumnName, idValue, updatesObject) {
    const setClauses = [];
    const values = [];
    let index = 1;

    for (const [columnName, columnValue] of Object.entries(updatesObject)) {
        setClauses.push(`${columnName} = $${index++}`);
        values.push(columnValue);
    }

    // WHERE id = $N
    const whereIndex = index;
    values.push(idValue);

    return {
        text: `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${idColumnName} = $${whereIndex}`,
        values,
    };
}

async function encryptAllSensitiveData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://alertdavao_user:rcXDr9MjmEJ8Kk6l2Nw7SbDLnOaS1m0l@dpg-d4t0k8u3jp1c73fhvulg-a.singapore-postgres.render.com/alertdavao_f2ij',
        ssl: { rejectUnauthorized: false }
    });

    console.log('🔐 Starting comprehensive encryption...\n');

    try {
        // ========================================
        // 1. ENCRYPT USER CONTACT & ADDRESS
        // ========================================
        console.log('📱 Encrypting user contact and address fields...');
        const users = await pool.query(
            'SELECT id, contact, address FROM users_public WHERE (contact IS NOT NULL AND contact != \'\') OR (address IS NOT NULL AND address != \'\')'
        );

        let userEncrypted = 0;
        for (const user of users.rows) {
            const updates = {};

            if (user.contact && !isAlreadyEncrypted(user.contact)) {
                updates.contact = encrypt(user.contact);
                console.log(`  ✅ User ${user.id}: Encrypted contact`);
            }

            if (user.address && !isAlreadyEncrypted(user.address)) {
                updates.address = encrypt(user.address);
                console.log(`  ✅ User ${user.id}: Encrypted address`);
            }

            const updateKeys = Object.keys(updates);
            if (updateKeys.length > 0) {
                const q = buildUpdateQuery('users_public', 'id', user.id, updates);
                await pool.query(q.text, q.values);
                userEncrypted++;
            }
        }

        // ========================================
        // 2. ENCRYPT VERIFICATION IMAGES
        // ========================================
        console.log('\n🖼️  Encrypting verification document paths...');
        const verifications = await pool.query(
            'SELECT id, id_picture, selfie_with_id, billing_document FROM user_verifications WHERE id_picture IS NOT NULL OR selfie_with_id IS NOT NULL OR billing_document IS NOT NULL'
        );

        let verificationEncrypted = 0;
        for (const verification of verifications.rows) {
            const updates = {};

            if (verification.id_picture && !isAlreadyEncrypted(verification.id_picture)) {
                updates.id_picture = encrypt(verification.id_picture);
                console.log(`  ✅ Verification ${verification.id}: Encrypted ID picture path`);
            }

            if (verification.selfie_with_id && !isAlreadyEncrypted(verification.selfie_with_id)) {
                updates.selfie_with_id = encrypt(verification.selfie_with_id);
                console.log(`  ✅ Verification ${verification.id}: Encrypted selfie path`);
            }

            if (verification.billing_document && !isAlreadyEncrypted(verification.billing_document)) {
                updates.billing_document = encrypt(verification.billing_document);
                console.log(`  ✅ Verification ${verification.id}: Encrypted billing document path`);
            }

            const updateKeys = Object.keys(updates);
            if (updateKeys.length > 0) {
                const q = buildUpdateQuery('user_verifications', 'id', verification.id, updates);
                await pool.query(q.text, q.values);
                verificationEncrypted++;
            }
        }

        // ========================================
        // SUMMARY
        // ========================================
        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(60));
        console.log('📊 ENCRYPTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Users encrypted (contact/address): ${userEncrypted}`);
        console.log(`✅ Verifications encrypted (images): ${verificationEncrypted}`);
        console.log('='.repeat(60));
        console.log('\n🎉 Encryption complete! Checking finished.');

        // Close pool if it was created locally, but for module usage we might want to pass db connection
        // For now, let's keep it simple and just close this scripts pool
        await pool.end();

        // Do NOT process.exit(0) here, as it would kill the server
    } catch (error) {
        console.error('\n❌ Fatal error in encryption migration:', error.message);
        console.error('Stack:', error.stack);
        // Do NOT process.exit(1) here as it would crash the server startup
    }
}

// Export the function
module.exports = { encryptAllSensitiveData };
