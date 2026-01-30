// handleLogout.js
const db = require("./db");

/**
 * Handle user logout - clears server-side session data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleLogout = async (req, res) => {
  const { userId, email } = req.body;

  if (!userId && !email) {
    return res.status(400).json({ 
      success: false, 
      message: "User ID or email is required" 
    });
  }

  try {
    // Update last_logout timestamp and clear any active session tokens
    if (userId) {
      await db.query(
        `UPDATE users_public 
         SET last_logout = NOW(), 
             session_token = NULL,
             push_token = NULL
         WHERE id = $1`,
        [userId]
      );
    } else if (email) {
      await db.query(
        `UPDATE users_public 
         SET last_logout = NOW(), 
             session_token = NULL,
             push_token = NULL
         WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
        [email]
      );
    }

    console.log(`✅ User logged out: ${userId || email}`);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout"
    });
  }
};

/**
 * Handle patrol officer logout - also clears patrol location tracking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handlePatrolLogout = async (req, res) => {
  const { odId, odEmail } = req.body;

  if (!odId && !odEmail) {
    return res.status(400).json({ 
      success: false, 
      message: "Officer ID or email is required" 
    });
  }

  try {
    // Clear patrol location and set officer as offline
    if (odId) {
      // Update user_admin to mark as logged out
      await db.query(
        `UPDATE user_admin 
         SET last_logout = NOW(),
             is_online = false
         WHERE id = $1`,
        [odId]
      );

      // Clear active patrol location
      await db.query(
        `UPDATE patrol_locations 
         SET is_active = false, 
             last_updated = NOW() 
         WHERE officer_id = $1`,
        [odId]
      );
    } else if (odEmail) {
      // Get officer ID first
      const [officer] = await db.query(
        `SELECT id FROM user_admin WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
        [odEmail]
      );

      if (officer.length > 0) {
        const odIdFromEmail = officer[0].id;
        
        await db.query(
          `UPDATE user_admin 
           SET last_logout = NOW(),
               is_online = false
           WHERE id = $1`,
          [odIdFromEmail]
        );

        await db.query(
          `UPDATE patrol_locations 
           SET is_active = false, 
               last_updated = NOW() 
           WHERE officer_id = $1`,
          [odIdFromEmail]
        );
      }
    }

    console.log(`✅ Patrol officer logged out: ${odId || odEmail}`);

    return res.status(200).json({
      success: true,
      message: "Patrol logged out successfully"
    });
  } catch (error) {
    console.error("❌ Patrol logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout"
    });
  }
};

module.exports = { handleLogout, handlePatrolLogout };
