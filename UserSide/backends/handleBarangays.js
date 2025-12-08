/**
 * Barangay Handler
 * Handles barangay fetching and geofencing operations
 */

const db = require("./db");

/**
 * Get all barangays (Davao City only - citymunCode = 112402)
 * GET /api/barangays
 */
const getAllBarangays = async (req, res) => {
  try {
    // Filter to only Davao City barangays (citymunCode = 112402)
    const [barangays] = await db.query(
      `SELECT barangay_id, barangay_name, latitude, longitude, station_id 
       FROM barangays 
       WHERE citymunCode = '112402'
       ORDER BY barangay_name ASC`
    );

    console.log(`📍 Fetched ${barangays.length} Davao City barangays`);

    res.json({
      success: true,
      data: barangays,
      count: barangays.length
    });
  } catch (error) {
    console.error("Error fetching barangays:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch barangays",
      message: error.message
    });
  }
};

/**
 * Get barangay by coordinates using geofencing (point-in-polygon)
 * GET /api/barangay/by-coordinates?latitude=X&longitude=Y
 */
const getBarangayByCoordinates = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required"
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: "Invalid latitude or longitude"
      });
    }

    console.log('🔍 Finding barangay for coordinates:', { lat, lon });

    // Get all barangays with their boundary polygons
    const [barangays] = await db.query(
      `SELECT barangay_id, barangay_name, latitude, longitude, boundary_polygon, station_id 
       FROM barangays`
    );

    // Check which barangay contains the point
    let matchedBarangay = null;

    for (const barangay of barangays) {
      if (barangay.boundary_polygon) {
        try {
          const polygon = JSON.parse(barangay.boundary_polygon);
          if (polygon && polygon.coordinates && polygon.coordinates[0]) {
            if (isPointInPolygon(lat, lon, polygon.coordinates[0])) {
              matchedBarangay = {
                barangay_id: barangay.barangay_id,
                barangay_name: barangay.barangay_name,
                latitude: barangay.latitude,
                longitude: barangay.longitude,
                station_id: barangay.station_id
              };
              break;
            }
          }
        } catch (parseError) {
          console.error(`Error parsing polygon for ${barangay.barangay_name}:`, parseError);
        }
      }
    }

    if (matchedBarangay) {
      console.log('✅ Found barangay:', matchedBarangay.barangay_name);
      res.json({
        success: true,
        barangay: matchedBarangay
      });
    } else {
      // If no exact match, find nearest barangay by distance
      console.log('⚠️  No exact match, finding nearest barangay...');
      const nearestBarangay = findNearestBarangay(lat, lon, barangays);
      
      if (nearestBarangay) {
        console.log('✅ Found nearest barangay:', nearestBarangay.barangay_name);
        res.json({
          success: true,
          barangay: nearestBarangay,
          isApproximate: true
        });
      } else {
        res.json({
          success: false,
          error: "No barangay found for the given coordinates"
        });
      }
    }
  } catch (error) {
    console.error("Error finding barangay by coordinates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find barangay",
      message: error.message
    });
  }
};

/**
 * Point-in-polygon algorithm (Ray Casting)
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

/**
 * Find nearest barangay using Haversine formula
 * @param {number} lat - Point latitude
 * @param {number} lon - Point longitude
 * @param {Array} barangays - Array of barangay objects
 * @returns {Object|null} - Nearest barangay or null
 */
function findNearestBarangay(lat, lon, barangays) {
  let nearest = null;
  let minDistance = Infinity;

  for (const barangay of barangays) {
    const distance = calculateDistance(lat, lon, barangay.latitude, barangay.longitude);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        barangay_id: barangay.barangay_id,
        barangay_name: barangay.barangay_name,
        latitude: barangay.latitude,
        longitude: barangay.longitude,
        station_id: barangay.station_id,
        distance: distance.toFixed(2)
      };
    }
  }

  return nearest;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  getAllBarangays,
  getBarangayByCoordinates
};
