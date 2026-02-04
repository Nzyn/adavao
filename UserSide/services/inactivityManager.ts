import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BACKEND_URL } from '../config/backend';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

class InactivityManager {
  private lastActivity: number = Date.now();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;
  private isActive: boolean = false;

  start() {
    if (this.isActive) {
      console.log('InactivityManager already running');
      return;
    }

    this.isActive = true;
    this.lastActivity = Date.now();

    console.log('Starting InactivityManager - timeout set to 5 minutes');

    // Check for inactivity every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, 30000);

    // Listen to app state changes (foreground/background)
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Track user interactions
    this.setupActivityListeners();
  }

  stop() {
    console.log('Stopping InactivityManager');
    this.isActive = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  resetActivity() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;

    // Log only if it's been more than 10 seconds since last activity
    if (timeSinceLastActivity > 10000) {
      console.log(`User activity detected after ${Math.floor(timeSinceLastActivity / 1000)}s of inactivity`);
    }

    this.lastActivity = now;
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, reset activity
      this.resetActivity();
    }
  };

  private setupActivityListeners() {
    // Reset activity on any touch/interaction
    // This is handled at the app level through touches
  }

  private async checkInactivity() {
    if (!this.isActive) {
      return;
    }

    // First check if user is actually logged in before doing anything
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        // User is not logged in, don't do inactivity checks
        console.log('Inactivity check skipped - user not logged in');
        return;
      }
    } catch (e) {
      // If we can't check, skip this cycle
      return;
    }

    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const minutesInactive = Math.floor(inactiveTime / 60000);
    const secondsInactive = Math.floor((inactiveTime % 60000) / 1000);

    console.log(`Inactivity check: ${minutesInactive}m ${secondsInactive}s inactive`);

    if (inactiveTime >= INACTIVITY_TIMEOUT) {
      console.log('User inactive for 5 minutes - logging out');
      await this.performLogout();
    }
  }

  private async performLogout() {
    try {
      // Import Alert dynamically
      const { Alert } = await import('react-native');

      // Get user data before clearing
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = userData ? JSON.parse(userData) : null;

      // Call backend to clear server-side session (non-blocking)
      if (parsedUser?.id || parsedUser?.email) {
        fetch(`${BACKEND_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            userId: parsedUser?.id,
            email: parsedUser?.email
          })
        }).catch(err => console.warn('Server logout failed:', err));
      }

      // Clear user data
      await AsyncStorage.multiRemove([
        'userData',
        'userToken',
        'pushToken',
        'lastNotificationCheck',
        'cachedNotifications'
      ]);

      // Set flag to show logout notification (backup for app reopen)
      await AsyncStorage.setItem('inactivityLogout', 'true');

      // Stop the inactivity manager
      this.stop();

      // Show alert immediately
      Alert.alert(
        'Session Expired',
        'You have been logged out due to inactivity (5 minutes). Please log in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Redirect to login after user acknowledges
              router.replace('/(tabs)/login');
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error during auto-logout:', error);
      // Fallback: redirect to login even if alert fails
      router.replace('/(tabs)/login');
    }
  }
}

export const inactivityManager = new InactivityManager();
