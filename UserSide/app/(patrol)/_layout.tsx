import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert, Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function PatrolLayout() {
    const router = useRouter();
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        // Set up listener for when notification is received while app is open
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('🔔 Push notification received:', notification);
            
            const data = notification.request.content.data;
            
            // Handle urgent dispatch notifications with vibration
            if (data?.type === 'urgent_dispatch' || data?.vibrate) {
                console.log('🚨 URGENT DISPATCH received!');
                
                // Vibrate pattern for urgent dispatch
                const pattern = [0, 500, 200, 500, 200, 500];
                if (Platform.OS === 'android') {
                    Vibration.vibrate(pattern, false);
                } else {
                    Vibration.vibrate();
                }
                
                // Show alert for urgent dispatch
                Alert.alert(
                    '🚨 New Dispatch!',
                    notification.request.content.body || 'A new dispatch is available for response',
                    [
                        {
                            text: 'View Dispatch',
                            onPress: () => {
                                if (data?.dispatch_id) {
                                    router.push(`/(patrol)/dispatch-details?id=${data.dispatch_id}`);
                                } else {
                                    router.push('/(patrol)/dispatches');
                                }
                            },
                        },
                        { text: 'Later', style: 'cancel' },
                    ],
                    { cancelable: true }
                );
            }
        });

        // Set up listener for when user taps on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('👆 Push notification tapped:', response);
            
            const data = response.notification.request.content.data;
            
            if (data?.type === 'dispatch' || data?.type === 'urgent_dispatch') {
                if (data?.dispatch_id) {
                    router.push(`/(patrol)/dispatch-details?id=${data.dispatch_id}`);
                } else {
                    router.push('/(patrol)/dispatches');
                }
            }
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="dispatches" />
            <Stack.Screen name="dispatch-details" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="history" />
            <Stack.Screen name="profile" />
        </Stack>
    );
}
