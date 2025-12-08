const db = require("./db");
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
// TODO: Replace with your actual Google Web Client ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || '662961186057-3ski6ooemfi1j19k6b5nh6o648kk6pdp.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Handle Google Sign-In / Registration
const handleGoogleLogin = async (req, res) => {
  const { googleId, email, firstName, lastName, profilePicture } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({ message: "Google ID and email are required" });
  }

  try {
    // Check if user already exists with this email in users_public table (UserSide app users only)
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

      // Return user data (exclude password)
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } else {
      // New user - register with Google account
      const sql = `
        INSERT INTO users_public (
          firstname, 
          lastname, 
          email, 
          google_id, 
          profile_picture,
          password,
          contact,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      // Use a placeholder password for Google users (they won't use it)
      const placeholderPassword = 'GOOGLE_TEMP_' + googleId;

      const result = await db.query(sql, [
        firstName,
        lastName,
        email,
        googleId,
        profilePicture || null,
        placeholderPassword, // Not hashed since it won't be used
        null // No phone number from Google
      ]);

      // Get the newly created user
      const [newUsers] = await db.query(
        "SELECT * FROM users_public WHERE id = ?",
        [result[0].insertId]
      );

      const newUser = newUsers[0];
      const { password, ...userWithoutPassword } = newUser;

      return res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword
      });
    }
  } catch (err) {
    console.error("❌ Google login error:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Email already registered" });
    }

    res.status(500).json({
      message: "Error processing Google login",
      error: err.message || "Unknown error"
    });
  }
};

// Verify Google ID token (optional but recommended for production)
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
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

    // Same logic as handleGoogleLogin...
    const [existingUsers] = await db.query(
      "SELECT * FROM users_public WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      const user = existingUsers[0];

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
      const sql = `
        INSERT INTO users_public (
          firstname, 
          lastname, 
          email, 
          google_id, 
          profile_picture,
          password,
          contact,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const placeholderPassword = 'GOOGLE_TEMP_' + googleId;

      const result = await db.query(sql, [
        firstName,
        lastName,
        email,
        googleId,
        profilePicture || null,
        placeholderPassword,
        null
      ]);

      const [newUsers] = await db.query(
        "SELECT * FROM users_public WHERE id = ?",
        [result[0].insertId]
      );

      const newUser = newUsers[0];
      const { password, ...userWithoutPassword } = newUser;

      return res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword
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

module.exports = {
  handleGoogleLogin,
  handleGoogleLoginWithToken,
  verifyGoogleToken
};
