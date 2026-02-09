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
    // Try to decrypt — if it succeeds, the value is already encrypted
    // This is the only reliable way; length checks miss short encrypted values (e.g. phone ~44 chars)
    if (typeof value !== 'string' || value.length < 24) return false;
    if (!/^[A-Za-z0-9+/=]+$/.test(value)) return false;
    try {
        const combined = Buffer.from(value, 'base64');
        if (combined.length < 17) return false;  // 16 IV + 1+ data
        const iv = combined.slice(0, 16);
        const encrypted = combined.slice(16);
        const key = getEncryptionKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        // If decrypt succeeded, it IS encrypted
        return true;
    } catch (e) {
        // Also try Laravel JSON format
        try {
            const decoded = Buffer.from(value, 'base64').toString('utf8');
            const payload = JSON.parse(decoded);
            if (payload && payload.iv && payload.value) return true;
        } catch (e2) {}
        return false;
    }
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

async function tableExists(pool, tableName) {
    const qualified = tableName.includes('.') ? tableName : `public.${tableName}`;
    const result = await pool.query('SELECT to_regclass($1) AS reg', [qualified]);
    return Boolean(result?.rows?.[0]?.reg);
}

async function encryptAllSensitiveData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://alertdavao_w07v_user:W7nLMXVel4jMKegzbLCEAn7CC8LFMIwT@dpg-d651i2ggjchc73fqnkqg-a.singapore-postgres.render.com/alertdavao_w07v',
        ssl: { rejectUnauthorized: false }
    });

    console.log('🔐 Starting comprehensive encryption...\n');

    try {
        // ========================================
        // 1. ENCRYPT USER CONTACT & ADDRESS
        // ========================================
        console.log('📱 Encrypting user contact and address fields...');
        let userEncrypted = 0;
        if (!(await tableExists(pool, 'users_public'))) {
            console.warn('⚠️ users_public table does not exist yet. Skipping user contact/address encryption.');
        } else {
            const users = await pool.query(
                'SELECT id, contact, address FROM users_public WHERE (contact IS NOT NULL AND contact != \'\') OR (address IS NOT NULL AND address != \'\')'
            );
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
        }

        // ========================================
        // 2. ENCRYPT VERIFICATION IMAGES
        // ========================================
        console.log('\n🖼️  Encrypting verification document paths...');
        let verificationEncrypted = 0;
        if (!(await tableExists(pool, 'user_verifications'))) {
            console.warn('⚠️ user_verifications table does not exist yet. Skipping verification document encryption.');
        } else {
            const verifications = await pool.query(
                'SELECT id, id_picture, selfie_with_id, billing_document FROM user_verifications WHERE id_picture IS NOT NULL OR selfie_with_id IS NOT NULL OR billing_document IS NOT NULL'
            );

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
        }

        // ========================================
        // 1b. ENCRYPT USER_ADMIN CONTACT & ADDRESS
        // ========================================
        console.log('\n📱 Encrypting user_admin contact and address fields...');
        let adminEncrypted = 0;
        if (!(await tableExists(pool, 'user_admin'))) {
            console.warn('⚠️ user_admin table does not exist yet. Skipping.');
        } else {
            const adminUsers = await pool.query(
                'SELECT id, contact, address FROM user_admin WHERE (contact IS NOT NULL AND contact != \'\') OR (address IS NOT NULL AND address != \'\')'
            );
            for (const user of adminUsers.rows) {
                const updates = {};
                if (user.contact && !isAlreadyEncrypted(user.contact)) {
                    updates.contact = encrypt(user.contact);
                    console.log(`  ✅ Admin ${user.id}: Encrypted contact`);
                }
                if (user.address && !isAlreadyEncrypted(user.address)) {
                    updates.address = encrypt(user.address);
                    console.log(`  ✅ Admin ${user.id}: Encrypted address`);
                }
                const updateKeys = Object.keys(updates);
                if (updateKeys.length > 0) {
                    const q = buildUpdateQuery('user_admin', 'id', user.id, updates);
                    await pool.query(q.text, q.values);
                    adminEncrypted++;
                }
            }
        }

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(60));
        console.log('📊 ENCRYPTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Users encrypted (contact/address): ${typeof userEncrypted === 'number' ? userEncrypted : 0}`);
        console.log(`✅ Admin users encrypted: ${adminEncrypted}`);
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
