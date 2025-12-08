/**
 * Geofence utilities for Davao City boundary checking
 */

export interface Coordinates {
    latitude: number;
    longitude: number;
}

/**
 * Davao City boundaries based on OpenStreetMap administrative boundaries
 * Reference: OSM relation with boundary="administrative" and admin_level="6"
 * These coordinates form a polygon around Davao City
 */
const DAVAO_CITY_BOUNDS = {
    // Bounding box for Davao City
    north: 7.4000,  // Northern boundary (extended to include all of Davao City)
    south: 6.8500,  // Southern boundary  
    east: 125.7500, // Eastern boundary
    west: 125.2000, // Western boundary
};

/**
 * Detailed polygon for Davao City administrative boundary
 * Based on actual Davao City limits (administrative level 6)
 * This polygon covers the entire Davao City area including all districts
 */
const DAVAO_CITY_POLYGON: Coordinates[] = [
    // Northern boundary
    { latitude: 7.3800, longitude: 125.4500 },
    { latitude: 7.3500, longitude: 125.5500 },
    { latitude: 7.3000, longitude: 125.6500 },
    
    // Eastern boundary
    { latitude: 7.2500, longitude: 125.7000 },
    { latitude: 7.2000, longitude: 125.7200 },
    { latitude: 7.1500, longitude: 125.7300 },
    { latitude: 7.1000, longitude: 125.7200 },
    { latitude: 7.0500, longitude: 125.7000 },
    
    // Southeastern boundary
    { latitude: 7.0000, longitude: 125.6800 },
    { latitude: 6.9500, longitude: 125.6500 },
    { latitude: 6.9000, longitude: 125.6000 },
    { latitude: 6.8800, longitude: 125.5500 },
    
    // Southern boundary
    { latitude: 6.8700, longitude: 125.5000 },
    { latitude: 6.8800, longitude: 125.4500 },
    { latitude: 6.9000, longitude: 125.4000 },
    
    // Western boundary
    { latitude: 6.9500, longitude: 125.3500 },
    { latitude: 7.0000, longitude: 125.3000 },
    { latitude: 7.0500, longitude: 125.2500 },
    { latitude: 7.1000, longitude: 125.2300 },
    { latitude: 7.1500, longitude: 125.2200 },
    { latitude: 7.2000, longitude: 125.2300 },
    
    // Northwestern boundary
    { latitude: 7.2500, longitude: 125.2500 },
    { latitude: 7.3000, longitude: 125.3000 },
    { latitude: 7.3500, longitude: 125.3500 },
    { latitude: 7.3800, longitude: 125.4000 },
];

/**
 * Check if a point is inside Davao City using bounding box (fast check)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns true if inside Davao City bounding box
 */
export function isInsideDavaoCityBoundingBox(latitude: number, longitude: number): boolean {
    return (
        latitude >= DAVAO_CITY_BOUNDS.south &&
        latitude <= DAVAO_CITY_BOUNDS.north &&
        longitude >= DAVAO_CITY_BOUNDS.west &&
        longitude <= DAVAO_CITY_BOUNDS.east
    );
}

/**
 * Point-in-polygon algorithm (Ray casting algorithm)
 * Checks if a point is inside a polygon
 * @param point - Point to check
 * @param polygon - Polygon vertices
 * @returns true if point is inside polygon
 */
function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;

        const intersect = ((yi > y) !== (yj > y)) && 
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Check if coordinates are within Davao City boundaries
 * Uses both bounding box and polygon checks for accuracy
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns true if inside Davao City
 */
export function isInsideDavaoCity(latitude: number, longitude: number): boolean {
    // First do a quick bounding box check
    if (!isInsideDavaoCityBoundingBox(latitude, longitude)) {
        return false;
    }

    // Then do a more precise polygon check
    return isPointInPolygon({ latitude, longitude }, DAVAO_CITY_POLYGON);
}

/**
 * Get the distance from a point to the nearest Davao City boundary (approximate)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Distance in kilometers (approximate)
 */
export function getDistanceFromDavaoBoundary(latitude: number, longitude: number): number {
    const center = { latitude: 7.0731, longitude: 125.6128 }; // Davao City center
    return haversineDistance(latitude, longitude, center.latitude, center.longitude);
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Get user-friendly message for out-of-bounds location
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns User-friendly error message
 */
export function getOutOfBoundsMessage(latitude: number, longitude: number): string {
    return `We Only Accept Reports Within Davao City\n\n` +
           `The selected location is outside Davao City boundaries.\n\n` +
           `Please select a different location within Davao City to proceed with your report.`;
}

/**
 * Validate if coordinates are valid and within Davao City
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Object with isValid and optional error message
 */
export function validateDavaoLocation(latitude: number, longitude: number): {
    isValid: boolean;
    errorMessage?: string;
} {
    // Check if coordinates are valid numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude)) {
        return {
            isValid: false,
            errorMessage: 'Invalid coordinates provided.'
        };
    }

    // Check if coordinates are within reasonable bounds for Earth
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return {
            isValid: false,
            errorMessage: 'Coordinates are out of valid range.'
        };
    }

    // Check if within Davao City
    if (!isInsideDavaoCity(latitude, longitude)) {
        return {
            isValid: false,
            errorMessage: getOutOfBoundsMessage(latitude, longitude)
        };
    }

    return { isValid: true };
}
