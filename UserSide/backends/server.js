const express = require("express");
const cors = require("cors");
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8081;

// Needed for correct req.ip behind proxies (e.g., Render)
app.set('trust proxy', 1);

// Performance: Enable gzip compression for responses
app.use(compression({
  filter: (req, res) => {
    // Don't compress small responses or already compressed
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level
}));

app.use(cors());

// Performance: Limit JSON body size to prevent abuse
app.use(express.json({ limit: '10mb' }));

// Performance: Import server-side cache middleware
const { cacheMiddleware, getCacheStats, clearCache } = require('./cacheMiddleware');
app.use(cacheMiddleware);

// API rate limiting for general endpoints (prevents abuse)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 300, // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (typeof rateLimit.ipKeyGenerator === 'function') return rateLimit.ipKeyGenerator(req);
    return req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});
app.use('/api', generalLimiter);

// Global rate limit for report submissions (extra safety; DB checks apply inside handler too)
const reportLimiter = rateLimit({
  windowMs: Number(process.env.REPORT_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
  limit: Number(process.env.REPORT_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (typeof rateLimit.ipKeyGenerator === 'function') return rateLimit.ipKeyGenerator(req);
    return req.ip;
  },
  message: {
    success: false,
    message: 'Too many report submissions. Please wait a few minutes and try again.'
  }
});

// Serve static files from 'evidence' directory
// DO NOT serve evidence as public static files.
// Evidence is encrypted at rest and must be decrypted only for authorized roles.
app.use('/verifications', express.static(path.join(__dirname, '../verifications'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
}));

const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
};


