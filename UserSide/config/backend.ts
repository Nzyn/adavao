import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getBackendUrlSync, findWorkingBackendUrl } from '../utils/networkUtils';

/**
 * Backend API Configuration
 * 
 * PRODUCTION MODE: Uses API_BASE_URL from app.json extra config
 * DEVELOPMENT MODE: Auto-detects your network
 * 
 * The system will:
 * 1. Check if API_BASE_URL is configured (production)
 * 2. Detect if you're on emulator/simulator (uses localhost)
 * 3. For physical devices, auto-discovers the backend server
 * 4. Tests multiple common network configurations
 * 5. Falls back to safe defaults if needed
 */

const BACKEND_PORT = 3001;

// Check if we have a production API URL configured
const PRODUCTION_API_URL = Constants.expoConfig?.extra?.apiBaseUrl;

/**
 * Get the backend URL synchronously
 * Uses production URL if available, otherwise auto-detects
 */
function getBackendUrl(): string {
  // Use production URL if configured or defaulting to Render
  if (PRODUCTION_API_URL && PRODUCTION_API_URL !== 'https://YOUR_NGROK_BACKEND_URL_HERE') {
    return PRODUCTION_API_URL;
  }

  // Default to Render URL for APK builds if no other config found
  return 'https://node-server-gk1u.onrender.com';

  // Otherwise use auto-detection for development
  return getBackendUrlSync();
}

export const BACKEND_URL = getBackendUrl();
export const API_URL = `${BACKEND_URL}/api`;

// Log the configuration for debugging
console.log('🔧 Backend Configuration:');
console.log(`   Mode: ${PRODUCTION_API_URL && PRODUCTION_API_URL !== 'https://YOUR_NGROK_BACKEND_URL_HERE' ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Platform: ${Platform.OS}`);
console.log(`   Is Device: ${Constants.isDevice}`);
console.log(`   Backend URL: ${BACKEND_URL}`);
console.log(`   API URL: ${API_URL}`);

// Auto-detect best backend URL in background (only in development)
let detectedBackendUrl: string | null = null;
if (!PRODUCTION_API_URL || PRODUCTION_API_URL === 'https://YOUR_NGROK_BACKEND_URL_HERE') {
  findWorkingBackendUrl().then(url => {
    detectedBackendUrl = url;
    console.log('✅ Auto-detected backend URL:', url);
  }).catch(err => {
    console.warn('⚠️ Could not auto-detect backend:', err);
  });
}

/**
 * Get the auto-detected backend URL (async)
 * Use this for important operations to ensure connection
 */
export async function getOptimalBackendUrl(): Promise<string> {
  // In production, always use configured URL
  if (PRODUCTION_API_URL && PRODUCTION_API_URL !== 'https://YOUR_NGROK_BACKEND_URL_HERE') {
    return PRODUCTION_API_URL;
  }

  // In development, use detected URL if available
  if (detectedBackendUrl) {
    return detectedBackendUrl;
  }
  return await findWorkingBackendUrl();
}

export default {
  BACKEND_URL,
  API_URL,
  BACKEND_PORT,
  getOptimalBackendUrl,
};
