const db = require("./db");
const { OAuth2Client } = require('google-auth-library');
const { decrypt } = require('./encryptionService');

// Initialize Google OAuth client
const CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID; // Support both naming conventions
const client = new OAuth2Client(CLIENT_ID);
const { sendOtpInternal, verifyOtpInternal } = require('./handleOtp');

// Handle Google Sign-In - Simplified flow (OPTIMIZED for speed)
const handleGoogleLogin = async (req, res) => {
  const { googleId, email, firstName, lastName, profilePicture } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({ message: "Google ID and email are required" });
  }

  try {
    // OPTIMIZED: Single query to check user AND update google_id + last_login in one go
    const [existingUsers] = await db.query(
      `UPDATE users_public 
       SET google_id = COALESCE(google_id, $1), 
           last_login = NOW() 
       WHERE email = $2 
       RETURNING *`,
      [googleId, email]
    );

    if (existingUsers.length > 0) {
      // User exists - login successful
      const user = existingUsers[0];
      const { password, ...userWithoutPassword } = user;

      // 🔓 Decrypt sensitive fields for display
      if (userWithoutPassword.address) userWithoutPassword.address = decrypt(userWithoutPassword.address);
      if (userWithoutPassword.contact) userWithoutPassword.contact = decrypt(userWithoutPassword.contact);

      return res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } else {
      // NEW USER - Check if we have first/last name from Google
      if (!firstName || !lastName) {
        // Need to collect name from user
        return res.status(200).json({
          message: "Name required to complete registration",
          requiresName: true,
          googleInfo: {
            googleId,
            email,
            profilePicture
          }
        });
      }

      // Create new user with Google profile data (skip email verification - Google verified it)
      const insertResult = await db.query(
        `INSERT INTO users_public (google_id, email, firstname, lastname, profile_image, is_verified, email_verified, created_at) 
         VALUES ($1, $2, $3, $4, $5, true, true, NOW()) 
         RETURNING *`,
        [googleId, email, firstName, lastName, profilePicture || null]
      );

      const newUser = insertResult[0][0];
      const { password, ...userWithoutPassword } = newUser;

      return res.status(201).json({
        message: "Account created and logged in",
        user: userWithoutPassword,
        isNewUser: true
      });
    }
  } catch (err) {
    console.error("❌ Google login error:", err);
    res.status(500).json({ message: "Error processing Google login", error: err.message });
  }
};

// Verify Google ID token (optional but recommended for production)
const verifyGoogleToken = async (idToken) => {
  try {
    if (!CLIENT_ID) {
      console.warn('⚠️ GOOGLE_WEB_CLIENT_ID is not configured; cannot verify Google token');
      return null;
    }
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload['sub'],
      email: payload['email'],
      firstName: payload['given_name'],
      lastName: payload['family_name'],
      profilePicture: payload['picture'],
      emailVerified: payload['email_verified']
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
};

// Alternative handler using ID token verification (more secure)
const handleGoogleLoginWithToken = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    // Verify the token with Google
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    if (!googleUser.emailVerified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    // Use the verified user data
    const { googleId, email, firstName, lastName, profilePicture } = googleUser;

    const [existingUsers] = await db.query(
      "SELECT * FROM users_public WHERE email = $1",
      [email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      // Update google_id if not set
      if (!existingUser.google_id) {
        await db.query(
          "UPDATE users_public SET google_id = $1 WHERE id = $2",
          [googleId, existingUser.id]
        );
      }

      // [MODIFIED] instead of returning user directly, enforce OTP if phone exists
      if (!existingUser) {
        // Logic for new user response (requiresPhone) - effectively handled by standard login if needed
        // But here we know it's an existing user
        return res.status(500).json({ message: 'User found but variable missing' });
      }

      // Check if user has a valid phone number
      if (!existingUser.contact || existingUser.contact === '0000000000') {
        // Treat as if phone is needed
        return res.json({
          requiresPhone: true,
          googleInfo: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            profilePicture: googleUser.profilePicture,
          }
        });
      }

      // Send OTP
      const otpResult = await sendOtpInternal(existingUser.contact, 'login', existingUser.email);

      if (otpResult.success) {
        return res.json({
          requireOtp: true,
          userId: existingUser.id,
          email: existingUser.email,
          contact: existingUser.contact, // Mask this in production ideally
          message: 'OTP sent to your registered phone number'
        });
      } else {
        // Fallback if OTP fails? Should probably error out.
        // For now, if OTP fails to send, maybe allow login or show error?
        // Let's show error to be safe.
        return res.status(500).json({ message: 'Failed to send verification OTP: ' + otpResult.message });
      }

    } else {
      // NEW USER - REQUIRE PHONE NUMBER
      return res.status(200).json({
        message: "New user, phone number required",
        requiresPhone: true,
        googleInfo: {
          googleId,
          email,
          firstName,
          lastName,
          profilePicture
        }
      });
    }
  } catch (err) {
    console.error("❌ Google login error:", err);
    res.status(500).json({
      message: "Error processing Google login",
      error: err.message || "Unknown error"
    });
  }
};

