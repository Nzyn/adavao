const db = require("./db");

// Verify email with token
const handleVerifyEmail = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  try {
    // Find user with this token in users_public table (UserSide app users only)
    const [rows] = await db.query(
      "SELECT * FROM users_public WHERE verification_token = $1 AND token_expires_at > NOW() AND email_verified_at IS NULL",
      [token]
    );

    if (rows.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Link Expired - AlertDavao</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              padding: 40px;
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .error-icon {
              width: 80px;
              height: 80px;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
            }
            .x-mark {
              width: 40px;
              height: 40px;
              stroke: white;
              stroke-width: 3;
              stroke-linecap: round;
            }
            h1 { color: #1D3557; font-size: 28px; margin-bottom: 16px; }
            p { color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 16px; }
            .info {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 16px;
              margin-top: 24px;
              font-size: 14px;
              color: #991b1b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">
              <svg class="x-mark" viewBox="0 0 52 52">
                <line x1="16" y1="16" x2="36" y2="36"/>
                <line x1="36" y1="16" x2="16" y2="36"/>
              </svg>
            </div>
            <h1>Link Expired or Invalid</h1>
            <p>This verification link is invalid, has already been used, or has expired.</p>
            <div class="info">
              ⚠️ If you need a new verification link, please contact support or register again.
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const user = rows[0];

    // Mark email as verified
    await db.query(
      "UPDATE users_public SET email_verified_at = NOW(), verification_token = NULL, token_expires_at = NULL WHERE id = $1",
      [user.id]
    );

    console.log("✅ Email verified successfully for:", user.email);

    // Return HTML success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - AlertDavao</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .success-icon {
            width: 80px;
            height: 80px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            animation: scaleIn 0.5s ease-out 0.2s both;
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          .checkmark {
            width: 40px;
            height: 40px;
            stroke: white;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          h1 {
            color: #1D3557;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .email {
            color: #1D3557;
            font-weight: 600;
          }
          .info {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 16px;
            margin-top: 24px;
            font-size: 14px;
            color: #6b7280;
          }
          .close-message {
            margin-top: 16px;
            font-size: 13px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">
            <svg class="checkmark" viewBox="0 0 52 52">
              <polyline points="14 27 22 35 38 19"/>
            </svg>
          </div>
          <h1>Email Verified!</h1>
          <p>
            Your email address <span class="email">${user.email}</span> has been successfully verified.
          </p>
          <div class="info">
            ✅ Your account is now active!<br>
            You can close this window and login to AlertDavao.
          </div>
          <p class="close-message">
            This window will close automatically in <span id="countdown">5</span> seconds...
          </p>
        </div>
        <script>
          let seconds = 5;
          const countdownEl = document.getElementById('countdown');
          const closeMessageEl = document.querySelector('.close-message');
          const timer = setInterval(() => {
            seconds--;
            countdownEl.textContent = seconds;
            if (seconds <= 0) {
              clearInterval(timer);
              // Try to close the window
              try {
                window.close();
              } catch (e) {
                // If close fails, show message
              }
              // After a brief delay, if still open, show manual close message
              setTimeout(() => {
                closeMessageEl.innerHTML = '<strong style="color: #10b981;">✓ Verification Complete!</strong><br>You can now close this tab and login to AlertDavao.';
              }, 500);
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({
      message: "Server error during email verification",
      error: error.message || "Unknown error"
    });
  }
};

// Resend verification email
const handleResendVerification = async (req, res) => {
  const { email } = req.body;
  const { sendVerificationEmail } = require("./emailService");
  const { generateToken, getVerificationTokenExpiry, formatTimestamp } = require("./tokenUtils");

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find user in users_public table (UserSide app users only)
    const [rows] = await db.query("SELECT * FROM users_public WHERE email = $1", [email]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found. This account may be restricted to the AdminSide application."
      });
    }

    const user = rows[0];

    // Check if already verified
    if (user.email_verified_at) {
      return res.status(400).json({
        message: "This email address is already verified.",
        alreadyVerified: true
      });
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const tokenExpiresAt = formatTimestamp(getVerificationTokenExpiry());

    await db.query(
      "UPDATE users_public SET verification_token = $1, token_expires_at = $2 WHERE id = $3",
      [verificationToken, tokenExpiresAt, user.id]
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken, user.firstname);

    if (!emailResult.success) {
      return res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
        error: emailResult.error
      });
    }

    console.log("✅ Verification email resent to:", email);

    res.json({
      success: true,
      message: "Verification email has been sent! Please check your inbox."
    });

  } catch (error) {
    console.error("❌ Resend verification error:", error);
    res.status(500).json({
      message: "Server error while resending verification email",
      error: error.message || "Unknown error"
    });
  }
};

module.exports = {
  handleVerifyEmail,
  handleResendVerification,
};
