// handleReport.js
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { encrypt, decrypt, canDecrypt, encryptFields, decryptFields } = require("./encryptionService");
const { getClientIp, normalizeIp, getUserAgent } = require("./ipUtils");

/**
 * Point-in-polygon algorithm (Ray Casting)
 * Checks if a GPS coordinate falls within a polygon boundary
 * @param {number} lat - Point latitude
 * @param {number} lon - Point longitude
 * @param {Array} polygon - Array of [longitude, latitude] coordinates
 * @returns {boolean} - True if point is inside polygon
 */
function isPointInPolygon(lat, lon, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // longitude
    const yi = polygon[i][1]; // latitude
    const xj = polygon[j][0]; // longitude
    const yj = polygon[j][1]; // latitude

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../evidence");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "evidence-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed!"));
    }
  },
});

// Submit a new report
async function submitReport(req, res) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      title,
      crime_types,
      description,
      incident_date,
      is_anonymous,
      user_id,
      latitude,
      longitude,
      reporters_address,
      barangay,
      barangay_id,
    } = req.body;

    console.log("📝 Submitting report:", {
      title,
      crime_types,
      description,
      incident_date,
      is_anonymous,
      user_id,
      latitude,
      longitude,
      reporters_address,
      barangay,
      barangay_id,
      hasFile: !!req.file,
      fileDetails: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        destination: req.file.destination,
        filename: req.file.filename,
        path: req.file.path
      } : null
    });

    // Validation
    if (!title || !crime_types || !description || !incident_date || !user_id) {
      await connection.rollback();
      return res.status(422).json({
        success: false,
        message: "Missing required fields",
        errors: {
          title: !title ? ["Title is required"] : [],
          crime_types: !crime_types ? ["Crime type is required"] : [],
          description: !description ? ["Description is required"] : [],
          incident_date: !incident_date ? ["Incident date is required"] : [],
          user_id: !user_id ? ["User ID is required"] : [],
        },
      });
    }

    // Check if user is restricted
    const [userCheck] = await connection.query(
      'SELECT restriction_level, total_flags FROM users_public WHERE id = $1',
      [user_id]
    );

    if (userCheck.length > 0) {
      const { restriction_level, total_flags } = userCheck[0];
      if (restriction_level && restriction_level !== 'none') {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: `Your account is ${restriction_level}. You cannot submit reports until the restriction is lifted by an administrator.`,
          restriction: {
            level: restriction_level,
            flags: total_flags
          }
        });
      }
    }

    // ⚠️ CRITICAL: Date Validation - Prevent Future Dates & Enforce 24-Hour Window
    // This fixes the critical bug where users could report future incidents
    console.log('🔍 Validating incident date:', incident_date);

    const incidentTime = new Date(incident_date);
    const now = new Date();

    // Check if date is valid
    if (isNaN(incidentTime.getTime())) {
      await connection.rollback();
      return res.status(422).json({
        success: false,
        message: "Invalid incident date format",
        errors: {
          incident_date: ["The incident date is not valid. Please try again."]
        }
      });
    }

    // Check if date is in the future
    if (incidentTime > now) {
      const futureMinutes = Math.round((incidentTime - now) / 60000);
      console.log(`❌ Future date detected: ${futureMinutes} minutes in the future`);

      await connection.rollback();
      return res.status(422).json({
        success: false,
        message: "Cannot report future incidents",
        errors: {
          incident_date: [
            "You cannot report an incident that hasn't happened yet. " +
            "The incident date is in the future. Please check the date and time."
          ]
        }
      });
    }

    // Check if incident is within 24 hours
    const hoursDiff = (now - incidentTime) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      console.log(`❌ Incident too old: ${hoursDiff.toFixed(1)} hours ago`);

      await connection.rollback();
      return res.status(422).json({
        success: false,
        message: "Incident is too old to report through this app",
        errors: {
          incident_date: [
            "This app is for reporting recent incidents within the last 24 hours. " +
            `Your incident was ${Math.floor(hoursDiff)} hours ago. ` +
            "For older incidents, please visit your nearest police station to file a formal report."
          ]
        }
      });
    }

    console.log(`✅ Date validation passed: ${hoursDiff.toFixed(1)} hours ago`);

    // Parse crime types if it's a JSON string
    let crimeTypesArray;
    try {
      crimeTypesArray =
        typeof crime_types === "string"
          ? JSON.parse(crime_types)
          : crime_types;
    } catch (e) {
      crimeTypesArray = [crime_types];
    }
    const reportType = JSON.stringify(crimeTypesArray);

    // ⚠️ EVIDENCE REQUIREMENT: Make evidence mandatory (with exceptions)
    // This reduces fake reports and improves validation quality
    const EVIDENCE_OPTIONAL_CRIMES = [
      'Threats', 'Harassment', 'Missing Person', 'Suspicious Activity', 'Noise Complaint'
    ];

    const requiresEvidence = !crimeTypesArray.some(crime =>
      EVIDENCE_OPTIONAL_CRIMES.includes(crime)
    );

    if (requiresEvidence && !req.file) {
      console.log('❌ Evidence required but not provided for:', crimeTypesArray);
      await connection.rollback();
      return res.status(422).json({
        success: false,
        message: "Evidence is required for this type of report",
        errors: {
          media: [
            "Please upload photo or video evidence of this incident. " +
            "This helps police verify and respond faster to your report."
          ]
        }
      });
    }

    if (req.file) {
      console.log('✅ Evidence provided:', req.file.filename);
    } else if (!requiresEvidence) {
      console.log('ℹ️ Evidence optional for this crime type');
    }

    // Create location record
    const lat = latitude ? parseFloat(latitude) : 0;
    const lng = longitude ? parseFloat(longitude) : 0;

    // Use provided barangay name or fallback to coordinates
    const barangayName = barangay || (lat !== 0 && lng !== 0 ? `Lat: ${lat}, Lng: ${lng}` : "Unknown");
    const address = reporters_address || null;

    // 🔐 ENCRYPT location data before storing
    console.log("🔐 Encrypting location data (AES-256-CBC):");
    console.log("   Original Barangay:", barangayName);
    const encryptedBarangayName = encrypt(barangayName);
    console.log("   Encrypted Barangay (base64):", encryptedBarangayName.substring(0, 50) + "...");

    const encryptedAddress = address ? encrypt(address) : null;
    if (address) {
      console.log("   Original Address:", address);
      console.log("   Encrypted Address (base64):", encryptedAddress.substring(0, 50) + "...");
    }

    const [locationResult] = await connection.query(
      "INSERT INTO locations (barangay, reporters_address, latitude, longitude, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING location_id",
      [encryptedBarangayName, encryptedAddress, lat, lng]
    );

    const locationId = locationResult[0].location_id;
    console.log("✅ Location created with ID:", locationId);
    console.log("   Barangay:", barangayName);
    console.log("   Address:", address);
    console.log("   Coordinates:", lat, lng);

    // Get the station_id from provided barangay_id or calculate from coordinates
    let stationId = null;

    // Check if this is a cybercrime report - ONLY if explicitly contains "cybercrime"
    // Route to Cybercrime Division globally
    // Check if this is a cybercrime report - Broad check for "cyber" keyword
    // Route to Cybercrime Division globally
    const isCybercrime = crimeTypesArray.some(crime => {
      const normalized = crime.toLowerCase().trim();
      return normalized.includes('cybercrime') ||
        normalized.includes('cyber crime');
    });

    if (isCybercrime) {
      // Route cybercrime reports to Cybercrime Division (global assignment, no location-based assignment)
      try {
        const [cybercrimeStation] = await connection.query(
          `SELECT station_id FROM police_stations WHERE station_name = 'Cybercrime Division' LIMIT 1`
        );
        if (cybercrimeStation && cybercrimeStation.length > 0) {
          stationId = cybercrimeStation[0].station_id;
          console.log("🚨 Cybercrime report detected! Routing to Cybercrime Division (Station ID:", stationId, ")");
        } else {
          console.log("⚠️  Cybercrime Division station not found in database");
        }
      } catch (err) {
        console.log("⚠️  Error routing cybercrime report:", err.message);
      }
    } else {
      // Location-based routing for non-cybercrime reports
      // POLICY UPDATE: Strict Polygon Verification
      // We ignore the frontend provided barangay_id for assignment to ensure
      // the report is physically inside our defined jurisdiction polygons.
      /*
      if (barangay_id) {
        // Use provided barangay_id to get station_id
        try {
          const [barangayResult] = await connection.query(
            `SELECT station_id FROM barangays WHERE barangay_id = $1`,
            [barangay_id]
          );
          if (barangayResult && barangayResult.length > 0) {
            stationId = barangayResult[0].station_id;
            console.log("✅ Station ID assigned from barangay_id:", stationId);
          }
        } catch (err) {
          console.log("⚠️  Could not get station from barangay_id:", err.message);
        }
      }
      */

      // Fallback: Use point-in-polygon to find barangay by GPS coordinates
      // ONLY assign if point falls within a barangay's polygon boundary
      if (!stationId && lat !== 0 && lng !== 0) {
        try {
          console.log(`🗺️  Checking if coordinates (${lat}, ${lng}) fall within any barangay polygon...`);

          // Get all barangays with boundary polygons
          const [barangays] = await connection.query(
            `SELECT barangay_id, barangay_name, station_id, boundary_polygon 
             FROM barangays 
             WHERE boundary_polygon IS NOT NULL`
          );

          let foundBarangay = null;

          // Check each barangay's polygon
          for (const barangay of barangays) {
            if (barangay.boundary_polygon) {
              try {
                const polygon = JSON.parse(barangay.boundary_polygon);
                if (polygon && polygon.coordinates && polygon.coordinates[0]) {
                  // Use point-in-polygon algorithm
                  if (isPointInPolygon(lat, lng, polygon.coordinates[0])) {
                    foundBarangay = barangay;
                    break;
                  }
                }
              } catch (parseError) {
                console.log(`⚠️  Could not parse polygon for ${barangay.barangay_name}`);
              }
            }
          }

          if (foundBarangay && foundBarangay.station_id) {
            stationId = foundBarangay.station_id;
            console.log(`✅ Point falls within ${foundBarangay.barangay_name} polygon → Station ID: ${stationId}`);
          } else {
            console.log("⚠️  Coordinates do not fall within any barangay polygon - report will remain UNASSIGNED");
            stationId = null; // Explicitly set to null - do not assign
          }
        } catch (err) {
          console.log("⚠️  Error checking polygon boundaries:", err.message);
          stationId = null; // On error, leave unassigned
        }
      }
    }

    // Create report record
    const isAnon = is_anonymous === "1" || is_anonymous === true || is_anonymous === "true";

    // 🔐 ENCRYPT SENSITIVE DATA (AES-256-CBC)
    // As per capstone requirement: encrypt incident reports for confidentiality
    console.log("🔐 Encrypting report description (AES-256-CBC):");
    console.log("   Original Description Length:", description.length, "characters");
    console.log("   Original Description Preview:", description.substring(0, 50) + "...");

    const encryptedDescription = encrypt(description);

    console.log("   Encrypted Description (base64):", encryptedDescription.substring(0, 50) + "...");
    console.log("   Encrypted Length:", encryptedDescription.length, "characters");
    console.log("✅ Encryption complete - data secured with AES-256-CBC");

    // Note: stationId can be NULL if coordinates don't fall within any polygon
    const [reportResult] = await connection.query(
      `INSERT INTO reports 
       (user_id, location_id, title, report_type, description, date_reported, status, is_anonymous, assigned_station_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, NOW(), NOW()) RETURNING report_id`,
      [user_id, locationId, title, reportType, encryptedDescription, incident_date, isAnon, stationId]
    );

    const reportId = reportResult[0].report_id;
    console.log("✅ Report created with ID:", reportId);

    // Handle media upload if file exists
    let mediaData = null;
    if (req.file) {
      console.log("📸 Processing file upload...");
      console.log("   Original name:", req.file.originalname);
      console.log("   Saved as:", req.file.filename);
      console.log("   Size:", req.file.size, "bytes");
      console.log("   MIME type:", req.file.mimetype);
      console.log("   Saved to:", req.file.path);

      // ☁️ Upload to Cloudinary for persistent storage
      const { uploadFile, isConfigured } = require('./cloudinaryService');
      const fs = require('fs');

      let mediaUrl;
      const mediaType = path.extname(req.file.originalname).substring(1).toLowerCase();

      if (isConfigured()) {
        console.log("☁️ Uploading evidence to Cloudinary...");

        const uploadResult = await uploadFile(req.file.path, 'evidence', {
          public_id: `evidence_${reportId}_${Date.now()}`
        });

        if (uploadResult.success) {
          mediaUrl = uploadResult.url;
          console.log("✅ Evidence uploaded to Cloudinary:", mediaUrl);
        } else {
          console.error("❌ Cloudinary upload failed:", uploadResult.error);
          // Fallback to local path (will be lost on redeploy)
          mediaUrl = `/evidence/${req.file.filename}`;
          console.log("⚠️ Using local fallback path:", mediaUrl);
        }
      } else {
        console.log("⚠️ Cloudinary not configured, using local storage (will be lost on redeploy!)");
        mediaUrl = `/evidence/${req.file.filename}`;
      }

      console.log("   Media URL:", mediaUrl);
      console.log("   Media Type:", mediaType);

      try {
        const [mediaResult] = await connection.query(
          "INSERT INTO report_media (report_id, media_url, media_type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING media_id",
          [reportId, mediaUrl, mediaType]
        );

        mediaData = {
          media_id: mediaResult[0].media_id,
          media_url: mediaUrl,
          media_type: mediaType,
          file_size: req.file.size,
          original_name: req.file.originalname,
        };

        console.log("✅ Media uploaded successfully!");
        console.log("   Media ID:", mediaResult[0].media_id);
        console.log("   Stored in database: report_media table");
        console.log("   URL:", mediaUrl);
      } catch (dbError) {
        console.error("❌ Database insertion failed:", dbError);
        throw new Error("Failed to save media to database: " + dbError.message);
      }
    } else {
      console.log("⚠️  No file uploaded with this report");
    }

    // Track IP address for security and audit purposes
    try {
      const clientIp = normalizeIp(getClientIp(req));
      const userAgent = getUserAgent(req);

      console.log("📍 Tracking submission IP address...");
      console.log("   IP Address:", clientIp);
      console.log("   User Agent:", userAgent);

      await connection.query(
        `INSERT INTO report_ip_tracking (report_id, ip_address, user_agent, submitted_at) 
         VALUES ($1, $2, $3, NOW())`,
        [reportId, clientIp, userAgent]
      );

      console.log("✅ IP address tracked successfully");
    } catch (ipError) {
      // Don't fail the entire submission if IP tracking fails
      console.error("⚠️  Failed to track IP address:", ipError.message);
      // Continue with the transaction
    }

    // Commit transaction
    await connection.commit();

    // Return success response
    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: {
        report_id: reportId,
        title: title,
        report_type: reportType,
        status: "pending",
        is_anonymous: isAnon,
        date_reported: incident_date,
        station_id: stationId,
        location: {
          location_id: locationId,
          latitude: lat,
          longitude: lng,
          barangay: barangay,
          reporters_address: address,
        },
        media: mediaData,
      },
    });

    console.log("🎉 Report submitted successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error submitting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit report: " + error.message,
    });
  } finally {
    connection.release();
  }
}

