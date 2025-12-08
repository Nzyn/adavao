// Import the offline data directly - NO API CALLS, works 100% offline
import policeStationsOfflineData from '../data/policeStationsOfflineData.json';

export interface BarangayStation {
  barangay_name: string;
  station_id: number;
  station_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_number: string | null;
}

export interface PoliceStation {
  station_id: number;
  station_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_number: string | null;
  barangays: string[];
}

/**
 * Convert offline data to BarangayStation format (flattened list)
 */
const getBarangayStationsFromOfflineData = (): BarangayStation[] => {
  const barangayStations: BarangayStation[] = [];
  
  policeStationsOfflineData.policeStations.forEach((station) => {
    station.barangays.forEach((barangayName) => {
      barangayStations.push({
        barangay_name: barangayName,
        station_id: station.station_id,
        station_name: station.station_name,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        contact_number: station.contact_number,
      });
    });
  });
  
  return barangayStations;
};

/**
 * Sync police station data - NO-OP for offline version
 * Data is bundled with the app, no syncing needed
 */
export const syncPoliceStations = async (force: boolean = false): Promise<void> => {
  console.log('✅ Using offline police stations data - no sync needed');
  return Promise.resolve();
};

/**
 * Get all barangays with their police station information
 * Returns data from the bundled JSON file
 */
export const getAllBarangaysWithStations = async (): Promise<BarangayStation[]> => {
  try {
    return getBarangayStationsFromOfflineData();
  } catch (error) {
    console.error('Error getting barangays with stations:', error);
    return [];
  }
};

/**
 * Get all unique barangay names (sorted alphabetically)
 */
export const getAllBarangayNames = async (): Promise<string[]> => {
  try {
    const data = getBarangayStationsFromOfflineData();
    const names = data.map(item => item.barangay_name);
    return [...new Set(names)].sort();
  } catch (error) {
    console.error('Error getting barangay names:', error);
    return [];
  }
};

/**
 * Search for a specific barangay and return its police station info
 */
export const searchBarangay = async (barangayName: string): Promise<BarangayStation | null> => {
  try {
    const data = getBarangayStationsFromOfflineData();
    const result = data.find(
      item => item.barangay_name.toLowerCase() === barangayName.toLowerCase()
    );
    return result || null;
  } catch (error) {
    console.error('Error searching barangay:', error);
    return null;
  }
};

/**
 * Get all police stations with their barangays
 */
export const getAllPoliceStations = async (): Promise<PoliceStation[]> => {
  try {
    return policeStationsOfflineData.policeStations as PoliceStation[];
  } catch (error) {
    console.error('Error getting police stations:', error);
    return [];
  }
};

/**
 * Get a specific police station by ID
 */
export const getPoliceStationById = async (stationId: number): Promise<PoliceStation | null> => {
  try {
    const station = policeStationsOfflineData.policeStations.find(
      s => s.station_id === stationId
    );
    return station ? (station as PoliceStation) : null;
  } catch (error) {
    console.error('Error getting police station:', error);
    return null;
  }
};

/**
 * Get barangays for a specific police station
 */
export const getBarangaysByStation = async (stationId: number): Promise<string[]> => {
  try {
    const station = policeStationsOfflineData.policeStations.find(
      s => s.station_id === stationId
    );
    return station ? station.barangays : [];
  } catch (error) {
    console.error('Error getting barangays by station:', error);
    return [];
  }
};

/**
 * Clear cached data - NO-OP for offline version
 */
export const clearPoliceStationsCache = async (): Promise<void> => {
  console.log('ℹ️ Using offline data - no cache to clear');
  return Promise.resolve();
};
