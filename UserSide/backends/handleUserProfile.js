// handleUserProfile.js - API handlers for user profile operations
const db = require("./db");
const { verifyOtpInternal } = require("./handleOtp");
const { encrypt, decrypt } = require("./encryptionService");

// Test MySQL connection
const testConnection = async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, message: "Database connection successful" });
  } catch (error) {
    console.error("Database connection test failed:", error);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
};

// Get user by ID (handles both public users and admin/officer users)
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`📊 Fetching user profile for ID: ${id}`);

    // 1. Try to find in users_public first
    const [publicRows] = await db.query(
      `SELECT u.*, 
              ps.station_name, ps.address as station_address, ps.contact_number as station_contact 
       FROM users_public u
       LEFT JOIN police_stations ps ON u.station_id = ps.station_id
       WHERE u.id = $1`,
      [id]
    );

    let user = null;
    let isOfficer = false;

    if (publicRows.length > 0) {
      user = publicRows[0];
    } else {
      // 2. If not found, try user_admin (officers)
      console.log(`   User ${id} not found in users_public, checking user_admin...`);
      const [adminRows] = await db.query(
        `SELECT u.id, u.firstname, u.lastname, u.email, u.contact, u.station_id,
                ps.station_name, ps.address as station_address, ps.contact_number as station_contact,
                r.role_name as role
         FROM user_admin u
         LEFT JOIN user_admin_roles uar ON u.id = uar.user_admin_id
         LEFT JOIN roles r ON uar.role_id = r.role_id
         LEFT JOIN police_stations ps ON u.station_id = ps.station_id
         WHERE u.id = $1`,
        [id]
      );

      if (adminRows.length > 0) {
        user = adminRows[0];
        isOfficer = true;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Decrypt sensitive fields
    if (user.address) user.address = decrypt(user.address);
    if (user.contact) user.contact = decrypt(user.contact);

    console.log("✅ User profile fetched:", { id: user.id, name: `${user.firstname} ${user.lastname}`, role: user.role || 'user' });

    // 3. Structure the response to include 'station' object if applicable
    const responseData = {
      ...user,
      station: user.station_id ? {
        station_id: user.station_id,
        station_name: user.station_name,
        address: user.station_address,
        contact_number: user.station_contact
      } : null
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message
    });
  }
};

// Insert or update user (upsert)
const upsertUser = async (req, res) => {
  const { id, firstname, lastname, email, contact, address, latitude, longitude, station_id, is_verified } = req.body;

  try {
    console.log("💾 Upserting user profile:", req.body);

    // Encrypt sensitive fields before checking/saving
    const encryptedAddress = address ? encrypt(address) : null;
    const encryptedContact = contact ? encrypt(contact) : null;

    // NOTE: We use the *plain* contact for OTP checks to match user input, 
    // but we use *encrypted* contact for database storage.

    // Check if user exists in users_public table (UserSide app users only)
    const [existing] = await db.query("SELECT id, contact FROM users_public WHERE id = $1", [id]);

    if (existing.length > 0) {
      // Update existing user - Check for sensitive changes (Phone Number)
      const userId = id;
      // We need to fetch and decrypt the current contact to compare
      const currentEncryptedContact = existing[0]?.contact;
      const currentContact = currentEncryptedContact ? decrypt(currentEncryptedContact) : null;

      // Normalize new contact for comparison
      let newContact = contact.trim().replace(/\s+/g, '');
      if (newContact.startsWith('0')) newContact = '+63' + newContact.slice(1);

      let oldContactNormalized = currentContact ? currentContact.trim().replace(/\s+/g, '') : '';
      if (oldContactNormalized.startsWith('0')) oldContactNormalized = '+63' + oldContactNormalized.slice(1);

      // If contact is changing, REQUIRE OTP
      if (oldContactNormalized && newContact !== oldContactNormalized) {
        console.log(`🔒 Sensitive Action: Changing phone from ${oldContactNormalized} to ${newContact}`);

        if (!req.body.otp) {
          return res.status(400).json({
            success: false,
            message: "OTP is required to change phone number",
            requireOtp: true
          });
        }

        const verification = await verifyOtpInternal(newContact, req.body.otp, 'change_phone');
        if (!verification.success) {
          return res.status(400).json({
            success: false,
            message: verification.message
          });
        }
        console.log("✅ Phone change OTP verified");
      }

      // Update existing user
      const query = `
        UPDATE users_public 
        SET firstname = $1, 
            lastname = $2, 
            email = $3, 
            contact = $4, 
            address = $5, 
            latitude = $6,
            longitude = $7,
            station_id = $8,
            is_verified = $9,
            updated_at = NOW()
        WHERE id = $10
      `;

      await db.query(query, [
        firstname,
        lastname,
        email,
        encryptedContact,
        encryptedAddress,
        latitude || null,
        longitude || null,
        station_id || null,
        is_verified,
        id
      ]);

      console.log(`✅ User ${id} updated successfully`);
    } else {
      // Insert new user
      const query = `
        INSERT INTO users_public (id, firstname, lastname, email, contact, address, latitude, longitude, station_id, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `;

      await db.query(query, [
        id,
        firstname,
        lastname,
        email,
        encryptedContact,
        encryptedAddress,
        latitude || null,
        longitude || null,
        station_id || null,
        is_verified
      ]);

      console.log(`✅ User ${id} created successfully`);
    }

    res.json({
      success: true,
      message: "User profile saved successfully"
    });
  } catch (error) {
    console.error("❌ Error upserting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save user profile",
      error: error.message
    });
  }
};

