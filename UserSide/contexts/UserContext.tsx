import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { directDbService } from '../services/directDbService';
import { dbTest } from '../utils/dbTest';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  latitude?: number;  // User current or registered latitude
  longitude?: number; // User current or registered longitude
  stationId?: string; // Only for police users
  isVerified: boolean;
  profileImage?: string;
  dataSource?: 'database' | 'default';
  createdAt?: string;
  updatedAt?: string;
}

interface UserContextType {
  user: UserData | null;
  updateUser: (userData: Partial<UserData>) => Promise<void>;
  setUser: (userData: UserData) => void;
  clearUser: () => void;
  refreshProfile: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const defaultUser: UserData = {
    id: '1',
    firstName: 'Nicole Santander',
    lastName: 'Quimbo',
    email: 'inicquimbo@gmail.com',
    phone: '+639908666666',
    address: 'Gladiola Street, Buhangin Proper, Davao City, 8000, Philippines',
    isVerified: true,
    profileImage: 'https://i.pinimg.com/736x/3c/ae/07/3cae079ca0b9e55ec6bfc1b358c9b1e2.jpg',
    dataSource: 'default'
  };
  
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load user data from AsyncStorage and alertdavao database on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Get logged-in user from AsyncStorage
        console.log('🔑 Loading logged-in user from AsyncStorage...');
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (!storedUserData) {
          console.warn('⚠️ No user logged in - redirecting to login would be appropriate');
          setUserState(defaultUser);
          setCurrentUserId(null);
          setIsLoading(false);
          return;
        }
        
        const loggedInUser = JSON.parse(storedUserData);
        const loggedInUserId = loggedInUser.id?.toString() || '0';
        console.log('✅ Found logged-in user in AsyncStorage:', loggedInUser);
        console.log('🆔 User ID from AsyncStorage:', loggedInUserId);
        
        // Check if the user ID has changed (different user logged in)
        if (currentUserId && currentUserId !== loggedInUserId) {
          console.log('🔄 Different user detected! Switching from ID', currentUserId, 'to', loggedInUserId);
        }
        
        // Update current user ID
        setCurrentUserId(loggedInUserId);
        
        // 2. Test MySQL connection
        const connectionOk = await directDbService.testMysqlConnection();
        if (!connectionOk) {
          console.warn('⚠️ Cannot connect to alertdavao database, using AsyncStorage data only');
          // Use the data from AsyncStorage as fallback
          const fallbackUser: UserData = {
            id: loggedInUser.id?.toString() || '0',
            firstName: loggedInUser.firstname || loggedInUser.firstName || '',
            lastName: loggedInUser.lastname || loggedInUser.lastName || '',
            email: loggedInUser.email || '',
            phone: loggedInUser.contact || loggedInUser.phone || '',
            address: loggedInUser.address || '',
            isVerified: Boolean(loggedInUser.is_verified || loggedInUser.isVerified),
            profileImage: loggedInUser.profile_image || loggedInUser.profileImage,
            dataSource: 'default'
          };
          setUserState(fallbackUser);
          setIsLoading(false);
          return;
        }
        
        // 3. Load full user profile from alertdavao.users table using logged-in user's ID
        const userId = loggedInUser.id?.toString() || '0';
        console.log(`💾 Fetching full profile for user ID ${userId} from database...`);
        const savedUser = await directDbService.getUserById(userId);
        
