// handleUserRestrictions.js
// Handles user flag checking and restriction enforcement

const db = require("./db");

/**
 * Check if a user has active restrictions
 * @param {number} userId - The user ID to check
 * @returns {Object} - Restriction details
 */
const checkUserRestrictions = async (userId) => {
  try {
    // Check for active restrictions
    const [restrictions] = await db.query(
      `SELECT * FROM user_restrictions 
       WHERE user_id = ? 
       AND is_active = TRUE 
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (restrictions.length > 0) {
      const restriction = restrictions[0];
      return {
        isRestricted: true,
        restrictionType: restriction.restriction_type,
        reason: restriction.reason,
        expiresAt: restriction.expires_at,
        canReport: restriction.can_report,
        canComment: restriction.can_comment,
        canUpload: restriction.can_upload,
        canMessage: restriction.can_message
      };
    }

    return {
      isRestricted: false,
      restrictionType: null,
      reason: null,
      expiresAt: null,
      canReport: true,
      canComment: true,
      canUpload: true,
      canMessage: true
    };
  } catch (error) {
    console.error("Error checking user restrictions:", error);
    throw error;
  }
};

/**
 * Get user's flag history and count
 * @param {number} userId - The user ID to check
 * @returns {Object} - Flag history details
 */
const getUserFlagHistory = async (userId) => {
  try {
    // Get total flag count
    const [countResult] = await db.query(
      `SELECT 
        total_flags,
        false_report_count,
        spam_count,
        harassment_count,
        inappropriate_content_count,
        last_flag_date,
        restriction_level
       FROM users_public WHERE id = ?`,
      [userId]
    );

    // Get recent flags (last 30 days)
    const [recentFlags] = await db.query(
      `SELECT 
        violation_type,
        severity,
        description,
        created_at,
        status
       FROM user_flags 
       WHERE user_id = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return {
      totalFlags: countResult[0]?.total_flags || 0,
      restrictionLevel: countResult[0]?.restriction_level || 'none',
      recentFlags: recentFlags,
      flagBreakdown: {
        falseReport: countResult[0]?.false_report_count || 0,
        spam: countResult[0]?.spam_count || 0,
        harassment: countResult[0]?.harassment_count || 0,
        inappropriateContent: countResult[0]?.inappropriate_content_count || 0
      }
    };
  } catch (error) {
    console.error("Error getting user flag history:", error);
    throw error;
  }
};

/**
 * Create a new flag for a user
 * @param {Object} flagData - The flag data
 */
const createUserFlag = async (flagData) => {
  const {
    userId,
    violationType,
    severity = 'minor',
    description,
    reportedBy = null,
    relatedReportId = null,
    evidence = null
  } = flagData;

  try {
    // Insert the flag
    const [result] = await db.query(
      `INSERT INTO user_flags 
       (user_id, violation_type, severity, description, reported_by, related_report_id, evidence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, violationType, severity, description, reportedBy, relatedReportId, JSON.stringify(evidence)]
    );

    // Update user's flag counts based on violation type
    let updateQuery = 'UPDATE users_public SET total_flags = total_flags + 1, last_flag_date = NOW()';

    switch (violationType) {
      case 'false_report':
        updateQuery += ', false_report_count = false_report_count + 1';
        break;
      case 'prank_spam':
        updateQuery += ', spam_count = spam_count + 1';
        break;
      case 'harassment':
        updateQuery += ', harassment_count = harassment_count + 1';
        break;
      case 'inappropriate_content':
      case 'inappropriate_upload':
        updateQuery += ', inappropriate_content_count = inappropriate_content_count + 1';
        break;
    }

    updateQuery += ' WHERE id = ?';
    await db.query(updateQuery, [userId]);

    // Check if auto-restriction should be applied
    await checkAndApplyAutoRestriction(userId);

    return {
      success: true,
      flagId: result.insertId,
      message: 'Flag created successfully'
    };
  } catch (error) {
    console.error("Error creating user flag:", error);
    throw error;
  }
};

/**
 * Check flag counts and apply auto-restriction if thresholds are met
 * @param {number} userId - The user ID to check
 */
const checkAndApplyAutoRestriction = async (userId) => {
  try {
    // Get user's current flag counts
    const [user] = await db.query(
      'SELECT total_flags, restriction_level FROM users_public WHERE id = ?',
      [userId]
    );

    if (user.length === 0) return;

    const { total_flags, restriction_level } = user[0];

    // Define thresholds
    const THRESHOLDS = {
      warning: 3,      // 3 flags = warning
      suspended: 7,    // 7 flags = suspended
      banned: 15       // 15 flags = banned
    };

    let newRestrictionLevel = restriction_level;
    let restrictionType = null;
    let expiresAt = null;
    let permissions = {};

    // Determine restriction level based on total flags
    if (total_flags >= THRESHOLDS.banned && restriction_level !== 'banned') {
      newRestrictionLevel = 'banned';
      restrictionType = 'banned';
      expiresAt = null; // Permanent
      permissions = {
        can_report: false,
        can_comment: false,
        can_upload: false,
        can_message: false
      };
    } else if (total_flags >= THRESHOLDS.suspended && restriction_level !== 'suspended' && restriction_level !== 'banned') {
      newRestrictionLevel = 'suspended';
      restrictionType = 'suspended';
      // 7-day suspension
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      permissions = {
        can_report: false,
        can_comment: false,
        can_upload: false,
        can_message: true
      };
    } else if (total_flags >= THRESHOLDS.warning && restriction_level === 'none') {
      newRestrictionLevel = 'warning';
      restrictionType = 'warning';
      // 24-hour warning period
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      permissions = {
        can_report: true,
        can_comment: true,
        can_upload: false,
        can_message: true
      };
    }

    // Apply new restriction if level changed
    if (restrictionType && newRestrictionLevel !== restriction_level) {
      // Update user's restriction level
      await db.query(
        'UPDATE users_public SET restriction_level = ? WHERE id = ?',
        [newRestrictionLevel, userId]
      );

      // Deactivate previous restrictions
      await db.query(
        'UPDATE user_restrictions SET is_active = FALSE WHERE user_id = ?',
        [userId]
      );

      // Create new restriction
      await db.query(
        `INSERT INTO user_restrictions 
         (user_id, restriction_type, reason, expires_at, can_report, can_comment, can_upload, can_message, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          restrictionType,
          `Auto-restriction: ${total_flags} violations accumulated`,
          expiresAt,
          permissions.can_report,
          permissions.can_comment,
          permissions.can_upload,
          permissions.can_message,
          null // System-generated
        ]
      );

      console.log(`🚫 User ${userId} has been ${restrictionType} due to ${total_flags} violations`);
    }
  } catch (error) {
    console.error("Error applying auto-restriction:", error);
    throw error;
  }
};

