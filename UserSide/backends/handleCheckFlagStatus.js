const db = require("./db");

/**
 * Check the actual flag status of a user from the database
 * This also automatically expires flags if their duration has passed
 */
const checkUserFlagStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`\n🔍 Checking flag status for user ${userId}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // STEP 1: Auto-expire any flags that have passed their expiration date
    const expiredResult = await autoExpireFlags(userId);
    if (expiredResult.expiredCount > 0) {
      console.log(`   ⏰ Auto-expired ${expiredResult.expiredCount} flag(s) for user ${userId}`);
    }

    // STEP 2: Get remaining active flags (after expiration check)
    const [userFlags] = await db.query(
      `SELECT 
        id as flag_id,
        user_id,
        violation_type,
        description,
        status,
        duration_days,
        expires_at,
        created_at,
        updated_at
      FROM user_flags 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`   Found ${userFlags.length} flag records for user ${userId}`);

    // Count active flags (confirmed and not expired)
    const activeFlags = userFlags.filter(f =>
      f.status === 'confirmed' &&
      (!f.expires_at || new Date(f.expires_at) > new Date())
    );
    console.log(`   Active flags: ${activeFlags.length}`);

    // Check user_restrictions table
    const [restrictions] = await db.query(
      `SELECT 
        id,
        user_id,
        restriction_type,
        reason,
        is_active,
        expires_at,
        created_at,
        lifted_at
      FROM user_restrictions 
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    // Check users table
    const [userRecord] = await db.query(
      `SELECT 
        id,
        firstname,
        lastname,
        total_flags,
        restriction_level
      FROM users_public 
      WHERE id = $1`,
      [userId]
    );

    const user = userRecord[0] || null;

    // Determine if user is flagged
    const isFlagged = activeFlags.length > 0;
    const hasActiveRestrictions = restrictions.some(r => r.is_active);

    console.log(`   ✅ Flag check complete:`, {
      isFlagged,
      activeFlags: activeFlags.length,
      hasActiveRestrictions,
      userTotalFlags: user?.total_flags,
      userRestrictionLevel: user?.restriction_level
    });

    return res.json({
      success: true,
      flagStatus: {
        isFlagged,
        hasActiveRestrictions,
        totalFlagsInDb: userFlags.length,
        activeFlags: activeFlags.length,
        restrictionLevel: user?.restriction_level || 'none',
        totalFlagRecords: userFlags.length,
        dismissedFlagRecords: userFlags.filter(f => f.status === 'dismissed').length,
        expiredInThisCheck: expiredResult.expiredCount || 0
      },
      details: {
        flags: userFlags,
        restrictions,
        user
      }
    });
  } catch (error) {
    console.error('Error checking flag status for user', userId, ':', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check flag status',
      error: error.message
    });
  }
};

/**
 * Auto-expire flags that have passed their expiration date
 * This runs on-demand when checking flag status
 */
const autoExpireFlags = async (userId) => {
  try {
    // Find expired confirmed flags for this user
    const [expiredFlags] = await db.query(
      `SELECT id, user_id, violation_type 
       FROM user_flags 
       WHERE user_id = $1
         AND status = 'confirmed'
         AND expires_at IS NOT NULL 
         AND expires_at <= NOW()`,
      [userId]
    );

    if (expiredFlags.length === 0) {
      return { expiredCount: 0 };
    }

    console.log(`   🔄 Found ${expiredFlags.length} expired flag(s) to process`);

    // Mark flags as expired
    await db.query(
      `UPDATE user_flags 
       SET status = 'expired', updated_at = NOW() 
       WHERE user_id = $1
         AND status = 'confirmed'
         AND expires_at IS NOT NULL 
         AND expires_at <= NOW()`,
      [userId]
    );

    // Deactivate expired restrictions
    await db.query(
      `UPDATE user_restrictions 
       SET is_active = false, lifted_at = NOW(), updated_at = NOW() 
       WHERE user_id = $1
         AND is_active = true 
         AND expires_at IS NOT NULL 
         AND expires_at <= NOW()`,
      [userId]
    );

    // Count remaining active confirmed flags
    const [remainingFlags] = await db.query(
      `SELECT COUNT(*) as count 
       FROM user_flags 
       WHERE user_id = $1
         AND status = 'confirmed'
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );

    const remainingCount = parseInt(remainingFlags[0]?.count) || 0;

    // Update user restriction level
    await db.query(
      `UPDATE users_public 
       SET restriction_level = $1,
           updated_at = NOW() 
       WHERE id = $2`,
      [remainingCount > 0 ? 'warning' : 'none', userId]
    );

    // Create notification for user that their flag expired
    for (const flag of expiredFlags) {
      await db.query(
        `INSERT INTO notifications (user_id, type, message, data, is_read, created_at, updated_at) 
         VALUES ($1, 'flag_expired', 'Good news! Your account restriction has expired. You can now submit reports and access all features normally.', $2, false, NOW(), NOW())`,
        [userId, JSON.stringify({
          flag_id: flag.id,
          violation_type: flag.violation_type,
          expired_at: new Date().toISOString(),
          remaining_flags: remainingCount
        })]
      );
    }

    console.log(`   ✅ Expired ${expiredFlags.length} flag(s), remaining active: ${remainingCount}`);

    return { expiredCount: expiredFlags.length, remainingFlags: remainingCount };
  } catch (error) {
    console.error('Error in autoExpireFlags:', error);
    return { expiredCount: 0, error: error.message };
  }
};

module.exports = {
  checkUserFlagStatus,
  autoExpireFlags
};
