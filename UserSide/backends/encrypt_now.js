/**
 * Quick Encryption Script - Run this locally to encrypt existing data
 * This connects directly to Render database
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
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const combined = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
    return combined.toString('base64');
}

async function encryptData() {
    // Direct connection to Render
    const pool = new Pool({
        connectionString: 'postgresql://alertdavao_user:rcXDr9MjmEJ8Kk6l2Nw7SbDLnOaS1m0l@dpg-d4t0k8u3jp1c73fhvulg-a.singapore-postgres.render.com/alertdavao_f2ij',
        ssl: { rejectUnauthorized: false }
    });

    console.log('🔐 Connecting to Render database...\n');

    try {
        const result = await pool.query(
            'SELECT id, contact FROM users_public WHERE contact IS NOT NULL AND contact != \'\''
        );

        console.log(`📊 Found ${result.rows.length} users\n`);

        let encrypted = 0;
        let skipped = 0;

        for (const user of result.rows) {
            const { id, contact } = user;

            // Skip if already encrypted
            if (contact.length > 50 && /^[A-Za-z0-9+/=]+$/.test(contact)) {
                console.log(`⏭️  User ${id}: Already encrypted`);
                skipped++;
                continue;
            }

            const encryptedContact = encrypt(contact);
            await pool.query('UPDATE users_public SET contact = $1 WHERE id = $2', [encryptedContact, id]);

            console.log(`✅ User ${id}: Encrypted (${contact.substring(0, 5)}...)`);
            encrypted++;
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Encrypted: ${encrypted}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log('='.repeat(50));
        console.log('\n🎉 Done! Refresh pgAdmin to see encrypted data.');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

encryptData();