// Configure multer for evidence files (reports)
const evidenceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../evidence'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for verification files
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../verifications'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'verification-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const evidenceUpload = multer({
  storage: evidenceStorage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const verificationUpload = multer({
  storage: verificationStorage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const handleRegister = require("./handleRegister");
const { handleGoogleLogin, handleGoogleLoginWithToken, handleGoogleOtpVerify, handleGoogleCompleteRegistration } = require("./handleGoogleAuth");
const handleLogin = require("./handleLogin");
const { handleLogout, handlePatrolLogout } = require("./handleLogout");
const { handleVerifyEmail, handleResendVerification } = require("./handleEmailVerification");
const { handleForgotPassword, handleVerifyResetToken, handleResetPassword } = require("./handlePasswordReset");
const { handleChangePassword } = require("./handleChangePassword");
const {
  testConnection,
  getUserById,
  upsertUser,
  updateUserAddress,
  updateUserStation,
  getUserStation,
  executeQuery
} = require("./handleUserProfile");
const {
  upload: reportUpload,
  submitReport,
  getUserReports,
  getAllReports
} = require("./handleReport");
const {
  // Police Stations
  getAllPoliceStations,
  getPoliceStationById,
  getNearestStations,
  // User Roles
  getUserRoles,
  assignUserRole,
  // Verification
  submitVerification,
  uploadVerificationDocument,
  getVerificationStatus,
  updateVerification,
  approveVerification,
  rejectVerification,
  // Messages
  getUserConversations,
  getMessagesBetweenUsers,
  getUserMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead,
  getUnreadCount,
  updateUserTypingStatus,
  checkUserTypingStatus,
  // Crime Analytics
  getCrimeAnalytics,
  getAllCrimeAnalytics,
  // Crime Forecasts
  getCrimeForecasts
} = require("./handleNewFeatures");

// Add this new function for handling notifications
const { getUserNotifications, markNotificationAsRead } = require("./handleNotifications");

// Add flag status checking for debugging
const { checkUserFlagStatus } = require("./handleCheckFlagStatus");

// Add location service handler
const { searchLocation, reverseGeocode, getDistance } = require("./handleLocation");

// Add barangay handler
const { getAllBarangays, getBarangayByCoordinates } = require("./handleBarangays");

// Add police reports handler
const {
  getReportsByStation,
  getReportsByStationAndStatus,
  getStationDashboardStats
} = require("./getPoliceReports");

// Add auto-assign reports handler
const { autoAssignReports } = require("./autoAssignReports");

// Add user restrictions handler
const {
  handleCheckRestrictions,
  handleFlagUser,
  handleGetFlagHistory
} = require("./handleUserRestrictions");

// Add diagnostics handler
const {
  checkPoliceOfficerSetup,
  listAllReportsWithStations,
  debugUserStation
} = require("./handleDiagnostics");

// Add report assignment fixer
const {
  checkReportAssignment,
  autoAssignStationToReports
} = require("./fixReportAssignment");

// Add debug assignment
const {
  debugReportStructure,
  forceAssignReportsToStation,
  forceUpdateUserStation
} = require("./debugAssignment");
// 🔐 Secure file serving with decryption (Admin/Police only)
// Files are encrypted at rest and decrypted on-demand for authorized users
const { decryptFile } = require('./encryptionService');
const { getVerifiedUserRole } = require('./authMiddleware');
const { verifyUserRole, requireAuthorizedRole } = require('./authMiddleware');

// Announcements handlers
const { getAnnouncements, getAnnouncementById } = require('./handleAnnouncements');

// Patrol dispatch handlers
const {
  getMyDispatches,
  getDispatchDetails,
  acceptDispatch,
  declineDispatch,
} = require('./handlePatrolDispatches');

// Dispatch management handlers (location tracking, send to dispatch, verification)
const {
  updatePatrolLocation,
  getAllPatrolLocations,
  getPatrolOfficersByStation,
  sendToDispatch,
  getPendingDispatchesForStation,
  respondToDispatch,
  markEnRoute,
  markArrived,
  verifyReport,
} = require('./handleDispatch');

// User routes (push notifications, duty status)
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// Announcements API (public, no auth required)
app.get('/api/announcements', getAnnouncements);
app.get('/api/announcements/:id', getAnnouncementById);

// Patrol location tracking API
app.post('/api/patrol/location', updatePatrolLocation);
app.get('/api/patrol/locations', verifyUserRole, requireAuthorizedRole, getAllPatrolLocations);
app.get('/api/patrol/officers/:stationId', verifyUserRole, requireAuthorizedRole, getPatrolOfficersByStation);

// Dispatch management API (for police station to send reports to patrol)
app.post('/api/dispatch/send', verifyUserRole, requireAuthorizedRole, sendToDispatch);
app.get('/api/dispatch/station/:stationId/pending', verifyUserRole, requireAuthorizedRole, getPendingDispatchesForStation);
app.post('/api/dispatch/:dispatchId/respond', verifyUserRole, requireAuthorizedRole, respondToDispatch);
app.post('/api/dispatch/:dispatchId/en-route', verifyUserRole, requireAuthorizedRole, markEnRoute);
app.post('/api/dispatch/:dispatchId/arrived', verifyUserRole, requireAuthorizedRole, markArrived);
app.post('/api/dispatch/:dispatchId/verify', verifyUserRole, requireAuthorizedRole, verifyReport);

// Patrol dispatch API (mobile patrol UI)
app.get('/api/patrol/dispatches', verifyUserRole, requireAuthorizedRole, getMyDispatches);
app.get('/api/patrol/dispatches/:dispatchId', verifyUserRole, requireAuthorizedRole, getDispatchDetails);
app.post('/api/patrol/dispatches/:dispatchId/accept', verifyUserRole, requireAuthorizedRole, acceptDispatch);
app.post('/api/patrol/dispatches/:dispatchId/decline', verifyUserRole, requireAuthorizedRole, declineDispatch);

const fs = require('fs');

// Decrypt and serve evidence files (Admin/Police only)
app.get('/evidence/:filename', async (req, res) => {
  // Set CORS headers explicitly for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  // 🔒 SECURITY: Verify role from database instead of trusting client
  const requestingUserId = req.query.userId || req.headers['x-user-id'];
  const userRole = await getVerifiedUserRole(requestingUserId);

  if (!requestingUserId || (userRole !== 'admin' && userRole !== 'police')) {
    console.log(`🚫 Unauthorized access attempt to evidence by user ${requestingUserId} with role: ${userRole}`);
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Only admin and police can access report attachments'
    });
  }

  try {
    const filePath = path.join(__dirname, '../evidence', req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    console.log(`🔓 Decrypting evidence file for ${userRole}:`, req.params.filename);

    // Read encrypted file
    const encryptedBuffer = fs.readFileSync(filePath);

    // Decrypt the file
    const decryptedBuffer = decryptFile(encryptedBuffer);

    // Determine content type
    const ext = path.extname(req.params.filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    res.send(decryptedBuffer);

    console.log('✅ File decrypted and served');
  } catch (error) {
    console.error('❌ Error serving evidence file:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve file' });
  }
});

// Decrypt and serve verification files (Admin/Police only)
app.get('/verifications/:filename', async (req, res) => {
  // 🔒 SECURITY: Verify role from database instead of trusting client
  const requestingUserId = req.query.userId || req.headers['x-user-id'];
  const userRole = await getVerifiedUserRole(requestingUserId);

  if (userRole !== 'admin' && userRole !== 'police') {
    console.log(`🚫 Unauthorized access attempt to verification by user ${requestingUserId} with role: ${userRole}`);
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Only admin and police can access verification documents'
    });
  }

  try {
    const filePath = path.join(__dirname, '../verifications', req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    console.log(`🔓 Decrypting verification file for ${userRole}:`, req.params.filename);

    // Read encrypted file
    const encryptedBuffer = fs.readFileSync(filePath);

    // Decrypt the file
    const decryptedBuffer = decryptFile(encryptedBuffer);

    // Determine content type
    const ext = path.extname(req.params.filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.pdf': 'application/pdf'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.send(decryptedBuffer);

    console.log('✅ File decrypted and served');
  } catch (error) {
    console.error('❌ Error serving verification file:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve file' });
  }
});

// Do not expose legacy evidence uploads publicly.
// If you still have legacy paths referenced, migrate them to `/evidence/:filename`.

// Debug logger - BEFORE multer processes the request
app.use((req, res, next) => {
  console.log("\n" + "=".repeat(50));
  console.log("📨 INCOMING REQUEST:");
  console.log("   Method:", req.method);
  console.log("   URL:", req.url);
  console.log("   Content-Type:", req.headers['content-type']);
  console.log("   Body keys:", Object.keys(req.body));
  console.log("=".repeat(50) + "\n");
  next();
});

// Authentication Routes
// Authentication Routes
const handleGoogleRegister = require("./handleGoogleRegister"); // Import

// ...

// Authentication Routes
app.post("/register", handleRegister); // Registration with email verification
app.post("/google-register", handleGoogleRegister); // Google Registration with Phone
app.post("/login", handleLogin);
app.post("/logout", handleLogout); // Clear server-side session on logout
app.post("/patrol-logout", handlePatrolLogout); // Clear patrol officer session and location

// Email Verification Routes
app.get("/verify-email/:token", handleVerifyEmail); // Verify email with token
app.post("/resend-verification", handleResendVerification); // Resend verification email

// Password Reset Routes
app.post("/forgot-password", handleForgotPassword); // Request password reset
app.get("/verify-reset-token/:token", handleVerifyResetToken); // Verify reset token validity
app.post("/reset-password", handleResetPassword); // Reset password with token
app.post("/api/users/change-password", handleChangePassword); // Authenticated password change with OTP

// OTP endpoints (phone verification / login OTP)
const { sendOtp, verifyOtp } = require('./handleOtp');
app.post('/api/send-otp', sendOtp);
app.post('/api/verify-otp', verifyOtp);

app.post("/google-login", handleGoogleLogin); // Google Sign-In (legacy)
app.post("/google-login-token", handleGoogleLoginWithToken); // Google Sign-In with ID token verification (more secure)
app.post("/api/auth/google", handleGoogleLoginWithToken); // ID token verification endpoint
app.post("/google-verify-otp", handleGoogleOtpVerify); // [NEW] Verify OTP for Google Login
app.post("/google-complete-registration", handleGoogleCompleteRegistration); // Complete Google registration with name

// User Profile API Routes
app.get("/api/test-connection", testConnection);
app.get("/api/users/:id", getUserById);
app.get("/api/users/:userId/station", getUserStation);
app.post("/api/users/upsert", upsertUser);
app.patch("/api/users/:id/address", updateUserAddress);
app.patch("/api/users/:id/station", updateUserStation);
app.post("/api/query", executeQuery);

// Report API Routes - with detailed logging
app.post("/api/reports", (req, res, next) => {
  console.log("\n🎯 REPORT ENDPOINT HIT");
  console.log("   Content-Type:", req.headers['content-type']);
  console.log("   Is multipart?", req.headers['content-type']?.includes('multipart'));
  next();
}, reportLimiter, reportUpload.array('media', 6), (req, res, next) => {
  console.log("\n📦 AFTER MULTER:");
  console.log("   req.files exists?", Array.isArray(req.files) && req.files.length > 0);
  console.log("   req.files count:", Array.isArray(req.files) ? req.files.length : 0);
  console.log("   req.files:", req.files);
  console.log("   req.body:", req.body);
  next();
}, submitReport);
app.get("/api/reports", getAllReports);
app.get("/api/reports/user/:userId", getUserReports);

// Report Auto-Assignment Route
app.post("/api/reports/auto-assign", autoAssignReports);

// Police Reports Routes (Station-specific)
// IMPORTANT: More specific routes must come BEFORE less specific routes
app.get("/api/police/station/:stationId/dashboard", verifyUserRole, requireAuthorizedRole, getStationDashboardStats);
app.get("/api/police/station/:stationId/reports/:status", verifyUserRole, requireAuthorizedRole, getReportsByStationAndStatus);
app.get("/api/police/station/:stationId/reports", verifyUserRole, requireAuthorizedRole, getReportsByStation);

// Police Stations API Routes
// IMPORTANT: More specific routes must come BEFORE less specific routes
app.get("/api/police-stations/nearest", getNearestStations);
app.get("/api/police-stations", getAllPoliceStations);
app.get("/api/police-stations/:id", getPoliceStationById);

// User Roles API Routes
app.get("/api/users/:userId/roles", getUserRoles);
app.post("/api/users/roles/assign", assignUserRole);

// Verification API Routes
app.post("/api/verification/submit", submitVerification);
app.post("/api/verification/upload", verificationUpload.single('document'), uploadVerificationDocument);
app.get("/api/verification/status/:userId", getVerificationStatus);
app.put("/api/verification/:verificationId/update", updateVerification);
app.post("/api/verification/approve", approveVerification);
app.post("/api/verification/reject", rejectVerification);

// Messages API Routes
// IMPORTANT: Order matters! More specific routes must come before less specific routes
app.get("/api/messages/conversations/:userId", getUserConversations);
app.get("/api/messages/unread/:userId", getUnreadCount);
app.post("/api/messages/typing", updateUserTypingStatus);
app.get("/api/messages/typing-status/:senderId/:receiverId", checkUserTypingStatus);
app.post("/api/messages", sendMessage);
app.patch("/api/messages/conversation/read", markConversationAsRead);
app.patch("/api/messages/:messageId/read", markMessageAsRead);
app.get("/api/messages/:userId/:otherUserId", getMessagesBetweenUsers);
app.get("/api/messages/:userId", getUserMessages);

// Notifications API Routes
app.get("/api/notifications/:userId", getUserNotifications);
app.patch("/api/notifications/:notificationId/read", markNotificationAsRead);

// Crime Analytics API Routes
app.get("/api/analytics", getAllCrimeAnalytics);
app.get("/api/analytics/:locationId", getCrimeAnalytics);

// Crime Forecasts API Routes
app.get("/api/forecasts/:locationId", getCrimeForecasts);

// Location Service API Routes
app.get("/api/location/search", searchLocation);
app.get("/api/location/reverse", reverseGeocode);
app.get("/api/location/distance", getDistance);

// Barangay API Routes
app.get("/api/barangays", getAllBarangays);
app.get("/api/barangay/by-coordinates", getBarangayByCoordinates);

// Diagnostics Routes (for debugging)
app.get("/api/diagnostics/user/:userId", checkPoliceOfficerSetup);
app.get("/api/diagnostics/user/:userId/station", debugUserStation);

// Central error handler (multer + rate-limit + generic)
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large.'
        : 'File upload failed.',
      error: err.code
    });
  }

  // express-rate-limit sets statusCode on the error in some cases
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Server error'
  });
});
app.get("/api/diagnostics/reports-all", listAllReportsWithStations);
app.get("/api/diagnostics/report-assignment", checkReportAssignment);
app.post("/api/fix/assign-stations-to-reports", autoAssignStationToReports);
app.get("/api/debug/report-structure", debugReportStructure);
app.post("/api/fix/force-assign-to-station", forceAssignReportsToStation);
app.post("/api/fix/force-update-user-station", forceUpdateUserStation);

