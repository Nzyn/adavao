const db = require("./db");

// Get user notifications
const getUserNotifications = async (req, res) => {
  const { userId } = req.params;

  console.log("Fetching notifications for user:", userId);

  try {
    const notifications = [];
    const currentTime = new Date().toISOString();

    // 1. Check for unread messages (individual messages)
    try {
      console.log("Checking for unread messages...");
      const [unreadMessages] = await db.query(
        `SELECT 
          m.message_id,
          m.message,
          m.created_at,
          COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read
        FROM messages m
        LEFT JOIN notification_reads nr 
          ON nr.notification_id = CONCAT('msg_', m.message_id) 
          AND nr.user_id = $1
        WHERE m.receiver_id = $2 AND m.status = FALSE
        ORDER BY m.created_at DESC
        LIMIT 10`, // Get up to 10 recent unread messages
        [userId, userId]
      );

      console.log("Unread messages result:", unreadMessages);

      // Create separate notifications for each unread message
      unreadMessages.forEach((msg, index) => {
        notifications.push({
          id: `msg_${msg.message_id}`,
          title: "You have a new Message",
          message: msg.message,
          timestamp: msg.created_at,
          read: msg.is_read === 1 || msg.is_read === true,
          type: 'message'
        });
      });
    } catch (error) {
      console.warn('Failed to fetch message notifications:', error);
    }

    // 2. Check for new reports (individual reports)
    try {
      console.log("Checking for new reports...");
      const [newReports] = await db.query(
        `SELECT 
          r.report_id,
          r.title,
          r.created_at,
          COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read
        FROM reports r
        LEFT JOIN notification_reads nr 
          ON nr.notification_id = CONCAT('report_', r.report_id) 
          AND nr.user_id = $1
        WHERE r.user_id = $2
        ORDER BY r.created_at DESC
        LIMIT 10`, // Get up to 10 recent reports
        [userId, userId]
      );

      console.log("New reports result:", newReports);

      // Create separate notifications for each new report
      newReports.forEach((report, index) => {
        // Format the date and time in Philippine time
        const reportDate = new Date(report.created_at);

        notifications.push({
          id: `report_${report.report_id}`,
          title: "You have successfully submitted a new report",
          message: `Submitted on ${reportDate.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })} at ${reportDate.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })}`,
          timestamp: report.created_at,
          read: report.is_read === 1 || report.is_read === true,
          type: 'report'
        });
      });
    } catch (error) {
      console.warn('Failed to fetch new report notifications:', error);
    }

    // 3. Check for report status updates (individual reports with status changes)
    try {
      console.log("Checking for report status updates...");
      const [updatedReports] = await db.query(
        `SELECT 
          r.report_id,
          r.title,
          r.status,
          r.updated_at,
          COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read
        FROM reports r
        LEFT JOIN notification_reads nr 
          ON nr.notification_id = CONCAT('update_', r.report_id) 
          AND nr.user_id = $1
        WHERE r.user_id = $2
        AND r.status != 'pending'
        AND r.updated_at > r.created_at  /* Only reports that have been updated */
        ORDER BY r.updated_at DESC
        LIMIT 10`, // Get up to 10 recent report updates
        [userId, userId]
      );

      console.log("Updated reports result:", updatedReports);

      // Create separate notifications for each report update
      updatedReports.forEach((report, index) => {
        // Format the date and time in Philippine time
        const updateDate = new Date(report.updated_at);

        notifications.push({
          id: `update_${report.report_id}`,
          title: "Report Status Updated",
          message: `Status of your report "${report.title}" has been updated to ${report.status}`,
          timestamp: report.updated_at,
          read: report.is_read === 1 || report.is_read === true,
          type: 'report',
          relatedId: report.report_id
        });
      });
    } catch (error) {
      console.warn('Failed to fetch report update notifications:', error);
    }

    // 4. Check for verification status updates
    try {
      console.log("Checking for verification status updates...");
      const [verifications] = await db.query(
        `SELECT 
          v.verification_id,
          v.status,
          v.created_at,
          v.updated_at,
          COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read
        FROM verifications v
        LEFT JOIN notification_reads nr 
          ON nr.notification_id = CONCAT('verify_', v.verification_id) 
          AND nr.user_id = $1
        WHERE v.user_id = $2 
        AND v.status IN ('approved', 'rejected')
        ORDER BY v.created_at DESC 
        LIMIT 5`,
        [userId, userId]
      );

      console.log("Verifications result:", verifications);

      // Create separate notifications for each verification update
      verifications.forEach((verification, index) => {
        // Format the date and time in Philippine time
        const verifyDate = new Date(verification.updated_at || verification.created_at);

        notifications.push({
          id: `verify_${verification.verification_id}`,
          title: "Verification Status Updated",
          message: `Your account verification has been ${verification.status}`,
          timestamp: verification.updated_at || verification.created_at,
          read: verification.is_read === 1 || verification.is_read === true,
          type: 'verification'
        });
      });
    } catch (error) {
      console.warn('Failed to fetch verification notifications:', error);
    }

    // 5. Check for user flags (account flagged notifications)
    try {
      console.log("Checking for user flags...");

      // First get active restriction for the user to include expiry info
      // This ensures the notification shows the correct countdown
      const [activeRestriction] = await db.query(
        `SELECT restriction_type, expires_at 
         FROM user_restrictions 
         WHERE user_id = $1 AND is_active = TRUE 
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      const currentRestriction = activeRestriction.length > 0 ? activeRestriction[0] : null;

      const [userFlags] = await db.query(
        `SELECT 
          uf.id as flag_id,
          uf.user_id,
          uf.violation_type,
          uf.description as reason,
          uf.created_at as flagged_at,
          uf.status,
          COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read
        FROM user_flags uf
        LEFT JOIN notification_reads nr 
          ON nr.notification_id = CONCAT('flag_', uf.id) 
          AND nr.user_id = $1
        WHERE uf.user_id = $2 
        AND uf.status IN ('confirmed')
        ORDER BY uf.created_at DESC 
        LIMIT 10`,
        [userId, userId]
      );

      console.log("User flags result:", userFlags);

      // Create separate notifications for each active user flag
      userFlags.forEach((flag) => {
        // Format violation type (convert underscore to space and capitalize)
        const formattedViolationType = flag.violation_type
          ? flag.violation_type.replace(/_/g, ' ').toUpperCase()
          : 'Account Flagged';

        notifications.push({
          id: `flag_${flag.flag_id}`,
          title: "Account Flagged",
          message: `Your account has been flagged for: ${formattedViolationType}${flag.reason ? ' - ' + flag.reason : ''}`,
          timestamp: flag.flagged_at,
          read: false,
          type: 'user_flagged',
          data: {
            flag_id: flag.flag_id,
            violation_type: formattedViolationType,
            reason: flag.reason,
            total_flags: 1,
            restriction_applied: currentRestriction ? currentRestriction.restriction_type : 'flagged',
            expires_at: currentRestriction ? currentRestriction.expires_at : null
          }
        });
      });
    } catch (error) {
      console.warn('Failed to fetch user flag notifications:', error);
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log("Returning notifications:", notifications);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const { userId } = req.body;

  try {
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);

    // Insert into notification_reads table
    // Using ON CONFLICT DO NOTHING to handle duplicate entries gracefully (PostgreSQL replacement for INSERT IGNORE)
    // Assumes constraint on (user_id, notification_id) exists
    await db.query(
      `INSERT INTO notification_reads (user_id, notification_id, read_at) 
       VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
      [userId, notificationId]
    );

    console.log(`Successfully marked notification ${notificationId} as read for user ${userId}`);

    res.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead
};