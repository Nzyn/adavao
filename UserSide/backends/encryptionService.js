/**
 * AES-256-CBC Encryption Service
 * Provides encryption/decryption for sensitive data
 * Uses the same algorithm as Laravel's Crypt facade for compatibility
 */

const crypto = require('crypto');

// Encryption configuration - matches Laravel's Crypt facade
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.APP_KEY || 'base64:ciPqFYTQJ2bGZ0NUrfY7mvwODuOZ6zyUTlIh1D+pb+w=';

/**
 * Get the encryption key from Laravel's APP_KEY format
 * Laravel stores keys as "base64:..." format
 */
function getEncryptionKey() {
  let key = ENCRYPTION_KEY;
  
  // If key starts with "base64:", decode it
  if (key.startsWith('base64:')) {
    key = key.substring(7); // Remove "base64:" prefix
    return Buffer.from(key, 'base64');
  }
  
  // Otherwise, use the key directly (must be 32 bytes for AES-256)
  return Buffer.from(key.padEnd(32, '0').substring(0, 32));
}

/**
 * Encrypt data using AES-256-CBC
 * @param {string} text - The plain text to encrypt
 * @returns {string} - Base64 encoded encrypted data with IV
 */
function encrypt(text) {
  if (!text) return text;
  
  try {
    // Generate a random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);
    
    // Get the encryption key
    const key = getEncryptionKey();
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Combine IV and encrypted data in Laravel-compatible format
    // Format: base64(iv + encrypted)
    const combined = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedData - The base64 encoded encrypted data with IV
 * @returns {string} - The decrypted plain text
 */
function decrypt(encryptedData) {
  if (!encryptedData) return encryptedData;
  
  // If data is clearly not encrypted (too short or not base64), return as-is
  if (typeof encryptedData !== 'string' || encryptedData.length < 24) {
    return encryptedData;
  }

  try {
    // Get the encryption key
    const key = getEncryptionKey();

    // Decode the base64 encrypted data
    let combined;
    try {
      combined = Buffer.from(encryptedData, 'base64');
    } catch (decodeError) {
      // Not valid base64, return original
      return encryptedData;
    }

    // Check if combined buffer is at least 17 bytes (16 for IV, 1+ for encrypted)
    if (combined.length < 17) {
      // Data too short to be encrypted, return original
      return encryptedData;
    }

    // Extract IV (first 16 bytes) and encrypted text
    const iv = combined.slice(0, 16);
    const encrypted = combined.slice(16);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Silently return original data if decryption fails (might not be encrypted)
    return encryptedData;
  }
}

/**
 * Encrypt file content
 * @param {Buffer} fileBuffer - The file content as buffer
 * @returns {Buffer} - Encrypted file content
 */
function encryptFile(fileBuffer) {
  if (!fileBuffer) return fileBuffer;
  
  try {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    
    // Prepend IV to encrypted data
    return Buffer.concat([iv, encrypted]);
  } catch (error) {
    console.error('❌ File encryption error:', error.message);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt file content
 * @param {Buffer} encryptedBuffer - The encrypted file content
 * @returns {Buffer} - Decrypted file content
 */
function decryptFile(encryptedBuffer) {
  if (!encryptedBuffer) return encryptedBuffer;
  
  try {
    const key = getEncryptionKey();
    
    // Extract IV and encrypted content
    const iv = encryptedBuffer.slice(0, 16);
    const encrypted = encryptedBuffer.slice(16);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch (error) {
    console.error('❌ File decryption error:', error.message);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Encrypt an object's sensitive fields
 * @param {Object} obj - The object containing data to encrypt
 * @param {Array} fields - Array of field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
function encryptFields(obj, fields) {
  const encrypted = { ...obj };
  
  fields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  });
  
  return encrypted;
}

/**
 * Decrypt an object's encrypted fields
 * @param {Object} obj - The object containing encrypted data
 * @param {Array} fields - Array of field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
function decryptFields(obj, fields) {
  const decrypted = { ...obj };
  
  fields.forEach(field => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });
  
  return decrypted;
}

/**
 * Check if user has permission to decrypt data
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can decrypt sensitive data
 */
function canDecrypt(userRole) {
  const authorizedRoles = ['police', 'admin'];
  return authorizedRoles.includes(userRole);
}

/**
 * Get verified user role from database (async version)
 * SECURITY: Always verify roles from database, never trust client input
 * @param {number|string} userId - The user's ID
 * @param {object} db - Database connection object
 * @returns {Promise<string>} - The verified user role from database
 */
async function getVerifiedUserRole(userId, db) {
  if (!userId || !db) {
    return 'user';
  }
  
  try {
    const [users] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );
    
    if (users.length === 0) {
      return 'user';
    }
    
    const role = users[0].role || 'user';
    console.log(`✅ Verified user ${userId} has role: ${role}`);
    return role;
  } catch (error) {
    console.error('❌ Error verifying user role:', error);
    return 'user';
  }
}

module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  encryptFields,
  decryptFields,
  canDecrypt,
  getVerifiedUserRole,
  ALGORITHM
};