// User Restrictions/Flagging API Routes
app.get("/api/users/:userId/restrictions", handleCheckRestrictions);
app.get("/api/users/:userId/flags", handleGetFlagHistory);
app.post("/api/users/flag", handleFlagUser);
app.get("/api/debug/user/:userId/flag-status", checkUserFlagStatus);

// Geocoding API Route (legacy, kept for backward compatibility)
app.post("/api/geocode", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: "Address is required" });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'AlertDavao/2.0 (Crime Reporting App)',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Failed to geocode address" });
  }
});

// Google OAuth redirect handler for Expo Go
app.get('/auth/google/callback', (req, res) => {
  const { code, state, error } = req.query;

  console.log('🔔 OAuth callback received:', { code: code ? 'present' : 'missing', state, error });

  if (error) {
    console.error('❌ OAuth error:', error);
    return res.send(`
      <html>
        <body>
          <h2>Authentication failed</h2>
          <p>Error: ${error}</p>
          <script>
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  // Instead of redirecting to exp://, we need to close the browser and let
  // expo-auth-session handle the callback through its internal mechanism
  res.send(`
    <html>
      <head>
        <title>Success</title>
      </head>
      <body>
        <h2>✅ Authentication successful!</h2>
        <p>You can close this window and return to the app.</p>
        <script>
          // Try to close the window
          window.close();
          
          // If that doesn't work, try to go back
          setTimeout(function() {
            if (!window.closed) {
              window.history.back();
            }
          }, 500);
        </script>
      </body>
    </html>
  `);
});

// Health check endpoint for Docker
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Version endpoint (helps confirm which commit is deployed on Render)
app.get('/api/version', (req, res) => {
  (async () => {
    let dbInfo = null;
    try {
      const db = require('./db');
      const [rows] = await db.query(
        `SELECT
           current_database() AS database,
           current_schema() AS schema,
           inet_server_addr()::text AS server_addr,
           inet_server_port() AS server_port,
           to_regclass('public.users_public') IS NOT NULL AS has_users_public,
           to_regclass('public.user_admin') IS NOT NULL AS has_user_admin,
           to_regclass('public.pending_user_admin_registrations') IS NOT NULL AS has_pending_admin
         `,
        []
      );
      dbInfo = rows?.[0] || null;
    } catch (err) {
      dbInfo = { error: err?.message || String(err) };
    }

    res.status(200).json({
      service: 'userside-backend',
      gitCommit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || null,
      timestamp: new Date().toISOString(),
      dbInfo,
    });
  })();
});

// Debug endpoints (disabled by default). Enable by setting ENABLE_DEBUG_ENDPOINTS=true on Render.
// Guarded by x-debug-key header matching DEBUG_KEY env var.
if (String(process.env.ENABLE_DEBUG_ENDPOINTS || '').toLowerCase() === 'true') {
  const db = require('./db');

  const requireDebugKey = (req, res, next) => {
    const expected = process.env.DEBUG_KEY;
    const provided = req.headers['x-debug-key'];
    if (!expected || !provided || String(provided) !== String(expected)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
  };

  const sanitizeEmail = (email) => {
    if (!email) return '';
    return email.toString().trim().toLowerCase().replace(/[<>'"]/g, '');
  };

  const wildcardToRegex = (pattern) => {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/%/g, '.*')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
  };

  const getPatrolPatterns = () => {
    const raw = process.env.TEST_PATROL_EMAIL_PATTERNS || 'dansoypatrol%@mailsac.com';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  };

  app.post('/api/debug/patrol-lookup', requireDebugKey, async (req, res) => {
    try {
      const email = sanitizeEmail(req.body?.email);
      if (!email) {
        return res.status(400).json({ success: false, message: 'email is required' });
      }

      const patterns = getPatrolPatterns();
      const matchesPattern = patterns.some(p => wildcardToRegex(p).test(email));

      const [publicRows] = await db.query(
        'SELECT email, user_role, email_verified_at FROM users_public WHERE email = $1 LIMIT 1',
        [email]
      );
      const [adminRows] = await db.query(
        'SELECT email, user_role, email_verified_at FROM user_admin WHERE email = $1 LIMIT 1',
        [email]
      );

      return res.status(200).json({
        success: true,
        email,
        testPatrolPatterns: patterns,
        matchesPattern,
        users_public: publicRows[0] || null,
        user_admin: adminRows[0] || null,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'error' });
    }
  });
}

// === HEALTH CHECK & MONITORING ENDPOINTS ===
const db = require('./db');

// Basic health check (for load balancers, uptime monitors)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check with database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const start = Date.now();
    await db.query('SELECT 1');
    const dbLatency = Date.now() - start;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`,
        pool: db.getPoolStats ? db.getPoolStats() : 'N/A',
      },
      cache: getCacheStats ? getCacheStats() : 'N/A',
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: { status: 'disconnected' },
    });
  }
});

