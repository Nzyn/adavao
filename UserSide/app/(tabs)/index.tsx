import { View, Text, StyleSheet, Pressable, Button, Animated, Platform, ScrollView, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import { router, Redirect } from 'expo-router';
import styles from "./styles";
import { Link } from 'expo-router';
import ConfirmDialog from '../../components/ConfirmDialog';
import NotificationPopup from '../../components/NotificationPopup';
import FlagNotificationToast from '../../components/FlagNotificationToast';
import FlagStatusBadge from '../../components/FlagStatusBadge';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../contexts/UserContext';
import { messageService } from '../../services/messageService';
import { inactivityManager } from '../../services/inactivityManager';
import { debugService } from '../../services/debugService';
import FadeInView from '../../components/FadeInView';

const App = () => {
  const { clearUser } = useUser();
  const [userFirstname, setUserFirstname] = useState('User');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [lastUnreadCount, setLastUnreadCount] = useState(0); // Track last known unread count
  const [badgeHidden, setBadgeHidden] = useState(false); // Track if badge should be hidden permanently
  const [unreadChatCount, setUnreadChatCount] = useState(0); // Track unread chat messages
  const [flagNotification, setFlagNotification] = useState<Notification | null>(null); // Track current flag notification
  const [flagStatus, setFlagStatus] = useState<{ totalFlags: number; restrictionLevel: string | null } | null>(null);
  const [flagToastShownThisSession, setFlagToastShownThisSession] = useState(false); // Only show flag toast once per login

  // Ref to track flagStatus for polling callback (avoids stale closure)
  const flagStatusRef = useRef(flagStatus);

  useEffect(() => {
    flagStatusRef.current = flagStatus;
  }, [flagStatus]);

  // State for press effects
  const [pressStates, setPressStates] = useState({
    history: false,
    chat: false,
    profile: false,
    guidelines: false,
    location: false,
    logout: false,
    report: false,
  });

  // Animation values for each card
  const historyScale = useRef(new Animated.Value(1)).current;
  const chatScale = useRef(new Animated.Value(1)).current;
  const profileScale = useRef(new Animated.Value(1)).current;
  const guidelinesScale = useRef(new Animated.Value(1)).current;
  const locationScale = useRef(new Animated.Value(1)).current;
  const logoutScale = useRef(new Animated.Value(1)).current;
  const reportScale = useRef(new Animated.Value(1)).current;

  // Load user data on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Checking auth status in index.tsx...');
        const userData = await AsyncStorage.getItem('userData');
        console.log('👤 User data in AsyncStorage:', userData ? 'FOUND' : 'NOT FOUND');

        if (userData) {
          const user = JSON.parse(userData);
          setUserFirstname(user.firstname || user.first_name || 'User');
          setIsLoggedIn(true);
          setUserId(user.id || user.user_id || '');
        } else {
          // No user data found, redirect to login
          console.warn('⚠️ No user data found in index.tsx. Redirecting to login.');
          router.replace('/(tabs)/login');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // In case of error, redirect to login
        router.replace('/(tabs)/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Define the flag check function so it can be reused
  const fetchFlagStatusFromBackend = async () => {
    if (!userId) return;

    try {
      console.log('🔄 Fetching flag status from backend for user:', userId);
      const result = await debugService.checkFlagStatus(userId);

      if (result.success) {
        const status = result.flagStatus;

        // Check for any flags that were auto-expired in this check
        if (status.expiredInThisCheck > 0) {
          console.log(`✨ ${status.expiredInThisCheck} flag(s) were auto-expired!`);
        }

        // Update local flag status based on backend response
        if (status.isFlagged && status.activeFlags > 0) {
          // SAFETY CHECK: Verify if the flags are actually expired (in case backend didn't auto-expire)
          const allFlagsExpired = result.details?.flags?.length > 0 && result.details.flags.every((f: any) =>
            f.status === 'confirmed' && f.expires_at && new Date(f.expires_at) <= new Date()
          );

          if (allFlagsExpired) {
            console.log('⚠️ Client-side override: All effective flags are expired. Clearing flag status.');
            setFlagStatus(null);
            setFlagNotification(null);
          } else {
            setFlagStatus({
              totalFlags: status.activeFlags,
              restrictionLevel: status.restrictionLevel || 'warning',
            });
          }
        } else {
          // User is not flagged (or flags have expired)
          setFlagStatus(null);
          setFlagNotification(null);
        }
      }
    } catch (error) {
      console.error('Error fetching flag status from backend:', error);
    }
  };

  // Reference to stop polling when component unmounts
  const pollingStopRef = useRef<(() => void) | null>(null);

  // Fetch flag status from backend on userId change AND on focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchFlagStatusFromBackend();
        loadNotifications(userId);
        loadUnreadChatCount(userId);

        // Start notification polling code
        pollingStopRef.current = notificationService.startNotificationPolling(
          userId,
          (newNotification) => {
            console.log('New notification received (polling):', newNotification);

            // Add the new notification to the list
            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNotification.id);
              if (!exists) {
                return [newNotification, ...prev];
              }
              return prev;
            });

            // Auto-show toast for flag notifications (only once per session)
            if (newNotification.type === 'user_flagged' && !flagToastShownThisSession) {
              setShowNotifications(true);
              setFlagNotification(newNotification);
              setFlagToastShownThisSession(true);
              // Update flag status
              if (newNotification.data) {
                setFlagStatus({
                  totalFlags: newNotification.data.total_flags || 1,
                  restrictionLevel: newNotification.data.restriction_applied || null,
                });
              }
            }
          },
          (hasFlagNotifications) => {
            // Handle flag status changes detected by polling
            if (!hasFlagNotifications && flagStatusRef.current) {
              console.log('🔄 [POLL] Reloading notifications for user:', userId);
              loadNotifications(userId);
              // Also re-check flag status specifically
              fetchFlagStatusFromBackend();
            }
          },
          3000
        );
      }
      return () => {
        if (pollingStopRef.current) {
          pollingStopRef.current();
          pollingStopRef.current = null;
        }
      };
    }, [userId])
  );

  // Use fetchFlagStatusFromBackend in useEffect as well for initial load
  useEffect(() => {
    if (userId) fetchFlagStatusFromBackend();
  }, [userId]);


  // Load notifications for the user
  const loadNotifications = async (userId: string) => {
    try {
      if (!userId) return;

      console.log('📬 Loading notifications for user:', userId);
      const userNotifications = await notificationService.getUserNotifications(userId);
      console.log('📬 Received notifications:', userNotifications);
      setNotifications(userNotifications);

      // Check if there's an unread flag notification (show once per session)
      const flagNotif = userNotifications.find(n => n.type === 'user_flagged' && !n.read);
      if (flagNotif && !flagToastShownThisSession) {
        console.log('📬 Found unread flag notification:', flagNotif);
        setFlagNotification(flagNotif);
        setFlagToastShownThisSession(true);
        if (flagNotif.data) {
          console.log('📬 Setting flag status:', flagNotif.data);
          setFlagStatus({
            totalFlags: flagNotif.data.total_flags || 1,
            restrictionLevel: flagNotif.data.restriction_applied || null,
          });
        }
      } else if (!flagNotif) {
        // No flag notification found - user might have been unflagged
        console.log('📬 No flag notification found - clearing flag status');
        // Only clear if backend check also confirms, but here we just infer
      }

      // Check if there are new unread notifications
      const currentUnreadCount = userNotifications.filter(n => !n.read).length;

      // Only show badge if there are truly NEW unread notifications (count increased)
      // Don't show badge again if user marked notifications as read (count decreased or stayed same)
      if (currentUnreadCount > lastUnreadCount && !badgeHidden) {
        // New notifications arrived, so we should show the badge
        setBadgeHidden(false);
        console.log('📬 Badge shown - new unread notifications detected');
      } else if (currentUnreadCount <= lastUnreadCount && badgeHidden === false) {
        // User marked notifications as read, don't reshow the badge
        console.log('📬 Notifications were marked as read, keeping badge hidden');
        setBadgeHidden(true);
      }

      // Update the last unread count
      setLastUnreadCount(currentUnreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Load unread chat count
  const loadUnreadChatCount = async (userId: string) => {
    try {
      if (!userId) return;

      console.log('Loading unread chat count for user:', userId);
      const response = await messageService.getUnreadCount(parseInt(userId));
      if (response.success) {
        console.log('Unread chat count:', response.count);
        setUnreadChatCount(response.count);
      }
    } catch (error) {
      console.error('Error loading unread chat count:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId, userId);

      // Update the local state to mark the notification as read
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle notification press - redirect to appropriate page
  const handleNotificationPress = async (notification: Notification) => {
    // Mark notification as read
    await markNotificationAsRead(notification.id);

    // Close the popup
    setShowNotifications(false);

    // Redirect based on notification type
    switch (notification.type) {
      case 'report':
        // Redirect to history page
        router.push('/history');
        break;
      case 'verification':
        // Redirect to profile page
        router.push('/profile');
        break;
      case 'message':
        // Redirect to chat page
        router.push('/chatlist');
        break;
      default:
        // Do nothing for unknown types
        break;
    }
  };

  // If still loading, show nothing
  if (isLoading) {
    return null;
  }

  // If not logged in, redirect to login
  if (!isLoggedIn) {
    return <Redirect href="/(tabs)/login" />;
  }

  // Animation functions
  const animatePressIn = (scaleValue: Animated.Value) => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const animatePressOut = (scaleValue: Animated.Value) => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePress = (name: string) => {
    //to be edited, this is where we put the backend for the logic of each pressable tiles
    console.log(name + " pressed!");
  };

  // Press handlers
  const handlePressIn = (component: string) => {
    setPressStates(prev => ({ ...prev, [component]: true }));
  };

  const handlePressOut = (component: string) => {
    setPressStates(prev => ({ ...prev, [component]: false }));
  };

  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle notification icon press
  const handleNotificationIconPress = () => {
    setShowNotifications(true);
    // Permanently hide the badge when notification icon is clicked
    setBadgeHidden(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Flag Toast Notification */}
      <FlagNotificationToast
        notification={flagNotification}
        onDismiss={() => setFlagNotification(null)}
        onMarkAsRead={markNotificationAsRead}
      />

      <ScrollView style={styles.container}>
        {/* Title */}
        <Text style={styles.textTitle}>
          <Text style={styles.alert}>Alert</Text>
          <Text style={styles.davao}>Davao</Text>
        </Text>

        {/* Subheading with Notification Icon and Flag Status */}
        <View style={styles.welcomeContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subheading}>Welcome, {userFirstname}!</Text>
            {flagStatus && (
              <View style={styles.flagStatusRow}>
                <Ionicons name="warning" size={16} color="#dc2626" />
                <Text style={styles.flagStatusText}>
                  {flagStatus.totalFlags} Flag{flagStatus.totalFlags !== 1 ? 's' : ''} Active
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.notificationIconContainer}
            onPress={handleNotificationIconPress}
          >
            <Ionicons
              name="notifications-outline"
              size={40} // Set to 40px as per project requirements
              color="#1D3557"
            />
            {unreadCount > 0 && !badgeHidden && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Report Now Button - Disabled if flagged */}
        {flagStatus ? (
          <Pressable
            style={[styles.reportButton, { backgroundColor: '#ccc', opacity: 0.6 }]}
            disabled={true}
          >
            <Text style={styles.reportButtonText}>
              Account Flagged - Cannot Report
            </Text>
          </Pressable>
        ) : (
          <Link href="/report" asChild>
            <Pressable
              style={pressStates.report ? styles.reportButtonPressed : styles.reportButton}
              onPressIn={() => handlePressIn('report')}
              onPressOut={() => handlePressOut('report')}
            >
              <Text style={styles.reportButtonText}>
                Submit a Report
              </Text>
            </Pressable>
          </Link>
        )}

        {/* Grid Container */}
        <View style={styles.grid}>
          {/* History */}
          {/* History */}
          <FadeInView delay={100} style={{ width: '48%', marginBottom: 15 }}>
            <Pressable
              style={({ pressed }) => [
                pressed ? styles.cardGridPressed : styles.cardGrid,
                { width: '100%', marginBottom: 0 }
              ]}
              onPress={() => router.push('/history')}
              onPressIn={() => handlePressIn('history')}
              onPressOut={() => handlePressOut('history')}
            >
              <View style={{ transform: [{ scale: pressStates.history ? 0.95 : 1 }], alignItems: 'center' }}>
                <Ionicons name="time-outline" size={40} color="#1D3557" />
                <Text style={styles.cardText}>History</Text>
              </View>
            </Pressable>
          </FadeInView>

          {/* Chat */}
          <FadeInView delay={200} style={{ width: '48%', marginBottom: 15 }}>
            <Pressable
              style={({ pressed }) => [
                pressed ? styles.cardGridPressed : styles.cardGrid,
                { width: '100%', marginBottom: 0 }
              ]}
              onPress={() => router.push('/chatlist')}
              onPressIn={() => handlePressIn('chat')}
              onPressOut={() => handlePressOut('chat')}
            >
              <View style={{ transform: [{ scale: pressStates.chat ? 0.95 : 1 }], alignItems: 'center' }}>
                <View style={{ position: 'relative' }}>
                  <Ionicons name="chatbox-outline" size={40} color="#1D3557" />
                  {unreadChatCount > 0 && (
                    <View style={styles.chatBadge}>
                      <Text style={styles.chatBadgeText}>
                        {unreadChatCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardText}>Chat</Text>
              </View>
            </Pressable>
          </FadeInView>

          {/* Profile */}
          <FadeInView delay={300} style={{ width: '48%', marginBottom: 15 }}>
            <Pressable
              style={({ pressed }) => [
                pressed ? styles.cardGridPressed : styles.cardGrid,
                { width: '100%', marginBottom: 0 }
              ]}
              onPress={() => router.push('/profile')}
              onPressIn={() => handlePressIn('profile')}
              onPressOut={() => handlePressOut('profile')}
            >
              <View style={{ transform: [{ scale: pressStates.profile ? 0.95 : 1 }], alignItems: 'center' }}>
                <Ionicons name="person-outline" size={40} color="#1D3557" />
                <Text style={styles.cardText}>Profile</Text>
              </View>
            </Pressable>
          </FadeInView>

          {/* Guidelines */}
          <FadeInView delay={400} style={{ width: '48%', marginBottom: 15 }}>
            <Pressable
              style={({ pressed }) => [
                pressed ? styles.cardGridPressed : styles.cardGrid,
                { width: '100%', marginBottom: 0 }
              ]}
              onPress={() => router.push('/guidelines')}
              onPressIn={() => handlePressIn('guidelines')}
              onPressOut={() => handlePressOut('guidelines')}
            >
              <View style={{ transform: [{ scale: pressStates.guidelines ? 0.95 : 1 }], alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons
                  name="information-circle-outline"
                  size={40}
                  color="#1D3557"
                />
                <Text style={styles.cardText}>Guidelines</Text>
              </View>
            </Pressable>
          </FadeInView>

          {/* Location */}
          <FadeInView delay={500} style={{ width: '48%', marginBottom: 15 }}>
            <Pressable
              style={({ pressed }) => [
                pressed ? styles.cardGridPressed : styles.cardGrid,
                { width: '100%', marginBottom: 0 }
              ]}
              onPress={() => router.push('/(tabs)/location')}
              onPressIn={() => handlePressIn('location')}
              onPressOut={() => handlePressOut('location')}
            >
              <View style={{ transform: [{ scale: pressStates.location ? 0.95 : 1 }], alignItems: 'center' }}>
                <Ionicons name="business-outline" size={40} color="#1D3557" />
                <Text style={styles.cardText}>Station</Text>
              </View>
            </Pressable>
          </FadeInView>

          {/* Logout */}
          <FadeInView delay={600} style={{ width: '48%', marginBottom: 15 }}>
            <Pressable
              style={({ pressed }) => [
                pressed ? styles.cardGridPressed : styles.cardGrid,
                { width: '100%', marginBottom: 0 }
              ]}
              onPress={() => setShowLogoutDialog(true)}
              onPressIn={() => handlePressIn('logout')}
              onPressOut={() => handlePressOut('logout')}
            >
              <View style={{ transform: [{ scale: pressStates.logout ? 0.95 : 1 }], alignItems: 'center' }}>
                <Ionicons name="log-out-outline" size={40} color="#1D3557" />
                <Text style={styles.cardText}>Logout</Text>
              </View>
            </Pressable>
          </FadeInView>
        </View>

        <ConfirmDialog
          visible={showLogoutDialog}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          cancelText="Cancel"
          confirmText="Logout"
          onCancel={() => {
            setShowLogoutDialog(false);
            // User stays on current page (index)
          }}
          onConfirm={async () => {
            setShowLogoutDialog(false);
            try {
              // Stop inactivity manager to prevent auto-logout interference
              inactivityManager.stop();
              console.log('✅ Inactivity manager stopped');

              // Check if remember me was saved
              const savedEmail = await AsyncStorage.getItem('rememberedEmail');

              // Clear all user data from AsyncStorage
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('userToken');
              console.log('✅ User logged out - AsyncStorage cleared');

              // If no remember me, clear the saved email too
              if (!savedEmail) {
                await AsyncStorage.removeItem('rememberedEmail');
              }

              // Clear user context
              clearUser();
              console.log('✅ User context cleared');

              // Reset local state
              setIsLoggedIn(false);
              setUserId('');
              setFlagStatus(null);
              setFlagNotification(null);
              setNotifications([]);

              // Redirect to login screen
              console.log('🔄 Redirecting to login...');
              router.replace('/(tabs)/login');
            } catch (error) {
              console.error('❌ Error logging out:', error);
              // Fallback: still redirect to login
              router.replace('/(tabs)/login');
            }
          }}
        />
      </ScrollView>

      {/* Flag Notification Toast */}
      <FlagNotificationToast
        notification={flagNotification}
        onDismiss={() => setFlagNotification(null)}
      />

      {/* Notification Popup */}
      <NotificationPopup
        visible={showNotifications}
        notifications={notifications}
        onClose={() => {
          setShowNotifications(false);
          // Refresh notifications to update the count
          if (userId) {
            loadNotifications(userId);
          }
        }}
        onNotificationPress={handleNotificationPress}
        onMarkAsRead={markNotificationAsRead}
      />
    </View>
  );
};

export default App;