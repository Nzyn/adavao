import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Notification } from '../services/notificationService';

interface FlagNotificationToastProps {
  notification: Notification | null;
  onDismiss?: () => void;
  onMarkAsRead?: (notificationId: number | string) => void;
}

const FlagNotificationToast: React.FC<FlagNotificationToastProps> = ({
  notification,
  onDismiss,
  onMarkAsRead
}) => {
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification && (notification.type === 'user_flagged' || notification.type === 'user_unflagged')) {
      setVisible(true);

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        animateOut();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setVisible(false);
      // Mark as read when dismissed
      if (notification && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
      onDismiss?.();
    });
  };

  if (!visible || !notification) {
    return null;
  }

  const restrictionText = notification.data?.restriction_applied
    ? `Restriction Applied: ${notification.data.restriction_applied.toUpperCase()}`
    : null;

  const isUnflagged = notification.type === 'user_unflagged';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <View style={[styles.content, isUnflagged && { backgroundColor: '#10b981' }]}>
        <View style={styles.iconContainer}>
          <Ionicons name={isUnflagged ? "checkmark-circle" : "warning"} size={24} color="#fff" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          {restrictionText && (
            <Text style={styles.restrictionText} numberOfLines={1}>
              ⚠️ {restrictionText}
            </Text>
          )}
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={animateOut}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1001,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  content: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  message: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  restrictionText: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '600',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    flexShrink: 0,
  },
});

export default FlagNotificationToast;