/**
 * Express route handler to check restrictions
 */
const handleCheckRestrictions = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const restrictions = await checkUserRestrictions(userId);
    res.json(restrictions);
  } catch (error) {
    console.error("Error in handleCheckRestrictions:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Express route handler to flag a user
 */
const handleFlagUser = async (req, res) => {
  const { userId, violationType, severity, description, reportedBy, relatedReportId, evidence } = req.body;

  // Validate required fields
  if (!userId || !violationType) {
    return res.status(400).json({ message: 'User ID and violation type are required' });
  }

  // Validate violation type
  const validViolationTypes = [
    'false_report', 'prank_spam', 'inappropriate_content', 'harassment',
    'impersonation', 'inappropriate_upload', 'suspicious_activity',
    'sensitive_info_sharing', 'anonymous_misuse', 'system_abuse'
  ];

  if (!validViolationTypes.includes(violationType)) {
    return res.status(400).json({
      message: 'Invalid violation type',
      validTypes: validViolationTypes
    });
  }

  try {
    const result = await createUserFlag({
      userId,
      violationType,
      severity,
      description,
      reportedBy,
      relatedReportId,
      evidence
    });

    res.json(result);
  } catch (error) {
    console.error("Error in handleFlagUser:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Express route handler to get user flag history
 */
const handleGetFlagHistory = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const history = await getUserFlagHistory(userId);
    res.json(history);
  } catch (error) {
    console.error("Error in handleGetFlagHistory:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  checkUserRestrictions,
  getUserFlagHistory,
  createUserFlag,
  handleCheckRestrictions,
  handleFlagUser,
  handleGetFlagHistory
};
