/**
 * Location Service Handler
 * Handles geocoding, reverse geocoding, and location searches via Nominatim API
 * Routes requests through backend to avoid CORS issues on the frontend
 */

/**
 * Search for locations by name
 * GET /api/location/search?q=search+query
 */
const searchLocation = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: "Search query is required",
        results: []
      });
    }

    console.log('🔍 Searching for location:', q);

    // Davao City bounding box for geofencing
    // Southwest: 6.85, 125.20
    // Northeast: 7.40, 125.75
    const DAVAO_BOUNDS = {
      minLat: 6.85,
      maxLat: 7.40,
      minLon: 125.20,
      maxLon: 125.75
    };

    // Function to check if coordinates are within Davao City
    const isInDavaoCity = (lat, lon) => {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      return latitude >= DAVAO_BOUNDS.minLat &&
        latitude <= DAVAO_BOUNDS.maxLat &&
        longitude >= DAVAO_BOUNDS.minLon &&
        longitude <= DAVAO_BOUNDS.maxLon;
    };

    // Add bounding box to the search query
    const boundingBox = `&bounded=1&viewbox=${DAVAO_BOUNDS.minLon},${DAVAO_BOUNDS.maxLat},${DAVAO_BOUNDS.maxLon},${DAVAO_BOUNDS.minLat}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=20&countrycodes=PH${boundingBox}`;

    // Helper: Delay function for retries
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    // Retry loop
    while (attempts < maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per attempt

      try {
        attempts++;
        console.log(`🌍 Attempt ${attempts}/${maxAttempts} fetching from Nominatim...`);

        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'AlertDavao/2.0 (Crime Reporting App)',
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) break; // Success!

        // If not ok, throw error to trigger retry
        throw new Error(`Nominatim API error: ${response.status}`);

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        console.warn(`⚠️ Attempt ${attempts} failed:`, error.message);

        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff: 1s, 2s, 4s...)
          const waitTime = 1000 * Math.pow(2, attempts - 1);
          await delay(waitTime);
        }
      }
    }

    // If still failing after retries
    if (!response || !response.ok) {
      console.error('❌ All geocoding attempts failed.');
      throw lastError || new Error('Failed to connect to geocoding service');
    }

    const data = await response.json();
    console.log(`📍 Found ${data.length} total results for "${q}"`);

    // Filter results to only include locations within Davao City boundaries
    const davaoCityResults = data.filter(item => {
      // Check if coordinates are within Davao City bounds
      if (!isInDavaoCity(item.lat, item.lon)) {
        return false;
      }

      // Additional check
      const addressLower = item.display_name.toLowerCase();
      const isDavaoRelated = addressLower.includes('davao');

      return isDavaoRelated;
    });

    console.log(`✅ Filtered to ${davaoCityResults.length} results within Davao City`);

    // Format results for frontend consumption
    const results = davaoCityResults.slice(0, 10).map(item => ({
      address: item.display_name,
      lat: item.lat,
      lon: item.lon,
      name: item.name,
      city: item.address?.city || item.address?.town || item.address?.municipality || 'Davao City',
      display_name: item.display_name,
    }));

    res.json({
      success: true,
      query: q,
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching location:', error);

    if (error.name === 'AbortError') {
      return res.status(408).json({
        error: "Search request timed out",
        results: []
      });
    }

    res.status(500).json({
      error: "Failed to search for location",
      message: error.message,
      results: []
    });
  }
};

/**
 * Reverse geocode coordinates to address
 * GET /api/location/reverse?lat=latitude&lon=longitude
 */