// [NEW] Endpoint to verify OTP and finalize Google Login
const handleGoogleOtpVerify = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP required' });
    }

    const [users] = await db.query('SELECT * FROM users_public WHERE id = $1', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    // Verify OTP
    const verification = await verifyOtpInternal(user.contact, otp, 'login');

    if (!verification.success) {
      // Also try 'register' purpose in case it came from registration flow?
      // Actually registration flow should allow login after it.
      // Let's just stick to 'login' for this endpoint, registration uses 'register' and then maybe auto-logins?
      // If they just registered, they might have an OTP with purpose 'register'.
      // Let's try 'register' if 'login' fails.
      const vidReg = await verifyOtpInternal(user.contact, otp, 'register');
      if (!vidReg.success) {
        return res.status(400).json({ message: verification.message || 'Invalid OTP' });
      }
    }

    // Success - Log them in
    await db.query('UPDATE users_public SET last_login = NOW() WHERE id = $1', [user.id]);

    // 🔓 Decrypt sensitive fields for display
    if (user.address) user.address = decrypt(user.address);
    if (user.contact) user.contact = decrypt(user.contact);

    res.json({
      message: 'Login successful',
      user: user
    });

  } catch (error) {
    console.error('Google OTP Verify Error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
}

// [NEW] Complete Google registration when name is required
const handleGoogleCompleteRegistration = async (req, res) => {
  const { googleId, email, firstName, lastName, profilePicture } = req.body;

  if (!googleId || !email || !firstName || !lastName) {
    return res.status(400).json({ message: "Google ID, email, first name, and last name are required" });
  }

  try {
    // Check if user already exists (shouldn't but double-check)
    const [existingUsers] = await db.query(
      "SELECT * FROM users_public WHERE email = $1",
      [email]
    );

    if (existingUsers.length > 0) {
      // User already exists, just log them in
      const user = existingUsers[0];
      const { password, ...userWithoutPassword } = user;
      
      // 🔓 Decrypt sensitive fields for display
      if (userWithoutPassword.address) userWithoutPassword.address = decrypt(userWithoutPassword.address);
      if (userWithoutPassword.contact) userWithoutPassword.contact = decrypt(userWithoutPassword.contact);
      
      return res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    }

    // Create new user
    const insertResult = await db.query(
      `INSERT INTO users_public (google_id, email, firstname, lastname, profile_image, is_verified, email_verified, created_at) 
       VALUES ($1, $2, $3, $4, $5, true, true, NOW()) 
       RETURNING *`,
      [googleId, email, firstName, lastName, profilePicture || null]
    );

    const newUser = insertResult[0][0];
    const { password, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "Account created and logged in",
      user: userWithoutPassword,
      isNewUser: true
    });
  } catch (err) {
    console.error("❌ Google complete registration error:", err);
    res.status(500).json({ message: "Error completing registration", error: err.message });
  }
};

module.exports = {
  handleGoogleLogin,
  handleGoogleLoginWithToken,
  handleGoogleOtpVerify,
  handleGoogleCompleteRegistration,
  verifyGoogleToken
};
