// Direct database connection service for alertdavao database
import { API_URL } from '../config/backend';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string; // Maps to 'address' column in database
  latitude?: number;  // User current or registered latitude
  longitude?: number; // User current or registered longitude
  stationId?: string; // Only for police users (references police_stations.station_id)
  isVerified: boolean;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

// MySQL connection configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234', // Add your MySQL password
  database: 'alertdavao',
  table: 'users'
};

class DirectDbService {
  
  // Since we're in a React Native environment, we'll use a Node.js server approach
  // This creates a simple API server that connects directly to MySQL
  
  private apiUrl = API_URL; // Uses configuration from backend.ts (auto-detects localhost vs device IP)
  
  // Test MySQL connection
  async testMysqlConnection(): Promise<boolean> {
    try {
      console.log('Testing MySQL connection to alertdavao database...');
      
      const response = await fetch(`${this.apiUrl}/test-connection`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('MySQL connection successful:', result);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('MySQL connection test failed:', error);
      return false;
    }
  }
  
  // Insert or update user in alertdavao.users table
  async insertOrUpdateUser(userData: UserData): Promise<void> {
    try {
      console.log('Saving user to alertdavao.users table:', userData);
      console.log('📍 Address being sent to backend:', userData.address);
      
      // Map frontend address field to database address column
      const dbPayload = {
        id: userData.id,
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        contact: userData.phone,
        address: userData.address, // This maps to the 'address' column in users table
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        station_id: userData.stationId || null,
        is_verified: userData.isVerified ? 1 : 0
      };
      
      console.log('📦 Payload being sent:', JSON.stringify(dbPayload, null, 2));
      
      const response = await fetch(`${this.apiUrl}/users/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbPayload)
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Database save error response:', errorText);
        throw new Error(`Failed to save to alertdavao database: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ User saved to alertdavao.users successfully:', result);
      console.log(`✅ Address "${userData.address}" saved to 'address' column in users table`);
      
      // Validate the response
      if (!result.success) {
        console.error('❌ Backend reported save failure:', result);
        throw new Error(result.message || 'Backend reported save failure');
      }
      
    } catch (error) {
      console.error('Error saving to alertdavao database:', error);
      throw error;
    }
  }
  
  // Get user from alertdavao.users table
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      console.log('Fetching user from alertdavao.users table:', userId);
      
      const response = await fetch(`${this.apiUrl}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('User not found in alertdavao database');
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('User fetched from alertdavao.users:', result);
      
      // Map database columns to frontend data
      if (result.data) {
        const user: UserData = {
          id: result.data.id.toString(),
          firstName: result.data.firstname,
          lastName: result.data.lastname,
          email: result.data.email,
          phone: result.data.contact || '',
          address: result.data.address || '', // Read from address column in users table
          latitude: result.data.latitude,
          longitude: result.data.longitude,
          stationId: result.data.station_id?.toString(),
          isVerified: Boolean(result.data.is_verified),
          profileImage: result.data.profile_image,
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at,
        };
        
        console.log(`Address "${user.address}" loaded from 'address' column`);
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user from alertdavao database:', error);
      throw error;
    }
  }
  
  // Update only address field in alertdavao.users table
  async updateUserAddress(userId: string, address: string): Promise<void> {
    try {
      console.log(`Updating address for user ${userId} in alertdavao.users:`, address);
      
      const response = await fetch(`${this.apiUrl}/users/${userId}/address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update address: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Address updated in alertdavao.users successfully:', result);
      console.log(`Address "${address}" saved to 'address' column in users table`);
      
    } catch (error) {
      console.error('Error updating address in alertdavao database:', error);
      throw error;
    }
  }
  
  // Execute raw SQL query on alertdavao database
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      console.log('Executing query on alertdavao database:', query, params);
      
      const response = await fetch(`${this.apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params })
      });
      
      if (!response.ok) {
        throw new Error(`Query execution failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Query executed successfully:', result);
      return result;
      
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
  
  // Verify address was saved to database
  async verifyAddressSave(userId: string, expectedAddress: string): Promise<boolean> {
    try {
      const query = 'SELECT address FROM users WHERE id = ?';
      const result = await this.executeQuery(query, [userId]);
      
      if (result.data && result.data.length > 0) {
        const actualAddress = result.data[0].address;
        const verified = actualAddress === expectedAddress;
        
        console.log(`Address verification for user ${userId}:`);
        console.log(`Expected: "${expectedAddress}"`);
        console.log(`Actual: "${actualAddress}"`);
        console.log(`Verified: ${verified}`);
        
        return verified;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying address save:', error);
      return false;
    }
  }
}

// Export singleton instance
export const directDbService = new DirectDbService();