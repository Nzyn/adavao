import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/backend';

let locationSubscription: Location.LocationSubscription | null = null;
let isTracking = false;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

// Default polling interval: 2 seconds (for real-time tracking)
const DEFAULT_POLLING_INTERVAL = 2000;

export interface PatrolLocation {
    userId: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
    timestamp: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
            console.log('❌ Foreground location permission denied');
            return false;
        }

        // Request background location for continuous tracking
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
            console.warn('⚠️ Background location permission denied - tracking will only work while app is open');
        }

        console.log('✅ Location permissions granted');
        return true;
    } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
    }
}

/**
 * Get user ID from AsyncStorage
 */
async function getUserId(): Promise<string | null> {
    try {
        const stored = await AsyncStorage.getItem('userData');
        if (!stored) return null;
        const user = JSON.parse(stored);
        return user?.id?.toString() || user?.userId?.toString() || null;
    } catch {
        return null;
    }
}

/**
 * Send location update to backend
 */
async function sendLocationToBackend(location: PatrolLocation): Promise<boolean> {
    try {
        console.log('📍 Sending patrol location:', {
            lat: location.latitude.toFixed(6),
            lng: location.longitude.toFixed(6),
            accuracy: location.accuracy?.toFixed(0),
        });

        const response = await fetch(`${API_URL}/patrol/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(location),
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Patrol location updated successfully');
            return true;
        } else {
            console.error('❌ Failed to update patrol location:', data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending patrol location:', error);
        return false;
    }
}

/**
 * Get current location and send to backend
 */
async function updateLocation(): Promise<void> {
    try {
        const userId = await getUserId();
        if (!userId) {
            console.log('⚠️ No user ID found, skipping location update');
            return;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const patrolLocation: PatrolLocation = {
            userId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            accuracy: location.coords.accuracy,
            timestamp: new Date().toISOString(),
        };

        await sendLocationToBackend(patrolLocation);
    } catch (error) {
        console.error('Error getting current location:', error);
    }
}

/**
 * Start continuous location tracking for patrol officers
 * Uses polling approach for reliable updates
 */
export async function startLocationTracking(
    pollingIntervalMs: number = DEFAULT_POLLING_INTERVAL
): Promise<boolean> {
    if (isTracking) {
        console.log('⚠️ Location tracking already active');
        return true;
    }

    try {
        // Request permissions first
        const hasPermission = await requestLocationPermissions();
        if (!hasPermission) {
            return false;
        }

        // Send initial location immediately
        await updateLocation();

        // Start polling interval
        pollingInterval = setInterval(updateLocation, pollingIntervalMs);
        isTracking = true;

        console.log(`✅ Patrol location tracking started (polling every ${pollingIntervalMs / 1000}s)`);
        return true;
    } catch (error) {
        console.error('Error starting location tracking:', error);
        return false;
    }
}

/**
 * Start real-time location watching (more battery intensive)
 * Use this for active dispatch situations
 */
export async function startRealtimeTracking(): Promise<boolean> {
    if (locationSubscription) {
        console.log('⚠️ Realtime tracking already active');
        return true;
    }

    try {
        const hasPermission = await requestLocationPermissions();
        if (!hasPermission) {
            return false;
        }

        const userId = await getUserId();
        if (!userId) {
            console.log('⚠️ No user ID found');
            return false;
        }

        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000, // Update every 2 seconds
                distanceInterval: 5, // Or when moved 5 meters
            },
            async (location) => {
                const patrolLocation: PatrolLocation = {
                    userId,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    heading: location.coords.heading,
                    speed: location.coords.speed,
                    accuracy: location.coords.accuracy,
                    timestamp: new Date().toISOString(),
                };

                await sendLocationToBackend(patrolLocation);
            }
        );

        console.log('✅ Realtime patrol location tracking started');
        return true;
    } catch (error) {
        console.error('Error starting realtime tracking:', error);
        return false;
    }
}

/**
 * Stop all location tracking
 */
export function stopLocationTracking(): void {
    // Stop polling
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    // Stop realtime subscription
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }

    isTracking = false;
    console.log('🛑 Patrol location tracking stopped');
}

/**
 * Check if location tracking is currently active
 */
export function isLocationTrackingActive(): boolean {
    return isTracking || locationSubscription !== null;
}

/**
 * Get current location once (for manual updates)
 */
export async function getCurrentLocation(): Promise<PatrolLocation | null> {
    try {
        const userId = await getUserId();
        if (!userId) return null;

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            userId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            accuracy: location.coords.accuracy,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
}

export default {
    requestLocationPermissions,
    startLocationTracking,
    startRealtimeTracking,
    stopLocationTracking,
    isLocationTrackingActive,
    getCurrentLocation,
};
