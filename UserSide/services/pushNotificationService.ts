import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Vibration } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '../config/backend';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const data = notification.request.content.data;
        
        // Check if this is an urgent dispatch notification
        const isUrgent = data?.type === 'urgent_dispatch' || data?.ring || data?.vibrate;
        
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: isUrgent ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
        };
    },
});

/**
 * Vibrate device for urgent dispatch - long pattern for urgency
 */
function vibrateUrgent() {
    // Vibrate pattern: [wait, vibrate, wait, vibrate, ...]
    // Pattern: vibrate 500ms, pause 200ms, vibrate 500ms, pause 200ms, vibrate 500ms
    const pattern = [0, 500, 200, 500, 200, 500, 200, 500, 200, 500];
    
    if (Platform.OS === 'android') {
        Vibration.vibrate(pattern, false); // false = don't repeat
    } else {
        // iOS has limited vibration support, do multiple short vibrations
        Vibration.vibrate();
        setTimeout(() => Vibration.vibrate(), 500);
        setTimeout(() => Vibration.vibrate(), 1000);
        setTimeout(() => Vibration.vibrate(), 1500);
        setTimeout(() => Vibration.vibrate(), 2000);
    }
}

/**
 * Register for push notifications and get Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
        // Regular dispatch channel
        await Notifications.setNotificationChannelAsync('dispatch', {
            name: 'Patrol Dispatches',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3b82f6',
            sound: 'default',
        });
        
        // Urgent dispatch channel with maximum priority
        await Notifications.setNotificationChannelAsync('urgent_dispatch', {
            name: 'Urgent Dispatches',
            description: 'High-priority dispatch alerts that require immediate attention',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500, 200, 500],
            lightColor: '#dc2626',
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            bypassDnd: true, // Bypass Do Not Disturb
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('❌ Failed to get push token - permission denied');
            return null;
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            if (!projectId) {
                console.warn('⚠️ No EAS project ID found, using fallback');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId || 'alertdavao',
            })).data;

            console.log('✅ Push token obtained:', token);
        } catch (error) {
            console.error('❌ Error getting push token:', error);
        }
    } else {
        console.log('⚠️ Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Send push token to backend
 */
export async function savePushTokenToBackend(
    token: string,
    userId: number
): Promise<boolean> {
    try {
        console.log('📤 Saving push token to backend...', { userId, token: token.substring(0, 20) + '...' });

        const response = await fetch(`${API_URL}/user/push-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                push_token: token,
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Push token saved successfully');
            return true;
        } else {
            console.error('❌ Failed to save push token:', data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error saving push token:', error);
        return false;
    }
}

/**
 * Setup notification listeners for dispatch notifications
 */
export function setupDispatchNotificationListeners(
    onDispatchReceived?: (dispatch: any) => void,
    onDispatchTapped?: (dispatch: any) => void
) {
    // Listener for when notification is received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Dispatch notification received:', notification);

        const data = notification.request.content.data;
        
        // Handle urgent dispatch notifications with vibration
        if (data?.type === 'urgent_dispatch' || data?.vibrate) {
            console.log('🚨 URGENT DISPATCH - Activating vibration alert!');
            vibrateUrgent();
        }
        
        if ((data?.type === 'dispatch' || data?.type === 'urgent_dispatch') && onDispatchReceived) {
            onDispatchReceived(data);
        }
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Dispatch notification tapped:', response);

        const data = response.notification.request.content.data;
        if ((data?.type === 'dispatch' || data?.type === 'urgent_dispatch') && onDispatchTapped) {
            onDispatchTapped(data);
        }
    });

    return {
        notificationListener,
        responseListener,
    };
}

/**
 * Remove notification listeners
 */
export function removeDispatchNotificationListeners(listeners: {
    notificationListener: Notifications.Subscription;
    responseListener: Notifications.Subscription;
}) {
    listeners.notificationListener.remove();
    listeners.responseListener.remove();
}

/**
 * Schedule a local dispatch notification (for testing)
 */
export async function scheduleLocalDispatchNotification(
    reportId: number,
    crimeType: string,
    location: string
): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
        content: {
            title: '🚓 New Dispatch',
            body: `${crimeType} at ${location}`,
            data: {
                type: 'dispatch',
                report_id: reportId,
                crime_type: crimeType,
                location,
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
    });
}

/**
 * Clear all dispatch notifications
 */
export async function clearDispatchNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getDispatchBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setDispatchBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Initialize push notifications for patrol officers
 */
export async function initializePushNotifications(userId: number): Promise<boolean> {
    try {
        console.log('🚀 Initializing push notifications for user:', userId);

        const token = await registerForPushNotificationsAsync();

        if (!token) {
            console.warn('⚠️ Could not get push token');
            return false;
        }

        const saved = await savePushTokenToBackend(token, userId);

        if (saved) {
            console.log('✅ Push notifications initialized successfully');
            return true;
        } else {
            console.warn('⚠️ Push token obtained but not saved to backend');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing push notifications:', error);
        return false;
    }
}