const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Latitude and longitude are required"
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: "Invalid latitude or longitude"
      });
    }

    console.log('🔄 Reverse geocoding:', latitude, longitude);

    // Helper: Delay function for retries
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    // Retry loop with exponential backoff
    while (attempts < maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        attempts++;
        console.log(`🌍 Reverse geocode attempt ${attempts}/${maxAttempts}...`);

        response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'AlertDavao/2.0 (Crime Reporting App; contact@alertdavao.ph)',
              'Accept': 'application/json',
            }
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) break; // Success!

        throw new Error(`Nominatim API error: ${response.status}`);

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        console.warn(`⚠️ Reverse geocode attempt ${attempts} failed:`, error.message);

        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff: 1s, 2s, 4s...)
          const waitTime = 1000 * Math.pow(2, attempts - 1);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      }
    }

    // If all retries failed, return coordinate-based fallback
    if (!response || !response.ok) {
      console.warn('⚠️ All reverse geocode attempts failed, using coordinate fallback');
      const fallbackAddress = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      return res.json({
        success: true,
        latitude: latitude,
        longitude: longitude,
        address: fallbackAddress,
        display_name: fallbackAddress,
        raw: null,
        fallback: true
      });
    }

    const data = await response.json();

    if (!data || !data.address) {
      // Return coordinates as fallback
      const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      console.log('⚠️  No address found, using coordinates:', fallbackAddress);

      return res.json({
        success: true,
        latitude: latitude,
        longitude: longitude,
        address: fallbackAddress,
        display_name: fallbackAddress,
        raw: data
      });
    }

    // Format address from Nominatim response
    const addr = data.address;
    const formattedAddress = [
      addr.road || addr.street || addr.path,
      addr.suburb || addr.neighbourhood || addr.village,
      addr.city || addr.town || addr.municipality || addr.county,
      addr.state || addr.region || addr.province
    ]
      .filter(Boolean)
      .join(', ')
      .replace(/,+/g, ', ')
      .trim();

    console.log('✅ Reverse geocoded address:', formattedAddress);

    res.json({
      success: true,
      latitude: latitude,
      longitude: longitude,
      address: formattedAddress || data.display_name,
      display_name: data.display_name,
      raw: data
    });
  } catch (error) {
    console.error('Error reverse geocoding:', error);

    // Even on error, return a fallback response so the frontend doesn't break
    const { lat, lon } = req.query;
    const latitude = parseFloat(lat) || 0;
    const longitude = parseFloat(lon) || 0;

    if (latitude && longitude) {
      const fallbackAddress = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      return res.json({
        success: true,
        latitude: latitude,
        longitude: longitude,
        address: fallbackAddress,
        display_name: fallbackAddress,
        raw: null,
        fallback: true,
        error: error.message
      });
    }

    res.status(500).json({
      error: "Failed to reverse geocode coordinates",
      message: error.message
    });
  }
};

/**
 * Get distance between two coordinates
 * GET /api/location/distance?lat1=x&lon1=y&lat2=a&lon2=b
 */
const getDistance = (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({
        error: "All coordinates (lat1, lon1, lat2, lon2) are required"
      });
    }

    const latitude1 = parseFloat(lat1);
    const longitude1 = parseFloat(lon1);
    const latitude2 = parseFloat(lat2);
    const longitude2 = parseFloat(lon2);

    if (isNaN(latitude1) || isNaN(longitude1) || isNaN(latitude2) || isNaN(longitude2)) {
      return res.status(400).json({
        error: "Invalid coordinates"
      });
    }

    // Haversine formula for calculating distance between two points on Earth
    const R = 6371; // Earth's radius in kilometers
    const dLat = (latitude2 - latitude1) * Math.PI / 180;
    const dLon = (longitude2 - longitude1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latitude1 * Math.PI / 180) * Math.cos(latitude2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    console.log(`📏 Distance calculated: ${distance.toFixed(2)} km`);

    res.json({
      success: true,
      distance_km: parseFloat(distance.toFixed(2)),
      distance_m: Math.round(distance * 1000),
      from: { latitude: latitude1, longitude: longitude1 },
      to: { latitude: latitude2, longitude: longitude2 }
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({
      error: "Failed to calculate distance",
      message: error.message
    });
  }
};

module.exports = {
  searchLocation,
  reverseGeocode,
  getDistance
};
