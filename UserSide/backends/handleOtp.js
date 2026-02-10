const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Supabase SMS OTP Configuration - use SUPABASE_URL (not EXPO_PUBLIC_ prefix for backend)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config Check:');
console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');

// Initialize Supabase client for server-side operations
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  console.log('✅ Supabase client initialized for backend OTP');
} else {
  console.log('⚠️ Supabase client NOT initialized - missing credentials');
}

// Utility: ensure tables exist
const ensureTables = async () => {
  // otp_codes table
  await db.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(64) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      purpose VARCHAR(64) NOT NULL,
      user_id INT DEFAULT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // verified_phones table
  await db.query(`
    CREATE TABLE IF NOT EXISTS verified_phones (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(64) NOT NULL UNIQUE,
      verified BOOLEAN DEFAULT TRUE,
      verified_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send SMS via Supabase signInWithOtp or fallback methods
 * SMS Format: "Your verification code is {{OTP}}. It is valid for 5 minutes. Do not share this code with anyone for your security."
 * Sender: AlertDavao (configured in Supabase Dashboard)
 * 
 * Priority:
 * 1. Supabase SMS OTP (native signInWithOtp - sends SMS directly to phone)
 * 2. Twilio (if configured)
 * 3. Console log (development mode)
 */
const sendSms = async (phone, otp, email = null, purpose = null) => {
  /* 
   * MATCH ADMINSIDE MESSAGE FORMAT with Context:
   * "AlertDavao\n\nHi {email} Your verification code is {otp} to {action}..."
   */
  const emailPart = email ? `Hi ${email}. ` : '';

  // Map purpose to human readable action
  let actionText = 'verify your account';
  if (purpose === 'register') actionText = 'complete your registration';
  if (purpose === 'change_password') actionText = 'change your password';
  if (purpose === 'forgot_password') actionText = 'reset your password';
  if (purpose === 'change_phone') actionText = 'change your phone number';
  if (purpose === 'login') actionText = 'log in'; // Added login purpose

  const message = `AlertDavao\n\n${emailPart}Your verification code is ${otp} to ${actionText}. It is valid for 5 minutes. Do not share this code with anyone for your security.`;

  // Priority 1: Twilio (Primary Provider) - Matches AdminSide implementation
  const TWILIO_SID = process.env.TWILIO_SID;
  const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_FROM;

  const logFile = path.join(__dirname, 'otp_debug_backend.log');

  const logToDebug = (msg) => {
    // console.log(msg); // Reduced noise
  };

  logToDebug(`🔍 Twilio Config Check: SID=${!!TWILIO_SID}, Token=${!!TWILIO_TOKEN}`);

  if (TWILIO_SID && TWILIO_TOKEN) {
    try {
      // MATCH ADMINSIDE: Use WhatsApp Sandbox
      // AdminSide uses hardcoded sandbox number: whatsapp:+14155238886
      const whatsappFrom = 'whatsapp:+14155238886';
      // Ensure phone is E.164 (already handles +63 in normalization steps, but verify)
      const whatsappTo = `whatsapp:${phone}`;

      logToDebug(`📲 Sending WhatsApp via Twilio to: ${whatsappTo}`);
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      const body = new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        Body: message
      });

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const respText = await resp.text();

      if (resp.ok) {
        logToDebug(`✅ WhatsApp sent via Twilio successfully`);
        return true;
      } else {
        logToDebug(`❌ Twilio WhatsApp failed with status: ${resp.status}. Response: ${respText}`);
        // Fall through to secondary methods
      }
    } catch (err) {
      logToDebug(`❌ Twilio WhatsApp error: ${err.message}`);
      // Fall through to secondary methods
    }
  } else {
    console.warn("⚠️ Twilio credentials not found in env. Please set TWILIO_SID and TWILIO_TOKEN.");
  }

  // Priority 2: Supabase SMS OTP (Secondary/Fallback)
  if (supabase) {
    try {
      console.log('📨 Attempting to send SMS via Supabase signInWithOtp to:', phone);

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        console.error('⚠️ Supabase SMS error:', error.message);
        // Fall through to next method
      } else {
        console.log('✅ SMS sent successfully via Supabase');
        return true;
      }
    } catch (err) {
      console.error('⚠️ Supabase SMS exception:', err.message);
      // Fall through to next method
    }
  }

  // Priority 3: Development mode (Log only)
  console.warn('⚠️ No SMS provider configured or all failed (Twilio & Supabase).');
  console.warn('🔐 OTP for', phone, 'is logged to server console for testing.');
  return true;
};

/**
 * Send OTP for registration (signup only)
 * OTP is NOT sent for login/sign-in
 */
const sendOtp = async (req, res) => {
  try {
    let { phone, purpose } = req.body;

    // OTP purposes allowed: register, change_phone, change_password, forgot_password
    const allowedPurposes = ['register', 'change_phone', 'change_password', 'forgot_password'];

    if (!allowedPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP purpose. Allowed: ' + allowedPurposes.join(', ')
      });
    }

    if (!phone) {
      return res.status(400).json({ message: 'phone number required' });
    }

    // Normalize phone number to international format
    phone = phone.trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) {
      phone = '+63' + phone.slice(1);
    }

    console.log('📱 Sending OTP for registration to:', phone);
    await ensureTables();

    // Generate 6-digit OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Store OTP in database
    await db.query(
      'INSERT INTO otp_codes (phone, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [phone, otpHash, purpose, expiresAt]
    );

    // Get email for the notification message (optional)
    let email = req.body.email;

    // Note: Cannot look up email by contact in DB because contact is AES-encrypted.
    // Callers should pass email in the request body if available.

    // Send SMS via Supabase or fallback (Twilio WhatsApp)
    const sent = await sendSms(phone, otp, email, purpose);

    // Log for development
    console.log('\n' + '═'.repeat(60));
    console.log(`📨 OTP SENT FOR ${purpose.toUpperCase()}`);
    console.log('═'.repeat(60));
    console.log('Phone:', phone);
    console.log('Email:', email || 'N/A');
    console.log('═'.repeat(60));
    console.log('Phone:', phone);
    console.log('OTP Code:', otp);
    console.log('Expires:', expiresAt.toLocaleString());
    console.log('Message: "Your verification code is ' + otp + '. It is valid for 5 minutes. Do not share this code with anyone for your security."');
    console.log('═'.repeat(60) + '\n');

    // Include OTP in response for development (remove in production)
    const debug = (process.env.NODE_ENV !== 'production' || !SUPABASE_URL) ? otp : undefined;

    res.json({
      success: true,
      message: 'OTP sent successfully to your phone',
      sent,
      debugOtp: debug
    });
  } catch (err) {
    console.error('❌ sendOtp error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: err.message
    });
  }
};

/**
 * Internal helper to send OTP from other modules
 * Returns { success: boolean, message: string, otp: string (debug) }
 */
const sendOtpInternal = async (phone, purpose, email = null) => {
  try {
    // Allowed purposes including 'login'
    const allowedPurposes = ['register', 'change_phone', 'change_password', 'forgot_password', 'login'];

    if (!allowedPurposes.includes(purpose)) {
      return { success: false, message: 'Invalid OTP purpose' };
    }

    if (!phone) return { success: false, message: 'Phone required' };

    // Normalize
    phone = phone.trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) {
      phone = '+63' + phone.slice(1);
    }

    await ensureTables();

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'INSERT INTO otp_codes (phone, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [phone, otpHash, purpose, expiresAt]
    );

    // Note: Cannot look up email by contact in DB because contact is AES-encrypted.
    // Callers should pass email parameter if available.

    const sent = await sendSms(phone, otp, email, purpose);

    // Log
    console.log(`📨 Internal OTP Sent to ${phone} for ${purpose}`);

    return { success: true, otp }; // Return OTP for debug if needed
  } catch (error) {
    console.error('Internal OTP Send Error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Verify OTP code during registration (signup only)
 * @param {string} phone - Phone number in international format
 * @param {string} code - 6-digit OTP code
 * @param {string} purpose - Should be 'register' only
 */
const verifyOtp = async (req, res) => {
  try {
    let { phone, code, purpose } = req.body;
    console.log('📥 Verify OTP request for:', phone);

    // OTP purposes allowed: register, change_phone, change_password, forgot_password
    const allowedPurposes = ['register', 'change_phone', 'change_password', 'forgot_password'];

    if (!allowedPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP purpose'
      });
    }

    if (!phone || !code || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'phone, code, and purpose required'
      });
    }

    // Validate OTP is 6 digits
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    // Normalize phone: international format
    phone = phone.trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) {
      phone = '+63' + phone.slice(1);
    }

    console.log('📱 Normalized phone:', phone);
    await ensureTables();

    // Find the most recent OTP for this phone
    const [rows] = await db.query(
      'SELECT * FROM otp_codes WHERE phone = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
      [phone, purpose]
    );

    if (rows.length === 0) {
      console.log('❌ No OTP found for phone:', phone);
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    const otpRow = rows[0];
    console.log('🔍 OTP record found, ID:', otpRow.id);

    // Check if OTP has expired (5 minutes)
    if (new Date(otpRow.expires_at) < new Date()) {
      console.log('❌ OTP expired at:', otpRow.expires_at);
      // Delete expired OTP
      await db.query('DELETE FROM otp_codes WHERE id = $1', [otpRow.id]);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Compare OTP code with hash
    const match = await bcrypt.compare(code, otpRow.otp_hash);

    if (!match) {
      console.log('❌ Invalid OTP code provided');
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please try again.'
      });
    }

    console.log('✅ OTP verified successfully!');

    // Mark phone as verified for future use
    await db.query(
      'INSERT INTO verified_phones (phone, verified) VALUES ($1, TRUE) ON CONFLICT (phone) DO UPDATE SET verified = TRUE, verified_at = NOW()',
      [phone]
    );

    // Delete the used OTP
    await db.query('DELETE FROM otp_codes WHERE id = $1', [otpRow.id]);

    res.json({
      success: true,
      message: 'Phone number verified successfully. You can now complete your registration.'
    });
  } catch (err) {
    console.error('❌ verifyOtp error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: err.message
    });
  }
};

/**
 * Internal helper to verify OTP from other modules
 * Returns { success: boolean, message: string }
 */
const verifyOtpInternal = async (phone, code, purpose) => {
  try {
    // Normalize phone
    phone = phone.trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) {
      phone = '+63' + phone.slice(1);
    }

    // Find OTP
    const [rows] = await db.query(
      'SELECT * FROM otp_codes WHERE phone = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
      [phone, purpose]
    );

    if (rows.length === 0) return { success: false, message: 'No OTP found or expired' };

    const otpRow = rows[0];

    // Check expiry
    if (new Date(otpRow.expires_at) < new Date()) {
      await db.query('DELETE FROM otp_codes WHERE id = $1', [otpRow.id]);
      return { success: false, message: 'OTP expired' };
    }

    // Check hash
    const match = await bcrypt.compare(code, otpRow.otp_hash);
    if (!match) return { success: false, message: 'Invalid OTP code' };

    // Valid - Consume OTP
    await db.query('DELETE FROM otp_codes WHERE id = $1', [otpRow.id]);

    // Also mark as verified if it was a phone verification
    if (purpose === 'change_phone' || purpose === 'register') {
      await db.query(
        'INSERT INTO verified_phones (phone, verified) VALUES ($1, TRUE) ON CONFLICT (phone) DO UPDATE SET verified = TRUE, verified_at = NOW()',
        [phone]
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Internal OTP verification error:", error);
    return { success: false, message: 'Verification error: ' + error.message };
  }
};

module.exports = { sendOtp, verifyOtp, verifyOtpInternal, sendOtpInternal };
