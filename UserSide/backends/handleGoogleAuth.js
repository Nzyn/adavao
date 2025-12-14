```javascript
const db = require("./db");
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
// TODO: Replace with your actual Google Web Client ID
const CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID; // Support both naming conventions
const client = new OAuth2Client(CLIENT_ID);
const { sendOtpInternal, verifyOtpInternal } = require('./handleOtp');

// Handle Google Sign-In (Legacy - kept for older logic just in case, but updated)
const handleGoogleLogin = async (req, res) => {
  const { googleId, email, firstName, lastName, profilePicture } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({ message: "Google ID and email are required" });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT * FROM users_public WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      // User exists - log them in
      const user = existingUsers[0];

      // Update google_id if not set
      if (!user.google_id) {
        await db.query(
          "UPDATE users_public SET google_id = ? WHERE id = ?",
          [googleId, user.id]
        );
      }

      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } else {
      // NEW USER - REQUIRE PHONE NUMBER
      // Do NOT create user yet. Return 202 Accepted (Processing) or 200 with flag.
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
    res.status(500).json({ message: "Error processing Google login", error: err.message });
  }
};

// Verify Google ID token (optional but recommended for production)
const verifyGoogleToken = async (idToken) => {
  try {
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
      "SELECT * FROM users_public WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      // Update google_id if not set
      if (!existingUser.google_id) {
        await db.query(
          "UPDATE users_public SET google_id = ? WHERE id = ?",
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

      /* PREVIOUS DIRECT LOGIN CODE COMMENTED OUT
      // Update last login
      await db.query('UPDATE users_public SET last_login = NOW() WHERE id = ?', [existingUser.id]);

      res.json({
        message: 'Google login successful',
        user: existingUser,
        token: 'dummy-token-jwt-implementation-todo' // TODO: Implement JWT if needed
      });
      */

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

    const [users] = await db.query('SELECT * FROM users_public WHERE id = ?', [userId]);
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
    await db.query('UPDATE users_public SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      message: 'Login successful',
      user: user,
      token: 'dummy-token-jwt-implementation-todo'
    });

  } catch (error) {
    console.error('Google OTP Verify Error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
}

module.exports = {
  handleGoogleLogin,
  handleGoogleLoginWithToken,
  handleGoogleOtpVerify,
  verifyGoogleToken
};
```
