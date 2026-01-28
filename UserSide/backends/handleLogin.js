// handleLogin.js
const bcrypt = require("bcryptjs");
const db = require("./db");
const { checkUserRestrictions } = require("./handleUserRestrictions");

// Sanitize email input
const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.toString().trim().toLowerCase().replace(/[<>'"]/g, '');
};

const wildcardToRegex = (pattern) => {
  // Support SQL-style % and glob-style * wildcards
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
};

const isAllowedTestPatrolEmail = (email) => {
  const patternsRaw = process.env.TEST_PATROL_EMAIL_PATTERNS || 'dansoypatrol%@mailsac.com';
  const patterns = patternsRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (patterns.length === 0) return false;
  return patterns.some(p => wildcardToRegex(p).test(email));
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body;

  // Sanitize inputs
  const sanitizedEmail = sanitizeEmail(email);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate password presence (allow existing accounts with older passwords)
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    console.log("📩 Login attempt:", { email: sanitizedEmail });

    // 1. Query user from users_public table (UserSide app users only)
    const [rows] = await db.query("SELECT * FROM users_public WHERE email = $1", [sanitizedEmail]);
    console.log("📊 Query result:", rows.length > 0 ? "User found" : "User not found");

    if (rows.length === 0) {
      // User not found in users_public.
      // For patrol testing only: allow pulling a patrol_officer account from AdminSide (user_admin)
      // and syncing it into users_public (mobile app source of truth).
      console.log("⚠️ User not found in users_public table for:", sanitizedEmail);

      if (isAllowedTestPatrolEmail(sanitizedEmail)) {
        try {
          const [adminRows] = await db.query(
            'SELECT id, firstname, lastname, email, contact, password, email_verified_at, user_role FROM user_admin WHERE email = $1 LIMIT 1',
            [sanitizedEmail]
          );

          if (adminRows.length > 0 && String(adminRows[0].user_role || '').toLowerCase() === 'patrol_officer') {
            const adminUser = adminRows[0];

            // Ensure the patrol user exists in users_public for UserSide login
            await db.query(
              `INSERT INTO users_public (
                  firstname, lastname, email, contact, password,
                  user_role, is_on_duty,
                  email_verified_at,
                  created_at, updated_at
                )
                SELECT $1, $2, $3, $4, $5, 'patrol_officer', FALSE, COALESCE($6, NOW()), NOW(), NOW()
                WHERE NOT EXISTS (
                  SELECT 1 FROM users_public WHERE LOWER(email) = LOWER($3)
                )`,
              [adminUser.firstname, adminUser.lastname, adminUser.email, adminUser.contact, adminUser.password, adminUser.email_verified_at]
            );

            // Ensure role + verified timestamp are set (testing convenience)
            await db.query(
              `UPDATE users_public
               SET user_role = 'patrol_officer',
                   email_verified_at = COALESCE(email_verified_at, COALESCE($2, NOW())),
                   updated_at = NOW()
               WHERE LOWER(email) = LOWER($1)`,
              [adminUser.email, adminUser.email_verified_at]
            );

            const [syncedRows] = await db.query('SELECT * FROM users_public WHERE email = $1', [sanitizedEmail]);
            if (syncedRows.length > 0) {
              console.log('✅ Synced patrol user from user_admin into users_public:', sanitizedEmail);
              rows.push(syncedRows[0]);
            }
          }
        } catch (syncError) {
          console.warn('⚠️ Patrol sync attempt failed:', syncError.message);
        }
      }

      if (rows.length === 0) {
        return res.status(401).json({
          message: "The provided credentials do not match our records. This account may be restricted to the AdminSide application.",
          userNotFound: true
        });
      }
    }

    const user = rows[0];
    console.log("👤 Found user:", user.email);

    // 2. Check if account is locked
    if (user.lockout_until) {
      const lockoutTime = new Date(user.lockout_until);
      const now = new Date();

      if (now < lockoutTime) {
        const remainingMinutes = Math.ceil((lockoutTime - now) / (1000 * 60));
        console.log("🔒 Account locked for:", user.email, "Remaining:", remainingMinutes, "minutes");
        return res.status(403).json({
          message: `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          accountLocked: true,
          lockoutUntil: user.lockout_until
        });
      } else {
        // Lockout expired, reset attempts
        await db.query(
          "UPDATE users_public SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1",
          [user.id]
        );
        user.failed_login_attempts = 0;
        user.lockout_until = null;
      }
    }

    // 3. Check if email is verified
    if (!user.email_verified_at) {
      console.log("🚫 Email not verified for:", user.email);
      return res.status(403).json({
        message: "Please verify your email address before logging in. Check your inbox for the verification link.",
        emailNotVerified: true,
        email: user.email
      });
    }

    // 4. Check for user restrictions BEFORE password verification
    try {
      const restrictions = await checkUserRestrictions(user.id);

      if (restrictions.isRestricted) {
        console.log("🚫 User is restricted:", restrictions.restrictionType);

        // If user is banned, deny login completely
        if (restrictions.restrictionType === 'banned') {
          return res.status(403).json({
            message: "Your account has been suspended",
            restricted: true,
            restrictionType: restrictions.restrictionType,
            reason: restrictions.reason,
            expiresAt: restrictions.expiresAt
          });
        }

        // For other restrictions, allow login but include restriction info
        console.log("⚠️ User has active restrictions but can still login");
      }
    } catch (restrictionError) {
      // If restriction check fails (e.g., tables don't exist yet), continue with login
      console.log("⚠️ Could not check restrictions (tables may not exist):", restrictionError.message);
    }

    // 5. Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log("❌ Invalid password for:", sanitizedEmail);

      // Increment failed login attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      let lockoutUntil = null;
      let lockoutMessage = "";

      if (newAttempts >= 15) {
        // 15+ attempts: 15 minute lockout + email alert
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        lockoutMessage = "Account locked for 15 minutes due to 15 failed login attempts. A security alert has been sent to your email.";

        // Send email notification (if email service is configured)
        try {
          const { sendLockoutEmail } = require('./emailService');
          await sendLockoutEmail(user.email, user.firstname, newAttempts);
        } catch (emailError) {
          console.error("Failed to send lockout email:", emailError.message);
        }
      } else if (newAttempts >= 10) {
        // 10-14 attempts: 10 minute lockout
        lockoutUntil = new Date(Date.now() + 10 * 60 * 1000);
        lockoutMessage = "Account locked for 10 minutes due to multiple failed login attempts.";
      } else if (newAttempts >= 5) {
        // 5-9 attempts: 5 minute lockout
        lockoutUntil = new Date(Date.now() + 5 * 60 * 1000);
        lockoutMessage = "Account locked for 5 minutes due to multiple failed login attempts.";
      }

      // Update database with new attempt count and lockout time
      await db.query(
        "UPDATE users_public SET failed_login_attempts = $1, lockout_until = $2, last_failed_login = NOW() WHERE id = $3",
        [newAttempts, lockoutUntil, user.id]
      );

      if (lockoutUntil) {
        return res.status(403).json({
          message: lockoutMessage,
          accountLocked: true,
          lockoutUntil: lockoutUntil
        });
      } else {
        const remainingAttempts = 5 - newAttempts;
        return res.status(401).json({
          message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`
        });
      }
    }

    // 6. Password verified - reset failed login attempts
    await db.query(
      "UPDATE users_public SET failed_login_attempts = 0, lockout_until = NULL, last_failed_login = NULL WHERE id = $1",
      [user.id]
    );

    // 7. Get any active restrictions to include in response
    let userRestrictions = null;
    try {
      userRestrictions = await checkUserRestrictions(user.id);
    } catch (err) {
      // Ignore if tables don't exist
    }

    // 8. Return full user data for login
    console.log("✅ Login successful for:", user.email);

    // Role normalization: DB uses `user_role` but older clients may read `role`.
    const effectiveRole = user.user_role || user.role || 'user';

    // Return complete user data
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastName: user.lastname,
        email: user.email,
        contact: user.contact,
        phone: user.contact,
        address: user.address || '',
        is_verified: user.is_verified,
        profile_image: user.profile_image,
        user_role: effectiveRole,
        role: effectiveRole,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        emailVerified: Boolean(user.email_verified_at)
      },
      restrictions: userRestrictions
    });
  } catch (error) {
    // ✅ Print full error details in terminal
    console.error("❌ Login error occurred:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message || error.sqlMessage || "Unknown error",
    });
  }
};

module.exports = handleLogin;
