import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Network from 'expo-network';

/**
 * Automatically detects and returns the appropriate backend URL
 * Works with any network configuration without manual IP updates
 */

const BACKEND_PORT = 3000;

// Get API_BASE_URL from environment variables (for production builds)
const PRODUCTION_API_URL = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * Get the backend URL dynamically based on platform and network
 */
export async function getBackendUrl(): Promise<string> {
  // If production API URL is set (from .env.production), use it
  if (PRODUCTION_API_URL && PRODUCTION_API_URL !== 'https://YOUR_NGROK_BACKEND_URL_HERE') {
    console.log('🌐 Using production API URL:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }

  // For web platform, ALWAYS use localhost (no network detection needed)
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform detected - using localhost:' + BACKEND_PORT);
    return `http://localhost:${BACKEND_PORT}`;
  }

  // For iOS Simulator, localhost works
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // For Android Emulator, use special Android emulator localhost
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  // For physical devices, try to get the local network IP
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip && ip !== '0.0.0.0') {
      // Use the device's IP - the server should be accessible on the same network
      // Get the network prefix (e.g., 192.168.1.x) and assume server is reachable
      return `http://${ip.split('.').slice(0, 3).join('.')}.9:${BACKEND_PORT}`;
    }
  } catch (error) {
    console.warn('Could not get network IP:', error);
  }

  // Fallback: Try common router IPs
  return `http://192.168.1.9:${BACKEND_PORT}`;
}

/**
 * Get backend URL synchronously (for immediate use)
 * Falls back to common patterns
 */
export function getBackendUrlSync(): string {
  // If production API URL is set (from .env.production), use it
  if (PRODUCTION_API_URL && PRODUCTION_API_URL !== 'https://YOUR_NGROK_BACKEND_URL_HERE') {
    console.log('🌐 Using production API URL (sync):', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }

  // CRITICAL: For web platform, ALWAYS use localhost
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform (sync) - using localhost:' + BACKEND_PORT);
    return `http://localhost:${BACKEND_PORT}`;
  }


  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return `http://localhost:${BACKEND_PORT}`;
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    console.log('📱 Android Emulator (sync) - using 10.0.2.2:' + BACKEND_PORT);
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  // For physical devices on local network
  // The server must be running with 0.0.0.0 binding (which it is in server.js)
  // Using your PC's actual IP address
  return `http://192.168.1.9:${BACKEND_PORT}`;
}

/**
 * Test if a URL is reachable
 */
export async function testConnection(url: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${url}/api/test-connection`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Find the working backend URL from a list of candidates
 */
export async function findWorkingBackendUrl(): Promise<string> {
  // If production API URL is set (from .env.production), use it directly
  if (PRODUCTION_API_URL && PRODUCTION_API_URL !== 'https://YOUR_NGROK_BACKEND_URL_HERE') {
    console.log('🌐 Using production API URL:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }

  // CRITICAL: For web platform, ALWAYS return localhost immediately
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform - skipping network detection, using localhost:' + BACKEND_PORT);
    return `http://localhost:${BACKEND_PORT}`;
  }

  const candidates = [
    // Emulator/Simulator URLs
    // Emulator/Simulator URLs - Commented out to force physical device IP
    // Platform.OS === 'android' && !Constants.isDevice ? `http://10.0.2.2:${BACKEND_PORT}` : null,
    // Platform.OS === 'ios' && !Constants.isDevice ? `http://localhost:${BACKEND_PORT}` : null,

    // Your PC's IP address (highest priority)
    `http://192.168.1.9:${BACKEND_PORT}`,

    // Common local network IPs
    `http://192.168.0.42:${BACKEND_PORT}`,
    `http://192.168.1.9:${BACKEND_PORT}`,
    `http://192.168.0.1:${BACKEND_PORT}`,
    `http://10.0.0.1:${BACKEND_PORT}`,

    // Localhost for web
    `http://localhost:${BACKEND_PORT}`,
  ].filter(Boolean) as string[];

  // Try to get network IP and add it to candidates
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip && ip !== '0.0.0.0') {
      const networkPrefix = ip.split('.').slice(0, 3).join('.');
      candidates.unshift(`http://${networkPrefix}.42:${BACKEND_PORT}`);
      candidates.unshift(`http://${networkPrefix}.9:${BACKEND_PORT}`);
    }
  } catch (error) {
    console.warn('Could not get network IP:', error);
  }

  console.log('🔍 Testing backend URLs:', candidates);

  // Test each candidate
  for (const url of candidates) {
    console.log(`Testing: ${url}`);
    const isReachable = await testConnection(url, 3000);
    if (isReachable) {
      console.log(`✅ Found working backend: ${url}`);
      return url;
    }
  }

  // If nothing works, return the sync default
  console.warn('⚠️ No working backend found, using default');
  return getBackendUrlSync();
}