// Cache management endpoint (for admin/debugging)
app.post('/api/admin/cache/clear', (req, res) => {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_API_KEY && authKey !== process.env.DEBUG_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  if (clearCache) clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl, method: req.method });
});

// Start server
const { encryptAllSensitiveData } = require('./encrypt_all_sensitive_data');
const { runMigrations } = require('./runMigrations');

(async () => {
  console.log("🔄 Initializing DB migrations on startup...");
  try {
    await runMigrations();
  } catch (err) {
    console.warn("⚠️ Migrations failed, but starting server anyway:", err?.message || err);
  }

  console.log("🔒 Initializing encryption verification on startup...");
  try {
    await encryptAllSensitiveData();
  } catch (err) {
    console.error("⚠️ Encryption migration failed, but starting server anyway:", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    // console.log(`   Local Network: http://${require('ip').address()}:${PORT}`);
    
    // 🔄 KEEP-ALIVE: Prevent Render free tier cold starts
    // Pings both UserSide and AdminSide every 30 seconds to keep them warm
    const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
    const ADMIN_KEEP_ALIVE_URL = process.env.ADMIN_KEEP_ALIVE_URL; // AdminSide URL
    const SARIMA_KEEP_ALIVE_URL = process.env.SARIMA_KEEP_ALIVE_URL; // SARIMA API URL
    const KEEP_ALIVE_INTERVAL = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS || '30000', 10); // 30 seconds default
    
    const pingUrl = async (targetUrl, label) => {
      try {
        const https = require('https');
        const http = require('http');
        const url = new URL(targetUrl);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.get(url.href, { timeout: 30000 }, (res) => {
          console.log(`🏓 ${label}: ${res.statusCode}`);
        });
        
        req.on('error', () => {}); // Silently ignore - ping attempt still keeps server alive
        req.on('timeout', () => req.destroy());
      } catch (err) {
        // Silently ignore - ping attempt still keeps server alive
      }
    };
    
    const urls = [];
    if (KEEP_ALIVE_URL) urls.push({ url: KEEP_ALIVE_URL + '/health', label: 'UserSide' });
    if (ADMIN_KEEP_ALIVE_URL) urls.push({ url: ADMIN_KEEP_ALIVE_URL, label: 'AdminSide' });
    if (SARIMA_KEEP_ALIVE_URL) urls.push({ url: SARIMA_KEEP_ALIVE_URL, label: 'SARIMA API' });
    
    if (urls.length > 0) {
      console.log(`🏓 Keep-alive enabled: pinging every ${KEEP_ALIVE_INTERVAL / 1000}s`);
      urls.forEach(u => console.log(`   → ${u.label}: ${u.url}`));
      
      const keepAlive = () => {
        urls.forEach(u => pingUrl(u.url, u.label));
      };
      
      // Start pinging after 30 seconds, then every KEEP_ALIVE_INTERVAL
      setTimeout(() => {
        keepAlive(); // First ping
        setInterval(keepAlive, KEEP_ALIVE_INTERVAL);
      }, 30000);
    } else {
      console.log('ℹ️ Keep-alive disabled (set KEEP_ALIVE_URL or RENDER_EXTERNAL_URL to enable)');
    }
  });
})();