import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from '../app/(tabs)/styles';
import type { Notification } from '../services/notificationService';

interface NotificationPopupProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onNotificationPress: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: number | string) => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  visible, 
  notifications, 
  onClose,
  onNotificationPress,
  onMarkAsRead
}) => {
  if (!visible) {
    return null;
  }

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_flagged':
        return 'flag';
      case 'report':
        return 'document-text';
      case 'message':
        return 'chatbubble';
      case 'verification':
        return 'checkmark-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_flagged':
        return '#dc2626'; // Red for flag
      case 'report':
        return '#2563eb'; // Blue for report
      case 'message':
        return '#7c3aed'; // Purple for message
      case 'verification':
        return '#059669'; // Green for verification
      default:
        return '#6b7280'; // Gray for default
    }
  };

  return (
    <View style={styles.notificationContainer}>
      <View style={styles.notificationPopup}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>Notifications</Text>
          <Pressable 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#1D3557" />
          </Pressable>
        </View>
        
        {sortedNotifications.length === 0 ? (
          <Text style={styles.noNotificationsText}>No notifications</Text>
        ) : (
          <ScrollView style={styles.notificationList}>
            {sortedNotifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={({ pressed }) => [
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                  notification.type === 'user_flagged' && !notification.read && { backgroundColor: '#fee2e2' }, // Light red for flagged
                  pressed && !notification.read && { backgroundColor: '#e3f2fd' }, // Light blue when pressed (unread only)
                  pressed && notification.read && { backgroundColor: '#e8e8e8' }, // Light gray when pressed (read only)
                ]}
                onPress={() => onNotificationPress(notification)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: getNotificationColor(notification.type) + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 4
                  }}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={20} 
                      color={getNotificationColor(notification.type)} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.notificationItemTitle,
                      notification.type === 'user_flagged' && { color: '#dc2626', fontWeight: '600' },
                      notification.read && { color: '#888888' } // Gray text for read notifications
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={[
                      styles.notificationItemMessage,
                      notification.type === 'user_flagged' && { color: '#991b1b' },
                      notification.read && { color: '#999999' } // Gray text for read notifications
                    ]}>
                      {notification.message}
                    </Text>
                    {notification.data?.restriction_applied && (
                      <Text style={[
                        { fontSize: 12, marginTop: 4, color: '#b91c1c', fontWeight: '500' },
                        notification.read && { color: '#aaaaaa' }
                      ]}>
                        Restriction: {notification.data.restriction_applied}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                      <Text style={[
                        styles.notificationItemTime,
                        notification.read && { color: '#aaaaaa' } // Light gray text for read notifications
                      ]}>
                        {new Date(notification.timestamp).toLocaleDateString('en-PH', {
                          timeZone: 'Asia/Manila'
                        })} at {new Date(notification.timestamp).toLocaleTimeString('en-PH', {
                          timeZone: 'Asia/Manila',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      {!notification.read && (
                        <Pressable
                          onPress={() => onMarkAsRead?.(notification.id)}
                          style={({ pressed }) => [
                            { 
                              paddingHorizontal: 12, 
                              paddingVertical: 6, 
                              borderRadius: 6,
                              backgroundColor: notification.type === 'user_flagged' ? '#dc2626' : '#2563eb',
                              opacity: pressed ? 0.8 : 1
                            }
                          ]}
                        >
                          <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>Mark as Read</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default NotificationPopup;