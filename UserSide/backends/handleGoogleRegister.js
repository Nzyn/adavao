const db = require("./db");
const { sendOtpInternal } = require('./handleOtp');
const bcrypt = require("bcryptjs");
const { encrypt, decrypt } = require("./encryptionService");

// Handle Google Registration with Phone Number
const handleGoogleRegister = async (req, res) => {
    const { googleId, email, firstName, lastName, profilePicture, contact } = req.body;

    if (!googleId || !email || !contact) {
        return res.status(400).json({ message: "Missing required fields: googleId, email, or contact" });
    }

    // Validate contact number (basic check)
    const cleanContact = contact.replace(/[^\d+]/g, '');
    if (cleanContact.length < 10) {
        return res.status(400).json({ message: "Invalid contact number" });
    }

    try {
        // Check if email already exists
        const [existingUsers] = await db.query(
            "SELECT * FROM users_public WHERE email = $1",
            [email]
        );

        if (existingUsers.length > 0) {
            // Edge case: User already exists but tried to register again
            const user = existingUsers[0];
            if (!user.google_id) {
                await db.query("UPDATE users_public SET google_id = $1 WHERE id = $2", [googleId, user.id]);
            }

            // Send OTP even if they exist in this flow as a security verification suitable for "registration attempt"
            const otpResult = await sendOtpInternal(cleanContact, 'login', email);

            if (otpResult.success) {
                return res.json({
                    requireOtp: true,
                    userId: user.id,
                    contact: cleanContact,
                    message: 'Account exists. OTP sent to verify.'
                });
            }

            const { password, ...userWithoutPassword } = user;
            if (userWithoutPassword.contact) userWithoutPassword.contact = decrypt(userWithoutPassword.contact);
            if (userWithoutPassword.address) userWithoutPassword.address = decrypt(userWithoutPassword.address);
            return res.status(200).json({
                message: "User logged in (account existed)",
                user: userWithoutPassword
            });
        }

        // Create New User
        const hashedPlaceholder = await bcrypt.hash('GOOGLE_AUTH_' + Date.now(), 10);
        const encryptedContact = encrypt(cleanContact);

        const sql = `
            INSERT INTO users_public(
                firstname, lastname, email, google_id, profile_image, password, contact, created_at, email_verified_at, email_verified, is_verified
            ) VALUES($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), true, true) RETURNING id
        `;

        const [result] = await db.query(sql, [
            firstName,
            lastName,
            email,
            googleId,
            profilePicture || null,
            hashedPlaceholder,
            encryptedContact
        ]);

        // Fetch new user
        const [newUser] = await db.query('SELECT * FROM users_public WHERE id = $1', [result[0].id]);

        // [MODIFIED] Send OTP instead of returning user
        const otpResult = await sendOtpInternal(cleanContact, 'register', email);

        if (otpResult.success) {
            return res.json({
                requireOtp: true,
                userId: newUser[0].id,
                contact: cleanContact,
                message: 'Registration started. OTP sent to phone.'
            });
        }

        // Fallback if OTP fails
        const fallbackUser = newUser[0];
        if (fallbackUser.contact) fallbackUser.contact = decrypt(fallbackUser.contact);
        if (fallbackUser.address) fallbackUser.address = decrypt(fallbackUser.address);
        return res.status(201).json({
            message: 'User registered successfully (OTP failed)',
            user: fallbackUser
        });

    } catch (err) {
        console.error("❌ Google register error:", err);
        if (err.code === '23505') {
            return res.status(409).json({ message: "Email or Contact already registered" });
        }
        res.status(500).json({ message: "Server error during registration", error: err.message });
    }
};

module.exports = handleGoogleRegister;
