// emailService.js - Using SendGrid HTTP API (works on Render free tier)
// SendGrid uses HTTP instead of SMTP, avoiding Render's SMTP blocking

/**
 * Send email using SendGrid HTTP API
 * @param {object} options - Email options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendEmail = async (options) => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not set in environment variables');
    return { success: false, error: 'Email service not configured' };
  }

  console.log('📧 Sending email via SendGrid:', {
    to: options.to,
    subject: options.subject,
    from: options.from
  });

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }]
        }],
        from: {
          email: options.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@alertdavao.com',
          name: options.fromName || 'AlertDavao'
        },
        subject: options.subject,
        content: [{
          type: 'text/html',
          value: options.html
        }]
      }),
    });

    if (response.status === 202) {
      console.log('✅ Email sent successfully via SendGrid');
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ SendGrid API error:', response.status, errorData);
      return { success: false, error: errorData.errors?.[0]?.message || `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email
const sendVerificationEmail = async (email, token, userName) => {
  const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - AlertDavao',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1D3557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1D3557; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AlertDavao</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for registering with AlertDavao.</p>
            <p>Please click the button below to verify your email address and activate your account:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1D3557;">${verificationUrl}</p>
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            <p>If you did not create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>AlertDavao Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, userName) => {
  const resetUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - AlertDavao',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1D3557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1D3557; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AlertDavao</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1D3557;">${resetUrl}</p>
            <p><strong>This password reset link will expire in 1 hour.</strong></p>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>AlertDavao Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

// Send account lockout notification email
const sendLockoutEmail = async (email, userName, attemptCount) => {
  return sendEmail({
    to: email,
    fromName: 'AlertDavao Security',
    subject: 'Security Alert: Account Locked - AlertDavao',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .info-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Security Alert</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>This is a security alert regarding your AlertDavao account.</p>
            
            <div class="alert-box">
              <strong>⚠️ Account Temporarily Locked</strong>
              <p>Your account has been locked due to <strong>${attemptCount} consecutive failed login attempts</strong>.</p>
              <p><strong>Lockout Duration:</strong> 15 minutes</p>
            </div>
            
            <div class="info-box">
              <strong>Security Recommendations:</strong>
              <ul>
                <li>If this was you, please wait 15 minutes and try again with the correct password</li>
                <li>If this was NOT you, someone may be trying to access your account</li>
                <li>Consider changing your password after regaining access</li>
                <li>Enable two-factor authentication if available</li>
              </ul>
            </div>
            
            <p>If you did not attempt to log in, please reset your password immediately:</p>
            <center>
              <a href="${process.env.BACKEND_URL || 'http://localhost:3000'}/forgot-password" class="button">Reset Password</a>
            </center>
            
            <div class="footer">
              <p>This is an automated security notification from AlertDavao.</p>
              <p>Stay safe!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLockoutEmail,
};
