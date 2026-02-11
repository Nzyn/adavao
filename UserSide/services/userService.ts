// API service for user-related operations
import { API_CONFIG, buildApiUrl } from '../config/api';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export const userService = {
  // Update user profile
  async updateProfile(userId: string, profileData: UpdateProfileData) {
    try {
      console.log('Updating profile for user:', userId);
      console.log('Profile data:', profileData);
      console.log('API URL:', buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId));
      
      const requestBody = {
        firstname: profileData.firstName,
        lastname: profileData.lastName,
        email: profileData.email,
        contact: profileData.phone,
        address: profileData.address,
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId), {
        method: 'PUT',
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          // Add authentication token here when available
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        // Try to parse error as JSON for better error messages
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        } catch {
          throw new Error(`Failed to update profile: HTTP ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Profile updated successfully:', data);
      
      // Return the data in a format expected by the frontend
      if (data.success && data.data) {
        return {
          id: data.data.id,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          phone: data.data.phone,
          address: data.data.address,
          isVerified: data.data.is_verified,
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  },

  // Get user profile
  async getProfile(userId: string) {
    try {
      console.log('Fetching profile for user:', userId);
      console.log('API URL:', buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId));
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId), {
        method: 'GET',
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          // Add authentication token here when available
          // 'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Get profile response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        } catch {
          throw new Error(`Failed to fetch profile: HTTP ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Profile fetched successfully:', data);
      
      // Return the data in the expected format for UserContext
      if (data.success && data.data) {
        return {
          id: data.data.id,
          firstname: data.data.firstName,
          lastname: data.data.lastName,
          email: data.data.email,
          contact: data.data.phone,
          address: data.data.address,
          is_verified: data.data.is_verified,
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  },

  // Get user details with station information
  async getUserWithStation(userId: string) {
    try {
      console.log('Fetching user with station details for user:', userId);
      console.log('API URL:', buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId));
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS, userId), {
        method: 'GET',
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user details: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('User with station response:', data);
      
      if (data.success && data.data) {
        // Prepare the response object with proper fallbacks
        const userData = data.data;
        const stationData = userData.station;

        return {
          id: userData.id,
          firstname: userData.firstName || userData.firstname || 'N/A',
          lastname: userData.lastName || userData.lastname || 'N/A',
          contact: userData.phone || userData.contact || 'N/A',
          stationId: userData.station_id || null,
          stationName: stationData?.station_name || 'Not Assigned',
          stationAddress: stationData?.address || 'No address available',
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user with station:', error);
      throw error;
    }
  },
};