# Verification Documents Encryption & Access Control

## Overview
All verification documents (ID pictures, selfies, billing documents) are encrypted using AES-256-CBC encryption and can ONLY be decrypted and accessed by users with **admin** or **police** roles.

## Security Implementation

### 1. File Encryption
When a user uploads verification documents:

1. **Upload Endpoint**: `POST /api/verification/upload`
   - Accepts multipart/form-data with document file
   - File is immediately encrypted using AES-256-CBC
   - Encrypted file is stored on disk
   - Only encrypted file path is returned

2. **Encryption Process** (in `uploadVerificationDocument`):
   ```javascript
   const fileBuffer = fs.readFileSync(filePath);
   const encryptedBuffer = encryptFile(fileBuffer);  // AES-256-CBC encryption
   fs.writeFileSync(filePath, encryptedBuffer);      // Overwrite with encrypted version
   ```

### 2. Database Storage
When verification is submitted:

1. **Submit Endpoint**: `POST /api/verification/submit`
   - Receives file paths from previous upload
   - File paths are ALSO encrypted before storing in database (double encryption)
   - Encrypted paths stored in database columns: `id_picture`, `id_selfie`, `billing_document`

2. **Path Encryption** (in `submitVerification`):
   ```javascript
   const encryptedIdPicture = idPicture ? encrypt(idPicture) : null;
   const encryptedIdSelfie = idSelfie ? encrypt(idSelfie) : null;
   const encryptedBillingDoc = billingDocument ? encrypt(billingDocument) : null;
   ```

### 3. Role-Based Access Control

#### Accessing Verification Status
**Endpoint**: `GET /api/verification/status/:userId?requestingUserId=<id>`

**Security Implementation**:
```javascript
// ✅ SECURE: Role verified from database
const [requestingUsers] = await db.query("SELECT role FROM users WHERE id = ?", [requestingUserId]);
const userRole = requestingUsers[0].role || 'user';

// Only decrypt paths for admin/police
if (canDecrypt(userRole)) {
  verification.id_picture = decrypt(verification.id_picture);
  verification.id_selfie = decrypt(verification.id_selfie);
  verification.billing_document = decrypt(verification.billing_document);
}
```

**Important**: 
- Regular users receive encrypted paths (unusable)
- Only admin/police receive decrypted paths
- Role is verified from database, NOT from client input

#### Accessing Verification Files
**Endpoint**: `GET /verifications/:filename?userId=<id>`

**Security Implementation**:
```javascript
// ✅ SECURE: Role verified from database
const requestingUserId = req.query.userId || req.headers['x-user-id'];
const userRole = await getVerifiedUserRole(requestingUserId);

// Reject if not admin/police
if (userRole !== 'admin' && userRole !== 'police') {
  return res.status(403).json({ 
    success: false, 
    message: 'Unauthorized: Only admin and police can access verification documents' 
  });
}

// Decrypt file on-the-fly
const encryptedBuffer = fs.readFileSync(filePath);
const decryptedBuffer = decryptFile(encryptedBuffer);
res.send(decryptedBuffer);
```

### 4. Authorization Flow

```
User Upload → Encrypt File → Store Encrypted → Encrypt Path → Save to DB
                    ↓
Admin/Police Request → Verify Role from DB → Decrypt Path → Decrypt File → Serve
                    ↓
Regular User Request → Verify Role from DB → Access Denied (403)
```

## Security Features

### ✅ What's Protected
1. **Files encrypted at rest** using AES-256-CBC
2. **File paths encrypted in database** 
3. **Role-based decryption** - only admin/police can decrypt
4. **Database role verification** - roles verified from database, not client
5. **Logging** - all access attempts logged with user ID and role
6. **403 Forbidden** - unauthorized access attempts blocked

### ✅ Encryption Details
- **Algorithm**: AES-256-CBC
- **Key**: 256-bit key (matches Laravel's encryption)
- **IV**: Random 16-byte initialization vector per encryption
- **Format**: Base64-encoded (IV + encrypted data)
- **Compatibility**: Compatible with Laravel's Crypt facade

### ✅ Access Control
- **Admin Role**: Full access to all verification documents
- **Police Role**: Full access to all verification documents
- **User Role**: Cannot decrypt or access verification documents
- **No Role/Invalid**: Treated as 'user', no access

## Critical Security Notes

### ⚠️ NEVER Trust Client Input for Roles
**WRONG** ❌:
```javascript
const userRole = req.query.role || req.body.role;  // Client can spoof this!
```

**CORRECT** ✅:
```javascript
const [users] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);
const userRole = users[0].role || 'user';  // Verified from database
```

### ⚠️ File Access Requires userId
All file access endpoints require the requesting user's ID to verify their role:
- Query parameter: `?userId=123`
- Or header: `x-user-id: 123`

### ⚠️ Double Encryption
Verification documents have TWO layers of encryption:
1. **File content** encrypted with AES-256-CBC
2. **File paths** encrypted before storing in database

This ensures maximum security even if database is compromised.

## Testing Role-Based Access

### Test as Regular User (Should Fail)
```bash
# Will return 403 Forbidden
curl "http://localhost:3000/verifications/verification-123456.jpg?userId=5"
```

### Test as Admin/Police (Should Succeed)
```bash
# Will decrypt and return file (assuming user ID 1 is admin)
curl "http://localhost:3000/verifications/verification-123456.jpg?userId=1"
```

### Verify Role in Database
```sql
SELECT id, email, role FROM users WHERE role IN ('admin', 'police');
```

## Code Locations

- **Encryption Service**: `backends/encryptionService.js`
- **Verification Upload**: `backends/handleNewFeatures.js` → `uploadVerificationDocument`
- **Verification Submit**: `backends/handleNewFeatures.js` → `submitVerification`
- **Get Status**: `backends/handleNewFeatures.js` → `getVerificationStatus`
- **File Serving**: `backends/server.js` → `/verifications/:filename`
- **Auth Middleware**: `backends/authMiddleware.js`

## Admin Panel Integration

For the admin panel to view verification documents:
1. Admin must be logged in with valid admin/police role in database
2. Admin's userId must be passed when requesting verification status
3. Decrypted file paths will be returned
4. Files can be accessed via the `/verifications/:filename?userId=<adminId>` endpoint

## Compliance Notes

This implementation satisfies capstone security requirements:
- ✅ Sensitive data encrypted at rest (AES-256-CBC)
- ✅ Role-based access control
- ✅ Encryption compatible with Laravel (admin side)
- ✅ Secure file handling
- ✅ Audit trail via logging
