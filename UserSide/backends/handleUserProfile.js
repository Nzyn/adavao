// handleUserProfile.js - API handlers for user profile operations
const db = require("./db");
const { verifyOtpInternal } = require("./handleOtp");

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

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`📊 Fetching user profile for ID: ${id}`);

    const [rows] = await db.query(
      "SELECT * FROM users_public WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    console.log("✅ User profile fetched:", user);

    res.json({
      success: true,
      data: user
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
    console.log(`📍 Address field received: "${address}"`);
    console.log(`🌍 Coordinates: lat=${latitude}, lng=${longitude}`);

    // Check if user exists in users_public table (UserSide app users only)
    const [existing] = await db.query("SELECT id FROM users_public WHERE id = ?", [id]);

    if (existing.length > 0) {
      // Update existing user - Check for sensitive changes (Phone Number)
      const userId = id;
      const [currentUserRows] = await db.query("SELECT contact FROM users_public WHERE id = ?", [userId]);
      const currentContact = currentUserRows[0]?.contact;

      // Normalize new contact for comparison
      let newContact = contact.trim().replace(/\s+/g, '');
      if (newContact.startsWith('0')) newContact = '+63' + newContact.slice(1);

      // If contact is changing, REQUIRE OTP
      if (currentContact && newContact !== currentContact) {
        console.log(`🔒 Sensitive Action: Changing phone from ${currentContact} to ${newContact}`);

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
        SET firstname = ?, 
            lastname = ?, 
            email = ?, 
            contact = ?, 
            address = ?, 
            latitude = ?,
            longitude = ?,
            station_id = ?,
            is_verified = ?,
            updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [
        firstname,
        lastname,
        email,
        contact,
        address,
        latitude || null,
        longitude || null,
        station_id || null,
        is_verified,
        id
      ]);

      console.log(`✅ User ${id} updated successfully`);
      console.log(`📍 Address saved: "${address}"`);
    } else {
      // Insert new user
      const query = `
        INSERT INTO users_public (id, firstname, lastname, email, contact, address, latitude, longitude, station_id, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await db.query(query, [
        id,
        firstname,
        lastname,
        email,
        contact,
        address,
        latitude || null,
        longitude || null,
        station_id || null,
        is_verified
      ]);

      console.log(`✅ User ${id} created successfully`);
      console.log(`📍 Address saved: "${address}"`);
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
      SET station_id = ?,
          updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [station_id, id]);

    if (result.affectedRows === 0) {
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

    const query = `
      UPDATE users_public 
      SET address = ?, 
          updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [address, id]);

    if (result.affectedRows === 0) {
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
       WHERE u.id = ?`,
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