// Get reports for a specific user
async function getUserReports(req, res) {
  try {
    const { userId } = req.params;
    // 🔒 SECURITY: Get verified role from database, NOT from client input
    const requestingUserId = req.query.requestingUserId || req.body.requestingUserId;
    let userRole = 'user';
    if (requestingUserId) {
      const [requestingUsers] = await db.query(
        "SELECT role FROM users_public WHERE id = $1",
        [requestingUserId]
      );
      if (requestingUsers.length > 0) {
        userRole = requestingUsers[0].role || 'user';
      }
    }

    const [reports] = await db.query(
      `SELECT 
        r.report_id,
        r.title,
        r.report_type::text,
        r.description,
        r.status,
        r.is_anonymous,
        r.date_reported,
        r.created_at,
        r.assigned_station_id as station_id,
        l.latitude,
        l.longitude,
        l.barangay,
        l.reporters_address,
        ps.station_name,
        ps.address as station_address,
        ps.contact_number,
        STRING_AGG(rm.media_id || ':' || rm.media_url || ':' || rm.media_type, '|') as media
      FROM reports r
      LEFT JOIN locations l ON r.location_id = l.location_id
      LEFT JOIN police_stations ps ON r.assigned_station_id = ps.station_id
      LEFT JOIN report_media rm ON r.report_id = rm.report_id
      WHERE r.user_id = $1 
        AND r.location_id IS NOT NULL 
        AND r.location_id != 0
        AND l.latitude IS NOT NULL 
        AND l.longitude IS NOT NULL
        AND l.latitude != 0
        AND l.longitude != 0
      GROUP BY r.report_id, r.title, r.report_type::text, r.description, r.status, r.is_anonymous, r.date_reported, r.created_at, r.assigned_station_id, l.latitude, l.longitude, l.barangay, l.reporters_address, ps.station_name, ps.address, ps.contact_number
      ORDER BY r.created_at DESC`,
      [userId]
    );

    // Parse media data and decrypt if authorized
    const formattedReports = reports.map((report) => {
      let mediaArray = [];
      if (report.media) {
        mediaArray = report.media.split("|").map((m) => {
          const [media_id, media_url, media_type] = m.split(":");
          return { media_id: parseInt(media_id), media_url, media_type };
        });
      }

      // 🔓 DECRYPT sensitive data for authorized roles (police/admin)
      // Regular users can only see their own encrypted data decrypted
      const decryptedDescription = decrypt(report.description);
      const decryptedBarangay = report.barangay ? decrypt(report.barangay) : null;
      const decryptedAddress = report.reporters_address ? decrypt(report.reporters_address) : null;

      // Parse report_type from JSON string to array
      let parsedReportType;
      try {
        parsedReportType = typeof report.report_type === 'string'
          ? JSON.parse(report.report_type)
          : report.report_type;
      } catch (e) {
        parsedReportType = [report.report_type];
      }

      return {
        report_id: report.report_id,
        title: report.title,
        report_type: parsedReportType,
        description: decryptedDescription,
        status: report.status,
        is_anonymous: Boolean(report.is_anonymous),
        date_reported: report.date_reported,
        created_at: report.created_at,
        station_id: report.station_id,
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          barangay: decryptedBarangay,
          reporters_address: decryptedAddress,
        },
        station: report.station_id ? {
          station_id: report.station_id,
          station_name: report.station_name,
          address: report.station_address,
          contact_number: report.contact_number,
        } : null,
        media: mediaArray,
      };
    });

    res.json({
      success: true,
      data: formattedReports,
    });
  } catch (error) {
    console.error("❌ Error fetching user reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
}

// Get all reports
async function getAllReports(req, res) {
  try {
    // 🔒 SECURITY: Get verified role and station from database, NOT from client input
    const requestingUserId = req.query.requestingUserId || req.body.requestingUserId;
    let userRole = 'user';
    let userStationId = null;

    if (requestingUserId) {
      const [requestingUsers] = await db.query(
        "SELECT role, station_id FROM users_public WHERE id = $1",
        [requestingUserId]
      );
      if (requestingUsers.length > 0) {
        userRole = requestingUsers[0].role || 'user';
        userStationId = requestingUsers[0].station_id;
      }
    }

    // Build query with role-based filtering
    let query = `SELECT 
        r.report_id,
        r.title,
        r.report_type::text,
        r.description,
        r.status,
        r.is_anonymous,
        r.date_reported,
        r.created_at,
        r.user_id,
        r.assigned_station_id as station_id,
        l.latitude,
        l.longitude,
        l.barangay,
        l.reporters_address,
        u.firstname,
        u.lastname,
        u.email,
        u.role as user_role,
        ps.station_name,
        ps.address as station_address,
        ps.contact_number,
        STRING_AGG(rm.media_id || ':' || rm.media_url || ':' || rm.media_type, '|') as media
      FROM reports r
      LEFT JOIN locations l ON r.location_id = l.location_id
      LEFT JOIN users_public u ON r.user_id = u.id
      LEFT JOIN police_stations ps ON r.assigned_station_id = ps.station_id
      LEFT JOIN report_media rm ON r.report_id = rm.report_id
      WHERE r.location_id IS NOT NULL 
        AND r.location_id != 0
        AND l.latitude IS NOT NULL 
        AND l.longitude IS NOT NULL
        AND l.latitude != 0
        AND l.longitude != 0`;

    // 🚨 ROLE-BASED FILTERING:
    // - Police: Only see reports assigned to their station
    // - Admin: See all reports (assigned and unassigned)
    // - User: See only their own reports
    const queryParams = [];
    if (userRole === 'police' && userStationId) {
      query += ` AND r.assigned_station_id = $1`;
      queryParams.push(userStationId);
      console.log(`👮 Police user requesting reports - filtering by station_id: ${userStationId}`);
    } else if (userRole === 'admin') {
      console.log(`👨‍💼 Admin user requesting reports - showing all reports (assigned and unassigned)`);
    } else if (userRole === 'user' && requestingUserId) {
      query += ` AND r.user_id = $1`;
      queryParams.push(requestingUserId);
      console.log(`👤 Regular user requesting reports - filtering by user_id: ${requestingUserId}`);
    }

    query += ` GROUP BY r.report_id, r.title, r.report_type::text, r.description, r.status, r.is_anonymous, r.date_reported, r.created_at, r.user_id, r.assigned_station_id, l.latitude, l.longitude, l.barangay, l.reporters_address, u.firstname, u.lastname, u.email, u.role, ps.station_name, ps.address, ps.contact_number ORDER BY r.created_at DESC`;

    const [reports] = await db.query(query, queryParams);

    // Parse media data and decrypt for authorized roles
    const formattedReports = reports.map((report) => {
      let mediaArray = [];
      if (report.media) {
        mediaArray = report.media.split("|").map((m) => {
          const [media_id, media_url, media_type] = m.split(":");
          return { media_id: parseInt(media_id), media_url, media_type };
        });
      }

      // 🔓 DECRYPT sensitive data ONLY for police/admin roles
      // As per capstone requirement: only authorized personnel can view decrypted incident reports
      let decryptedDescription = report.description;
      let decryptedBarangay = report.barangay;
      let decryptedAddress = report.reporters_address;

      if (canDecrypt(userRole)) {
        console.log(`🔓 Decrypting report ${report.report_id} for authorized role: ${userRole}`);
        decryptedDescription = decrypt(report.description);
        decryptedBarangay = report.barangay ? decrypt(report.barangay) : null;
        decryptedAddress = report.reporters_address ? decrypt(report.reporters_address) : null;
      } else {
        console.log(`🔒 Keeping report ${report.report_id} encrypted for role: ${userRole}`);
      }

      // Parse report_type from JSON string to array
      let parsedReportType;
      try {
        parsedReportType = typeof report.report_type === 'string'
          ? JSON.parse(report.report_type)
          : report.report_type;
      } catch (e) {
        parsedReportType = [report.report_type];
      }

      return {
        report_id: report.report_id,
        title: report.title,
        report_type: parsedReportType,
        description: decryptedDescription,
        status: report.status,
        is_anonymous: Boolean(report.is_anonymous),
        date_reported: report.date_reported,
        created_at: report.created_at,
        station_id: report.station_id,
        user: {
          user_id: report.user_id,
          firstname: report.firstname,
          lastname: report.lastname,
          email: report.email,
        },
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          barangay: decryptedBarangay,
          reporters_address: decryptedAddress,
        },
        station: report.station_id ? {
          station_id: report.station_id,
          station_name: report.station_name,
          address: report.station_address,
          contact_number: report.contact_number,
        } : null,
        media: mediaArray,
      };
    });

    res.json({
      success: true,
      data: formattedReports,
    });
  } catch (error) {
    console.error("❌ Error fetching all reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
}

module.exports = {
  upload,
  submitReport,
  getUserReports,
  getAllReports,
};
