import { getBackendUrlSync } from '../utils/networkUtils';

// Get dynamically detected backend URL (defaults to port 3000)
const nodeBackendUrl = getBackendUrlSync();
// Replace port 3000 with 8000 for Laravel API
const laravelBaseUrl = nodeBackendUrl.replace(':3000', ':8000');

export const API_CONFIG = {
  // Dynamic Laravel backend URL
  BASE_URL: `${laravelBaseUrl}/api`,

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