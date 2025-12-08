const db = require("./db");

/**
 * Check the actual flag status of a user from the database
 * This helps debug flag-related issues
 */
const checkUserFlagStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`\n🔍 DEBUG: Checking flag status for user ${userId}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Check user_flags table
    const [userFlags] = await db.query(
      `SELECT 
        id as flag_id,
        user_id,
        violation_type,
        description,
        status,
        created_at,
        updated_at
      FROM user_flags 
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`   Found ${userFlags.length} flag records for user ${userId}`);
    console.log('   Flag records:', userFlags);

    // Count active flags (not dismissed)
    const activeFlags = userFlags.filter(f => f.status !== 'dismissed');
    console.log(`   Active (non-dismissed) flags: ${activeFlags.length}`);

    // Check user_restrictions table
    const [restrictions] = await db.query(
      `SELECT 
        id,
        user_id,
        restriction_type,
        reason,
        is_active,
        created_at,
        lifted_at
      FROM user_restrictions 
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`   Found ${restrictions.length} restriction records for user ${userId}`);
    console.log('   Restriction records:', restrictions);

    // Check users table
    const [userRecord] = await db.query(
      `SELECT 
        id,
        firstname,
        lastname,
        total_flags,
        restriction_level
      FROM users_public 
      WHERE id = ?`,
      [userId]
    );

    console.log('   User record:', userRecord);

    const user = userRecord[0];

    // Determine flag status
    const isFlagged = activeFlags.length > 0;
    const hasActiveRestrictions = restrictions.some(r => r.is_active);

    console.log(`\n   ✅ Flag Status Summary:`);
    console.log(`      - Has active flags: ${isFlagged}`);
    console.log(`      - Has active restrictions: ${hasActiveRestrictions}`);
    console.log(`      - Total flags in DB: ${user.total_flags}`);
    console.log(`      - Restriction level: ${user.restriction_level}\n`);

    return res.json({
      success: true,
      flagStatus: {
        isFlagged,
        hasActiveRestrictions,
        totalFlagsInDb: user.total_flags,
        restrictionLevel: user.restriction_level,
        activeFlags: activeFlags.length,
        totalFlagRecords: userFlags.length,
        dismissedFlagRecords: userFlags.filter(f => f.status === 'dismissed').length
      },
      details: {
        flags: userFlags,
        restrictions: restrictions,
        user: {
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
          total_flags: user.total_flags,
          restriction_level: user.restriction_level
        }
      }
    });
  } catch (error) {
    console.error(`Error checking flag status for user ${userId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error checking flag status',
      error: error.message
    });
  }
};

module.exports = {
  checkUserFlagStatus
};