        if (savedUser) {
          const userWithSource = { ...savedUser, dataSource: 'database' as const };
          setUserState(userWithSource);
          console.log('✅ Loaded user profile from alertdavao database:', userWithSource);
          console.log('🗄️  Data source: DATABASE');
          console.log(`👤 User: ${userWithSource.firstName} ${userWithSource.lastName}`);
          console.log(`📧 Email: ${userWithSource.email}`);
        } else {
          // User exists in auth but not in users table - create initial profile
          console.log('🆕 User not found in database, creating initial profile...');
          const initialUser: UserData = {
            id: userId,
            firstName: loggedInUser.firstname || loggedInUser.firstName || '',
            lastName: loggedInUser.lastname || loggedInUser.lastName || '',
            email: loggedInUser.email || '',
            phone: loggedInUser.contact || loggedInUser.phone || '',
            address: loggedInUser.address || '',
            isVerified: Boolean(loggedInUser.is_verified || loggedInUser.isVerified),
            profileImage: loggedInUser.profile_image || loggedInUser.profileImage,
            dataSource: 'default'
          };
          
          await directDbService.insertOrUpdateUser(initialUser);
          setUserState({ ...initialUser, dataSource: 'database' });
          console.log('✅ Created initial user profile in database:', initialUser);
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        // Fallback to default user if loading fails
        setUserState(defaultUser);
      } finally {
        setIsLoading(false);
      }
    };

    // Run database connectivity test in background (non-blocking)
    dbTest.runFullTest().catch(() => {/* ignore in UI */});

    loadUserData();
    
    // Set up interval to check for user changes (e.g., when a different user logs in)
    const intervalId = setInterval(async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const loggedInUser = JSON.parse(storedUserData);
          const loggedInUserId = loggedInUser.id?.toString() || '0';
          
          // If the user ID in AsyncStorage differs from current user, reload
          if (currentUserId && loggedInUserId !== currentUserId) {
            console.log('⚠️ User change detected in AsyncStorage! Reloading profile...');
            console.log(`   Old user ID: ${currentUserId}`);
            console.log(`   New user ID: ${loggedInUserId}`);
            loadUserData();
          }
        } else if (currentUserId) {
          // User was logged in but now logged out
          console.log('⚠️ User logged out detected!');
          setUserState(null);
          setCurrentUserId(null);
        }
      } catch (error) {
        console.error('Error checking for user changes:', error);
      }
    }, 1000); // Check every second
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [currentUserId]);

  const updateUser = async (userData: Partial<UserData>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      const updatedUser = { ...user, ...userData, dataSource: 'database' as const };

      console.log('💾 Saving user profile to alertdavao database...');
      console.log(`📍 Address to save: "${updatedUser.address}"`);
      console.log('Full updated user data:', updatedUser);

      // Validate required fields before saving
      if (!updatedUser.id) {
        throw new Error('User ID is required');
      }

      // 1) Upsert full profile (includes address)
      await directDbService.insertOrUpdateUser(updatedUser);
      console.log('✅ Database upsert completed');

      // 2) Verify address actually persisted; if not, force-update address column
      const addressVerified = await directDbService.verifyAddressSave(updatedUser.id, updatedUser.address || '');
      if (!addressVerified) {
        console.warn('⚠️ Address not persisted after upsert. Forcing address update...');
        await directDbService.updateUserAddress(updatedUser.id, updatedUser.address || '');
      }

      // 3) Reload fresh copy from DB and update state
      const fresh = await directDbService.getUserById(updatedUser.id);
      if (fresh) {
        setUserState({ ...fresh, dataSource: 'database' as const });
        console.log('🔄 Local state refreshed from DB. Address =', fresh.address);
      } else {
        setUserState(updatedUser);
        console.log('⚠️ Could not reload from DB, kept local merged state');
      }

      console.log('🎉 User profile updated and verified in database');
    } catch (error) {
      console.error('❌ Error updating user profile in alertdavao database:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      // Don't update local state if database update fails
      throw error; // Re-throw so the UI can show an error
    }
  };

  const setUser = (userData: UserData) => {
    setUserState(userData);
  };

  const clearUser = () => {
    console.log('🧹 Clearing user context...');
    setUserState(null);
    setCurrentUserId(null);
    setIsLoading(false); // Reset loading state to prevent stuck buttons
    console.log('✅ User context cleared and loading state reset');
  };

  const refreshProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      // Refresh data from alertdavao.users table
      const freshData = await directDbService.getUserById(userId);
      
      if (freshData) {
        const userWithSource = { ...freshData, dataSource: 'database' as const };
        setUserState(userWithSource);
        console.log('🔄 Profile refreshed from alertdavao database:', userWithSource);
        console.log('🗄️  Data source: DATABASE (refreshed)');
        console.log(`📍 Address loaded from database: "${userWithSource.address}"`);
      }
    } catch (error) {
      console.error('Error refreshing profile from alertdavao database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    updateUser,
    setUser,
    clearUser,
    refreshProfile,
    isLoading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};