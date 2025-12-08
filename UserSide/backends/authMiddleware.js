/**
 * Authentication Middleware
 * Verifies user roles from the database to prevent role spoofing
 */

const db = require("./db");

/**
 * Middleware to verify user role from database
 * Expects userId to be passed in query, body, or params
 * Sets req.userRole to the verified role from database
 */
const verifyUserRole = async (req, res, next) => {
  try {
    // Get userId from various sources
    const userId = req.params.userId || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Query database to get actual user role
    const [users] = await db.query(
      "SELECT role FROM users_public WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Set verified role from database
    req.userRole = users[0].role || 'user';
    req.userId = userId;

    console.log(`✅ Verified user ${userId} has role: ${req.userRole}`);

    next();
  } catch (error) {
    console.error("Error verifying user role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify user role",
      error: error.message
    });
  }
};

/**
 * Middleware to require admin or police role
 * Must be used after verifyUserRole middleware
 */
const requireAuthorizedRole = (req, res, next) => {
  const authorizedRoles = ['admin', 'police'];

  if (!req.userRole || !authorizedRoles.includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: This action requires admin or police privileges"
    });
  }

  console.log(`✅ User has authorized role: ${req.userRole}`);
  next();
};

/**
 * Middleware to require admin role only
 * Must be used after verifyUserRole middleware
 */
const requireAdminRole = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: This action requires admin privileges"
    });
  }

  console.log(`✅ User has admin role`);
  next();
};

/**
 * Get verified user role from request (for file serving routes)
 * This checks the database instead of trusting client input
 */
const getVerifiedUserRole = async (userId) => {
  try {
    if (!userId) {
      return 'user';
    }

    const [users] = await db.query(
      "SELECT role FROM users_public WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return 'user';
    }

    return users[0].role || 'user';
  } catch (error) {
    console.error("Error getting user role:", error);
    return 'user';
  }
};

module.exports = {
  verifyUserRole,
  requireAuthorizedRole,
  requireAdminRole,
  getVerifiedUserRole
};
