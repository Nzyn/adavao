# UserSide Authentication Migration - Complete

## Overview

All UserSide authentication files have been updated to use the new `users_public` table instead of the old `users` table. This ensures complete authentication isolation between UserSide app users and AdminSide admin/police users.

---

## Files Updated

### 1. **handleRegister.js**
- ✅ Changed table: `users` → `users_public`
- Inserts new app users into `users_public`
- All registration flows now use `users_public`

### 2. **handleLogin.js**
- ✅ Changed table: `users` → `users_public` (3 locations)
- Only queries `users_public` table for app users
- Rejects admin/police users (not found in `users_public`)
- All password validation and lockout logic uses `users_public`

### 3. **handleEmailVerification.js**
- ✅ Changed table: `users` → `users_public` (4 locations)
- Email verification tokens looked up in `users_public`
- Resend verification queries `users_public`
- Prevents admin/police from verifying emails via this endpoint

### 4. **handlePasswordReset.js**
- ✅ Changed table: `users` → `users_public` (5 locations)
- Password reset tokens handled in `users_public`
- Forgot password only works for `users_public` users
- Reset password endpoint queries `users_public`

### 5. **handleUserProfile.js**
- ✅ Changed table: `users` → `users_public` (6 locations)
- Get user: `users_public`
- Upsert user: `users_public`
- Update station: `users_public`
- Update address: `users_public`
- Get user station: `users_public` JOIN with police_stations

### 6. **handleGoogleAuth.js**
- ✅ Changed table: `users` → `users_public` (6 locations)
- Google login checks `users_public`
- Google registration inserts into `users_public`
- Both handlers (with/without token) use `users_public`

---

## Authentication Flow - UserSide

```
User Registration:
  1. Form submission → handleRegister.js
  2. Validate email & password
  3. Insert into users_public table
  4. Generate verification token
  5. Send verification email
  6. Redirect to login

User Login:
  1. Form submission → handleLogin.js
  2. Validate email format
  3. Query users_public table ONLY
  4. If not found → Error (admin/police rejected)
  5. Check account lockout
  6. Check email verified
  7. Verify password
  8. Reset login attempts
  9. Return user data

Email Verification:
  1. Click email link → handleEmailVerification.js
  2. Find token in users_public
  3. Mark email as verified in users_public
  4. Return success page

Password Reset:
  1. Request reset → handlePasswordReset.js (forgot password)
  2. Query users_public table
  3. Generate reset token
  4. Send reset email
  5. User clicks link → verify token
  6. User enters new password → handleResetPassword
  7. Update password in users_public

Google Sign-In:
  1. User clicks Google button → handleGoogleAuth.js
  2. Query users_public table
  3. If exists → Login with existing account
  4. If not exists → Create new user in users_public
  5. Return user data
```

---

## Security Isolation

### UserSide App Users
- Table: `users_public`
- Can ONLY register/login via UserSide
- Cannot access AdminSide
- Blocked from admin endpoints by table isolation

