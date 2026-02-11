const bcrypt = require("bcryptjs");
const db = require("./db");
const { sendVerificationEmail } = require("./emailService");
const { generateToken, getVerificationTokenExpiry, formatTimestamp } = require("./tokenUtils");
const { encrypt } = require("./encryptionService");

const handleRegister = async (req, res) => {
  const { firstname, lastname, email, contact, password } = req.body;

  if (!firstname || !lastname || !email || !contact || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format. Please enter a valid email address with @ and domain (e.g., user@gmail.com, admin@yahoo.com)"
    });
  }

  // Additional check for @ symbol
  if (!email.includes('@')) {
    return res.status(400).json({
      message: "Email must contain @ symbol. For example: nicolequim@gmail.com"
    });
  }

  // Validate password requirements: min 8 chars, letter, number, symbol
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password must contain minimum 8 characters with at least one letter, one number, and one symbol (@$!%*?&)"
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // ✅ hash password

    // Generate verification token
    const verificationToken = generateToken();
    const tokenExpiresAt = formatTimestamp(getVerificationTokenExpiry());

    // Encrypt sensitive data (contact/phone number)
    const encryptedContact = encrypt(contact);

    // Include NULL values for latitude and longitude, and add verification fields
    // Use users_public table for UserSide app users only
    const sql =
      "INSERT INTO users_public (firstname, lastname, email, contact, password, latitude, longitude, is_verified, verification_token, token_expires_at, email_verified_at) VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, $8, NULL)";
    await db.query(sql, [firstname, lastname, email, encryptedContact, hashedPassword, false, verificationToken, tokenExpiresAt]);

    console.log('📧 Sending verification email to:', email);

    // Send verification email with timeout (30 seconds)
    let emailResult;
    try {
      const emailPromise = sendVerificationEmail(email, verificationToken, firstname);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email sending timed out after 30 seconds')), 30000)
      );

      emailResult = await Promise.race([emailPromise, timeoutPromise]);
      console.log('📧 Email result:', emailResult);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Delete user if email fails
      await db.query("DELETE FROM users_public WHERE email = $1", [email]);

      return res.status(500).json({
        message: "Failed to send verification email. This could be due to email service issues. Please try again in a few moments.",
        error: emailError.message || "Email service timeout"
      });
    }

    if (!emailResult.success) {
      console.log('❌ Email failed, deleting user...');
      // If email fails, delete the user and return error
      await db.query("DELETE FROM users_public WHERE email = $1", [email]);
      return res.status(500).json({
        message: "Failed to send verification email. Please check your email address and try again.",
        error: emailResult.error
      });
    }

    console.log('✅ User registered and email sent successfully');
    res.status(201).json({
      message: "Registration successful! Please check your email for a verification link to activate your account. The link will expire in 24 hours.",
      email: email
    });
  } catch (err) {
    console.error("❌ Registration error:", err);

    // Provide more specific error messages
    if (err.code === '23505') {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({ message: "Database connection failed. Please check if the database is running." });
    }
    if (err.code === '28P01' || err.code === '28000') {
      return res.status(500).json({ message: "Database access denied. Please check credentials." });
    }

    res.status(500).json({
      message: "Error saving user",
      error: err.message || "Unknown error"
    });
  }
};

module.exports = handleRegister;