// Update user station assignment
const updateUserStation = async (req, res) => {
  const { id } = req.params;
  const { station_id } = req.body;

  try {
    console.log(`🚔 Assigning user ${id} to station ${station_id}`);

    const query = `
      UPDATE users_public 
      SET station_id = $1,
          updated_at = NOW()
      WHERE id = $2 RETURNING id
    `;

    const [result] = await db.query(query, [station_id, id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`✅ User ${id} assigned to station ${station_id}`);

    res.json({
      success: true,
      message: "User station assignment updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating user station:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user station",
      error: error.message
    });
  }
};

// Update user address only
const updateUserAddress = async (req, res) => {
  const { id } = req.params;
  const { address } = req.body;

  try {
    console.log(`📍 Updating address for user ${id}:`, address);

    const encryptedAddress = address ? encrypt(address) : null;

    const query = `
      UPDATE users_public 
      SET address = $1, 
          updated_at = NOW()
      WHERE id = $2 RETURNING id
    `;

    const [result] = await db.query(query, [encryptedAddress, id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Address updated successfully for user ${id}`);

    res.json({
      success: true,
      message: "Address updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating address:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message
    });
  }
};

// Get user's assigned police station (for police officers)
const getUserStation = async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`🚔 Fetching station for police officer ID: ${userId}`);

    const [userRows] = await db.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.station_id,
              ps.station_id, ps.station_name, ps.address, ps.contact_number
       FROM users_public u
       LEFT JOIN police_stations ps ON u.station_id = ps.station_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userData = userRows[0];

    if (!userData.station_id) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to a police station"
      });
    }

    console.log(`✅ Station found for officer ${userId}:`, userData.station_name);

    res.json({
      success: true,
      data: {
        user_id: userData.id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        station: {
          station_id: userData.station_id,
          station_name: userData.station_name,
          address: userData.address,
          contact_number: userData.contact_number
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user station:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user station",
      error: error.message
    });
  }
};

// Execute raw SQL query (for debugging/testing)
const executeQuery = async (req, res) => {
  const { query, params } = req.body;

  try {
    console.log("🔧 Executing query:", query, params);

    const [rows] = await db.query(query, params || []);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("❌ Query execution failed:", error);
    res.status(500).json({
      success: false,
      message: "Query execution failed",
      error: error.message
    });
  }
};

module.exports = {
  testConnection,
  getUserById,
  upsertUser,
  updateUserAddress,
  updateUserStation,
  getUserStation,
  executeQuery
};
