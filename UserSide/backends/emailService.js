// emailService.js
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  console.log('📧 Email Config:', {
    user: process.env.EMAIL_USER,
    passLength: process.env.EMAIL_PASSWORD?.length,
    host: 'smtp.gmail.com',
    port: 587
  });
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password',
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, token, userName) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"AlertDavao" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, userName) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"AlertDavao" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send account lockout notification email
const sendLockoutEmail = async (email, userName, attemptCount) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"AlertDavao Security" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
    to: email,
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
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              <strong>Need Help?</strong><br>
              If you need assistance, contact AlertDavao support at support@alertdavao.com
            </p>
            
            <div class="footer">
              <p>This is an automated security notification from AlertDavao.</p>
              <p>Stay safe!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Account lockout email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending lockout email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLockoutEmail,
};
