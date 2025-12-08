// API Configuration
export const API_CONFIG = {
  // Change this to your Laravel backend URL
  BASE_URL: 'http://127.0.0.1:8000/api',
  
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