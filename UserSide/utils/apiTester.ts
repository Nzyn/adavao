// API Testing Utilities

import { API_CONFIG, buildApiUrl } from '../config/api';

export const apiTester = {
  // Test basic connectivity to the server
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', API_CONFIG.BASE_URL);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        headers: API_CONFIG.DEFAULT_HEADERS,
      });
      
      console.log('Connection test response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  // Test if user endpoint is accessible
  async testUserEndpoint(userId: string): Promise<boolean> {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId);
      console.log('Testing user endpoint:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.DEFAULT_HEADERS,
      });
      
      console.log('User endpoint test response:', response.status);
      return response.status !== 404;
    } catch (error) {
      console.error('User endpoint test failed:', error);
      return false;
    }
  },

  // Log current API configuration
  logConfig() {
    console.log('=== API Configuration ===');
    console.log('Base URL:', API_CONFIG.BASE_URL);
    console.log('Endpoints:', API_CONFIG.ENDPOINTS);
    console.log('Headers:', API_CONFIG.DEFAULT_HEADERS);
    console.log('========================');
  },
};