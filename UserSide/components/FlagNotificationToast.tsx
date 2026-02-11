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
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // Format milliseconds to HH:MM:SS
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return days > 0 ? `${days}d ${timeStr}` : timeStr;
  };

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

      let interval: NodeJS.Timeout;

      // Setup countdown if expires_at is present
      if (notification.type === 'user_flagged' && notification.data?.expires_at) {
        const updateTimer = () => {
          const now = new Date().getTime();
          const expireTime = new Date(notification.data!.expires_at!).getTime(); // Check notificationService for expires_at support
          const diff = expireTime - now;
          if (diff > 0) {
            setTimeRemaining(formatTimeRemaining(diff));
          } else {
            setTimeRemaining('Expired');
            // Optionally auto-dismiss or change state when expired
          }
        };

        updateTimer();
        interval = setInterval(updateTimer, 1000);
      }

      // Auto dismiss after 8 seconds (only if NOT a permanent flag or if unflagged)
      // If it has an expiry, we might want to keep it visible or let user dismiss
      // adhering to original behavior for now, but extended slightly
      const timer = setTimeout(() => {
        if (notification.type === 'user_unflagged') {
          animateOut();
        }
        // For flagged, maybe keep it until dismissed? Or just longer.
        // User request implies "notification when flag countdown is finished", so maybe keep this toast sticky?
        // For now, let's stick to auto-dismiss but longer for flagged
      }, notification.type === 'user_flagged' ? 10000 : 5000);

      return () => {
        clearTimeout(timer);
        if (interval) clearInterval(interval);
      };
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
    ? `Restriction: ${notification.data.restriction_applied.toUpperCase()}`
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
          {/* Countdown Display */}
          {!isUnflagged && timeRemaining && (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={14} color="#ffcccc" />
              <Text style={styles.timerText}>
                Lifted in: <Text style={{ fontWeight: 'bold', color: '#fff' }}>{timeRemaining}</Text>
              </Text>
            </View>
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
    top: 50, // Moved down slightly to not overlap status bar completely
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 2000, // Higher z-index
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to top because of variable height
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2, // Align with title
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
    opacity: 0.9
  },
  restrictionText: {
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '600',
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  timerText: {
    color: '#ffcccc',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
    marginTop: 2
  },
});

export default FlagNotificationToast;
