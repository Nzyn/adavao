import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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
      // Clear user data
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      
      // Set flag to show logout notification
      await AsyncStorage.setItem('inactivityLogout', 'true');
      
      // Stop the inactivity manager
      this.stop();
      
      // Redirect to login
      router.replace('/(tabs)/login');
    } catch (error) {
      console.error('Error during auto-logout:', error);
    }
  }
}

export const inactivityManager = new InactivityManager();
