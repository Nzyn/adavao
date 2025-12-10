import { getBackendUrlSync } from '../utils/networkUtils';

// PRODUCTION CONFIG (Render)
export const API_CONFIG = {
  BASE_URL: 'https://aldavao.onrender.com/api',

  // DYNAMIC CONFIG (Local Development - Commented out for APK Build)
  // const nodeBackendUrl = getBackendUrlSync();
  // const laravelBaseUrl = nodeBackendUrl.replace(':3000', ':8000');
  // BASE_URL: `${laravelBaseUrl}/api`,

  // Endpoints
  ENDPOINTS: {
    USERS: '/users',
    PROFILE: '/profile',
    LOGIN: '/login',
    REGISTER: '/register',
    REPORTS: '/reports',
  },

  // Request timeout in milliseconds
  TIMEOUT: 10000,

  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Bypass ngrok browser warning for API calls
    'ngrok-skip-browser-warning': 'true',
  },
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string, id?: string) => {
  const baseUrl = API_CONFIG.BASE_URL + endpoint;
  return id ? `${baseUrl}/${id}` : baseUrl;
};