### AdminSide Admin/Police Users
- Table: `user_admin`
- Can ONLY register/login via AdminSide
- Cannot access UserSide
- Rejected at UserSide login (table doesn't exist in their table)

### Cross-Side Prevention
If an admin/police user tries to login to UserSide:
```javascript
// In handleLogin.js
const [rows] = await db.query("SELECT * FROM users_public WHERE email = ?", [email]);
if (rows.length === 0) {
  // Admin/police user not found in users_public
  return "The provided credentials do not match our records. This account may be restricted to the AdminSide application."
}
```

---

## Query Summary

### All user queries now use `users_public`:

```javascript
// Registration
INSERT INTO users_public (...)

// Login
SELECT * FROM users_public WHERE email = ?

// Email verification
SELECT * FROM users_public WHERE verification_token = ?
UPDATE users_public SET email_verified_at = ?

// Password reset
SELECT * FROM users_public WHERE reset_token = ?
UPDATE users_public SET password = ?

// Profile management
SELECT * FROM users_public WHERE id = ?
UPDATE users_public SET ...

// Google auth
SELECT * FROM users_public WHERE email = ?
INSERT INTO users_public (...)
```

---

## Validation Checklist

- [x] handleRegister.js uses `users_public`
- [x] handleLogin.js uses `users_public` (all queries)
- [x] handleEmailVerification.js uses `users_public` (all queries)
- [x] handlePasswordReset.js uses `users_public` (all queries)
- [x] handleUserProfile.js uses `users_public` (all operations)
- [x] handleGoogleAuth.js uses `users_public` (all queries)
- [x] All INSERT operations target `users_public`
- [x] All SELECT operations query `users_public`
- [x] All UPDATE operations modify `users_public`
- [x] Admin/police users rejected at UserSide login
- [x] Error messages clarify AdminSide vs UserSide

---

## Testing Recommendations

### Test Cases

1. **UserSide Registration**
   - Register new user → Should insert into `users_public`
   - Verify email link → Should verify in `users_public`
   - Login with verified account → Should work

2. **UserSide Login Security**
   - Attempt login with admin email → Should fail with "restricted to AdminSide"
   - Attempt login with police email → Should fail with "restricted to AdminSide"
   - Login with app user email → Should work

3. **Password Management**
   - Reset password (UserSide) → Should work for `users_public` users
   - Try to reset as admin → Should fail (not in `users_public`)

4. **Email Verification**
   - Resend verification → Should work for `users_public`
   - Try to verify with admin token → Should fail

5. **Google Auth**
   - New user via Google → Should create in `users_public`
   - Existing user via Google → Should login from `users_public`

### Cross-Side Testing

- Confirm `users` table still exists (backup)
- Confirm `users_public` contains only app users
- Confirm `user_admin` contains only admin/police users
- No user can access both sides with same credentials

---

## Important Notes

### For Backend Development

1. **Always query the correct table:**
   ```javascript
   // UserSide endpoints → users_public
   db.query("SELECT * FROM users_public WHERE id = ?", [id])
   
   // AdminSide endpoints → user_admin
   db.query("SELECT * FROM user_admin WHERE id = ?", [id])
   ```

2. **No mixing of tables:**
   - UserSide cannot access `user_admin` data
   - AdminSide cannot access `users_public` data
   - This is enforced at application level

3. **Error messages should not leak information:**
   - Don't reveal which table an email exists in
   - Generic messages: "Credentials do not match"
   - Clarify side: "...may be restricted to AdminSide"

### For Frontend Development

1. **Store authentication separately:**
   - UserSide token for app users
   - AdminSide token for admin/police users
   - Never mix tokens between sides

2. **Differentiate login endpoints:**
   - `/login` - UserSide (users_public)
   - `/admin/login` - AdminSide (user_admin)
   - Different tokens, different storage

### For Database Maintenance

1. **Original users table:**
   - Still exists as backup
   - Can be safely renamed to `users_old` after validation
   - Should be deleted only after 1-2 weeks of production testing

2. **Data integrity:**
   - No foreign keys between app and admin users
   - Separate audit trails
   - Independent login attempt tracking

3. **Backups:**
   - Include both `users_public` and `user_admin` in backups
   - Separate restoration procedures if needed
   - Keep `users_old` backup for recovery

---

## Future Considerations

1. **Single Sign-On (SSO):**
   - Could allow users to have both app and admin accounts
   - Would require linking mechanism (separate from this implementation)
   - Currently kept separate for maximum security

2. **Account Migration:**
   - If user needs admin access, create separate `user_admin` account
   - App account (`users_public`) is not converted
   - Maintains role separation

3. **Unified Dashboard (Optional):**
   - Could create unified interface accessing both tables
   - Each user has separate account in each table
   - Requires separate authentication for each role

---

## Deployment Checklist

- [ ] Database migration applied (`0002_separate_users_and_implement_rbac.sql`)
- [ ] All backend files updated to use `users_public`
- [ ] Admin authentication updated to use `user_admin`
- [ ] Test UserSide registration → inserts to `users_public`
- [ ] Test UserSide login → rejects admin/police users
- [ ] Test AdminSide login → uses `user_admin` table
- [ ] Test AdminSide cannot access `users_public` data
- [ ] Test UserSide cannot access `user_admin` data
- [ ] Email verification working for both sides
- [ ] Password reset working for both sides
- [ ] Google auth working for UserSide (inserts to `users_public`)
- [ ] Login attempt tracking working separately
- [ ] Audit logs working on AdminSide only
- [ ] RBAC roles assigned to admin/police users
- [ ] Verify data migration completed successfully
- [ ] Monitor for errors in production
- [ ] After 1-2 weeks: Consider removing `users_old` backup

---

## Support & Troubleshooting

### Issue: "User not found" at UserSide login

**Possible Causes:**
1. User is in `user_admin` table (admin/police account)
2. User email doesn't exist in `users_public`
3. Email is case-sensitive in query

**Solution:**
- Check which table user exists in
- Verify email spelling and case
- Direct to appropriate login (UserSide vs AdminSide)

### Issue: AdminSide users cannot access user data

**Possible Causes:**
1. Code still querying `users` table
2. Relationships not updated in models
3. Missing `AdminUser` model references

**Solution:**
- Verify `user_admin` queries in controllers
- Check that models extend correct base model
- Update any JOIN queries to use correct tables

### Issue: Duplicate user data

**Possible Causes:**
1. Data migrated to both `users_public` AND `user_admin`
2. User registered before and after migration

**Solution:**
- Review migration logs
- Check which table is source of truth
- Delete duplicates in non-authoritative table

---

## Contact & Questions

For issues with this implementation:
1. Check the RBAC_AND_AUTH_IMPLEMENTATION.md for AdminSide details
2. Review this document for UserSide details
3. Check database logs for query errors
4. Verify table structures match schema

