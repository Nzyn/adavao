// API service for notification-related operations
import { API_URL } from '../config/backend';
import { reportService } from './reportService';

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
  };
}

export const notificationService = {
  // Get user notifications from the backend
  async getUserNotifications(userId: string) {
    try {
      console.log('Fetching notifications for user:', userId);

      const response = await fetch(`${BACKEND_URL}/notifications/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Notifications fetched successfully:', data.data);
        // Ensure notifications are sorted by timestamp (newest first)
        const sortedNotifications = data.data.sort((a: Notification, b: Notification) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return sortedNotifications as Notification[];
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark a notification as read (this updates the backend)
  async markAsRead(notificationId: number, userId: string) {
    try {
      console.log('Marking notification as read:', notificationId);

      const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
  startNotificationPolling(userId: string, onNewNotification: (notification: Notification) => void, onFlagStatusChange?: (hasFlagNotifications: boolean) => void, interval: number = 30000) {
    console.log('Starting notification polling for user:', userId);

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
          console.log('Notification polling ready. Tracking:', lastNotificationIds);
          return;
        }

        // Check for flag status changes (user might have been unflagged by admin)
        const currentFlagNotificationCount = notifications.filter(n => n.type === 'user_flagged').length;
        if (currentFlagNotificationCount !== lastFlagNotificationCount) {
          console.log(`🔍 [POLL] Flag notification count changed: ${lastFlagNotificationCount} -> ${currentFlagNotificationCount}`);
          console.log(`🔍 [POLL] All notifications:`, notifications);
          console.log(`🔍 [POLL] Flag notifications:`, notifications.filter(n => n.type === 'user_flagged'));

          if (onFlagStatusChange) {
            console.log(`🔍 [POLL] Calling onFlagStatusChange callback with: ${currentFlagNotificationCount > 0}`);
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
          console.log('New notification detected:', latestNew.id);
          onNewNotification(latestNew);

          // Add to tracking set
          lastNotificationIds.add(latestNew.id);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, interval);

    // Return a function to stop polling
    return () => {
      console.log('Stopping notification polling');
      clearInterval(pollInterval);
    };
  }
};