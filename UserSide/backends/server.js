const express = require("express");
const cors = require("cors");
const path = require('path');
const multer = require('multer');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

// Serve static files from 'evidence' directory
app.use('/evidence', express.static(path.join(__dirname, '../evidence')));
app.use('/verifications', express.static(path.join(__dirname, '../verifications')));

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
const { handleGoogleLogin, handleGoogleLoginWithToken } = require("./handleGoogleAuth");
const handleLogin = require("./handleLogin");
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

  if (userRole !== 'admin' && userRole !== 'police') {
    console.log(`🚫 Unauthorized access attempt to evidence by user ${requestingUserId} with role: ${userRole}`);
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Only admin and police can access evidence files'
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

// Backward compatibility: serve old uploads from uploads/evidence folder (legacy - unencrypted)
app.use('/uploads/evidence', express.static(path.join(__dirname, '../uploads/evidence')));

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
app.post("/register", handleRegister); // Registration with email verification
app.post("/login", handleLogin);

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
}, reportUpload.single('media'), (req, res, next) => {
  console.log("\n📦 AFTER MULTER:");
  console.log("   req.file exists?", !!req.file);
  console.log("   req.file:", req.file);
  console.log("   req.body:", req.body);
  next();
}, submitReport);
app.get("/api/reports", getAllReports);
app.get("/api/reports/user/:userId", getUserReports);

// Report Auto-Assignment Route
app.post("/api/reports/auto-assign", autoAssignReports);

// Police Reports Routes (Station-specific)
// IMPORTANT: More specific routes must come BEFORE less specific routes
app.get("/api/police/station/:stationId/dashboard", getStationDashboardStats);
app.get("/api/police/station/:stationId/reports/:status", getReportsByStationAndStatus);
app.get("/api/police/station/:stationId/reports", getReportsByStation);

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

// Catch-all for undefined routes
app.use('*', (req, res) => {
  console.log(`❌ 404 Hit: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not found', path: req.originalUrl, method: req.method });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  // console.log(`   Local Network: http://${require('ip').address()}:${PORT}`);
});