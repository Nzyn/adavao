const db = require("./db");
const bcrypt = require("bcryptjs");
const { sendPasswordResetEmail } = require("./emailService");
const { generateToken, getResetTokenExpiry, formatForMySQL } = require("./tokenUtils");

// Request password reset (send email)
const handleForgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
     // Find user in users_public table (UserSide app users only)
     const [rows] = await db.query("SELECT * FROM users_public WHERE email = ?", [email]);

     if (rows.length === 0) {
       // Don't reveal if email exists or not (security best practice)
       return res.json({ 
         success: true,
         message: "If that email address is registered, a password reset link has been sent."
       });
     }

     const user = rows[0];

     // Check if email is verified
     if (!user.email_verified_at) {
       return res.status(400).json({ 
         message: "Your email address is not verified. Please verify your email before resetting your password.",
         emailNotVerified: true
       });
     }

     // Generate reset token
     const resetToken = generateToken();
     const tokenExpiresAt = formatForMySQL(getResetTokenExpiry());

     await db.query(
       "UPDATE users_public SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?",
       [resetToken, tokenExpiresAt, user.id]
     );

    // Send reset email
    const emailResult = await sendPasswordResetEmail(email, resetToken, user.firstname);

    if (!emailResult.success) {
      return res.status(500).json({ 
        message: "Failed to send password reset email. Please try again later.",
        error: emailResult.error
      });
    }

    console.log("✅ Password reset email sent to:", email);

    res.json({ 
      success: true,
      message: "Password reset link has been sent to your email address. Please check your inbox."
    });

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      message: "Server error while processing password reset request",
      error: error.message || error.sqlMessage || "Unknown error"
    });
  }
};

// Verify reset token (optional - for checking token validity)
const handleVerifyResetToken = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Reset token is required" });
  }

  try {
     const [rows] = await db.query(
       "SELECT email FROM users_public WHERE reset_token = ? AND reset_token_expires_at > NOW()",
       [token]
     );

     if (rows.length === 0) {
       return res.status(400).json({ 
         message: "This password reset link is invalid or has expired.",
         expired: true
       });
     }

    res.json({ 
      success: true,
      email: rows[0].email
    });

  } catch (error) {
    console.error("❌ Verify reset token error:", error);
    res.status(500).json({
      message: "Server error while verifying reset token",
      error: error.message || error.sqlMessage || "Unknown error"
    });
  }
};

// Reset password with token
const handleResetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  // Validate password requirements
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      message: "Password must contain minimum 8 characters with at least one letter, one number, and one symbol (@$!%*?&)" 
    });
  }

  try {
     // Find user with valid reset token in users_public table (UserSide app users only)
     const [rows] = await db.query(
       "SELECT * FROM users_public WHERE reset_token = ? AND reset_token_expires_at > NOW()",
       [token]
     );

     if (rows.length === 0) {
       return res.status(400).json({ 
         message: "This password reset link is invalid or has expired.",
         expired: true
       });
     }

     const user = rows[0];

     // Hash new password
     const hashedPassword = await bcrypt.hash(password, 10);

     // Update password and clear reset token
     await db.query(
       "UPDATE users_public SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?",
       [hashedPassword, user.id]
     );

    console.log("✅ Password reset successfully for:", user.email);

    res.json({ 
      success: true,
      message: "Your password has been reset successfully! You can now login with your new password."
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({
      message: "Server error while resetting password",
      error: error.message || error.sqlMessage || "Unknown error"
    });
  }
};

module.exports = {
  handleForgotPassword,
  handleVerifyResetToken,
  handleResetPassword,
};
