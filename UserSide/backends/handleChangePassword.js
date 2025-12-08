const db = require("./db");
const bcrypt = require("bcryptjs");
const { verifyOtpInternal } = require("./handleOtp");

const handleChangePassword = async (req, res) => {
    const { userId, newPassword, otp } = req.body;

    if (!userId || !newPassword || !otp) {
        return res.status(400).json({
            success: false,
            message: "User ID, New Password, and OTP are required"
        });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters with 1 letter, 1 number, and 1 symbol (@$!%*?&)"
        });
    }

    try {
        // 1. Get user's registered phone number
        const [rows] = await db.query("SELECT contact FROM users_public WHERE id = ?", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const userPhone = rows[0].contact;

        if (!userPhone) {
            return res.status(400).json({ success: false, message: "No phone number linked to this account. Contact support." });
        }

        // 2. Verify OTP sent to that phone
        const verification = await verifyOtpInternal(userPhone, otp, 'change_password');
        if (!verification.success) {
            return res.status(400).json({ success: false, message: verification.message });
        }

        // 3. Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users_public SET password = ?, updated_at = NOW() WHERE id = ?", [hashedPassword, userId]);

        console.log(`✅ Password changed for user ${userId} via OTP verification`);

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { handleChangePassword };
