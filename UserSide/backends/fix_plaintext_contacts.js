/**
 * One-time cleanup script: Fix plaintext/inconsistent contacts in users_public
 * 
 * Problem: handleGoogleRegister.js and AuthController.php were storing
 * contact numbers as plaintext instead of encrypting them.
 * 
 * This script:
 * 1. Reads all contacts from users_public
 * 2. Tries to decrypt each one
 * 3. If decryption produces the same value (meaning it's plaintext), re-encrypts it
 * 4. Updates the row with the properly encrypted value
 * 
 * HOW TO RUN:
 * On Render: Open the Shell tab for alertdavao-userside-backend and run:
 *   node fix_plaintext_contacts.js
 * 
 * Safe to run multiple times (idempotent).
 */

require('dotenv').config();
const db = require('./db');
const { encrypt, decrypt } = require('./encryptionService');

async function fixPlaintextContacts() {
  console.log('═'.repeat(60));
  console.log('🔧 Fixing plaintext contacts in users_public');
  console.log('═'.repeat(60));

  try {
    // Get all users with non-null contacts
    const [users] = await db.query(
      `SELECT id, email, contact FROM users_public WHERE contact IS NOT NULL AND contact != ''`
    );

    console.log(`Found ${users.length} users with contact data\n`);

    let fixedCount = 0;
    let alreadyEncrypted = 0;
    let emptyCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const raw = user.contact;

        if (!raw || raw.trim() === '') {
          emptyCount++;
          continue;
        }

        // Try to decrypt — if decrypt returns the same value, it means
        // the data was never encrypted (plaintext phone number)
        const decrypted = decrypt(raw);

        // Heuristic: if the raw value looks like a phone number (digits, +, spaces, dashes)
        // then it's plaintext and needs encryption
        const isPlaintext = /^[\d\s+\-()]{7,20}$/.test(raw.trim());

        // Also check: if decrypt returned the same value AND it looks like a phone number
        if (isPlaintext || (decrypted === raw && raw.length < 30)) {
          // This contact is stored as plaintext — encrypt it
          const encrypted = encrypt(raw.trim());
          await db.query(
            `UPDATE users_public SET contact = $1 WHERE id = $2`,
            [encrypted, user.id]
          );
          fixedCount++;
          console.log(`  ✅ Fixed user #${user.id} (${user.email}): plaintext → encrypted`);
        } else {
          // Already encrypted (decrypt returned a different value)
          alreadyEncrypted++;
        }
      } catch (err) {
        errorCount++;
        console.error(`  ❌ Error processing user #${user.id} (${user.email}):`, err.message);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Results:');
    console.log(`  ✅ Fixed (re-encrypted):  ${fixedCount}`);
    console.log(`  ✓  Already encrypted:     ${alreadyEncrypted}`);
    console.log(`  ⬜ Empty/null:             ${emptyCount}`);
    console.log(`  ❌ Errors:                 ${errorCount}`);
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('❌ Fatal error:', err);
  } finally {
    await db.end();
    process.exit(0);
  }
}

fixPlaintextContacts();
