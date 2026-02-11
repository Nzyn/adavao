// API service for notification-related operations
import { API_URL } from '../config/backend';
import { reportService } from './reportService';
import { apiCache, CacheTTL } from '../utils/apiCache';
import { deduplicateRequest } from '../utils/requestOptimization';

// Use the local Node.js backend
const BACKEND_URL = API_URL;

export interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'report' | 'verification' | 'message' | 'user_flagged' | 'user_unflagged';
  relatedId?: number; // ID of the related report or other entity
  data?: {
    flag_id?: number;
    violation_type?: string;
    reason?: string;
    total_flags?: number;
    restriction_applied?: string;
    expires_at?: string; // ISO string
  };
}

export const notificationService = {
  // Get user notifications from the backend (with caching and deduplication)
  async getUserNotifications(userId: string) {
    const cacheKey = `notifications_${userId}`;
    
    return deduplicateRequest(cacheKey, async () => {
      // Check cache first (very short TTL - 2 seconds)
      const cached = apiCache.get<Notification[]>(cacheKey);
      if (cached) return cached;

      try {
        const response = await fetch(`${BACKEND_URL}/notifications/${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // Ensure notifications are sorted by timestamp (newest first)
          const sortedNotifications = data.data.sort((a: Notification, b: Notification) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          apiCache.set(cacheKey, sortedNotifications, CacheTTL.VERY_SHORT);
          return sortedNotifications as Notification[];
        } else {
          throw new Error(data.message || 'Failed to fetch notifications');
        }
      } catch (error) {
        throw error;
      }
    });
  },

  // Mark a notification as read (invalidates cache)
  async markAsRead(notificationId: number, userId: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      // Invalidate notifications cache
      apiCache.invalidate(`notifications_${userId}`);

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Handle real-time notification from broadcast event (flagged notification)
  handleFlaggedNotification(data: any): Notification {
    const notification: Notification = {
      id: data.flag_id || Date.now(),
      title: 'Account Flagged',
      message: data.message || `Your account has been flagged for: ${data.violation_type}`,
      timestamp: data.flagged_at || new Date().toISOString(),
      read: false,
      type: 'user_flagged',
      data: {
        flag_id: data.flag_id,
        violation_type: data.violation_type,
        reason: data.reason,
        total_flags: data.total_flags,
        restriction_applied: data.restriction_applied,
      }
    };
    return notification;
  },

  // Setup polling for notifications (fallback if real-time is unavailable)
  // Uses a "ready" flag to only emit new notifications once
  // Also tracks flag status changes to detect when flags are removed
  startNotificationPolling(userId: string, onNewNotification: (notification: Notification) => void, onFlagStatusChange?: (hasFlagNotifications: boolean) => void, interval: number = 2000) {
    let isReady = false; // Only emit notifications after initial fetch
    let lastNotificationIds = new Set<number | string>(); // Track which notifications have been emitted
    let lastFlagNotificationCount = 0; // Track number of flag notifications

    const pollInterval = setInterval(async () => {
      try {
        const notifications = await this.getUserNotifications(userId);

        if (!isReady) {
          // First poll: initialize the tracking set with current notification IDs
          // but don't emit them (they're existing, not new)
          lastNotificationIds = new Set(notifications.map(n => n.id));
          lastFlagNotificationCount = notifications.filter(n => n.type === 'user_flagged').length;
          isReady = true;
          return;
        }

        // Check for flag status changes (user might have been unflagged by admin)
        const currentFlagNotificationCount = notifications.filter(n => n.type === 'user_flagged').length;
        if (currentFlagNotificationCount !== lastFlagNotificationCount) {
          if (onFlagStatusChange) {
            onFlagStatusChange(currentFlagNotificationCount > 0);
          }
          lastFlagNotificationCount = currentFlagNotificationCount;
        }

        // Emit only truly new notifications (ones we haven't seen before)
        const unreadNotifications = notifications.filter(n => !n.read);
        const newNotifications = unreadNotifications.filter(n => !lastNotificationIds.has(n.id));

        if (newNotifications.length > 0) {
          // Emit the latest new notification
          const latestNew = newNotifications[0];
          onNewNotification(latestNew);

          // Add to tracking set
          lastNotificationIds.add(latestNew.id);
        }
      } catch (error) {
        // Silent fail for background polling
      }
    }, interval);

    // Return a function to stop polling
    return () => {
      clearInterval(pollInterval);
    };
  }
};