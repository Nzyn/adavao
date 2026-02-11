// Message service for handling chat functionality
import { BACKEND_URL } from '../config/backend';
import { apiCache, CacheTTL } from '../utils/apiCache';
import { deduplicateRequest } from '../utils/requestOptimization';

export interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  report_id?: number;
  message: string;
  status: boolean; // true if read, false if unread
  sent_at: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_firstname?: string;
  sender_lastname?: string;
  receiver_name?: string;
  receiver_firstname?: string;
  receiver_lastname?: string;
}

export interface ChatConversation {
  user_id: number;
  other_user_id: number;
  user_name: string;
  user_firstname: string;
  user_lastname: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  user_avatar?: string;
}

class MessageService {
  private apiUrl = `${BACKEND_URL}/api`;

  // Get all conversations for a user (with caching and deduplication)
  async getUserConversations(userId: number): Promise<{ success: boolean; data: ChatConversation[] }> {
    const cacheKey = `conversations_${userId}`;
    
    return deduplicateRequest(cacheKey, async () => {
      // Check cache first (very short TTL for conversations - 2 seconds)
      const cached = apiCache.get<{ success: boolean; data: ChatConversation[] }>(cacheKey);
      if (cached) return cached;

      try {
        const response = await fetch(`${this.apiUrl}/messages/conversations/${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }

        const result = await response.json();
        apiCache.set(cacheKey, result, CacheTTL.VERY_SHORT);
        return result;
      } catch (error) {
        return { success: false, data: [] };
      }
    });
  }

  // Get messages between two users (with caching and deduplication)
  async getMessages(userId: number, otherUserId: number): Promise<{ success: boolean; data: Message[] }> {
    const cacheKey = `messages_${userId}_${otherUserId}`;
    
    return deduplicateRequest(cacheKey, async () => {
      const cached = apiCache.get<{ success: boolean; data: Message[] }>(cacheKey);
      if (cached) return cached;

      try {
        const response = await fetch(`${this.apiUrl}/messages/${userId}/${otherUserId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const result = await response.json();
        apiCache.set(cacheKey, result, CacheTTL.VERY_SHORT);
        return result;
      } catch (error) {
        return { success: false, data: [] };
      }
    });
  }

  // Send a new message (invalidates cache after sending)
  async sendMessage(senderId: number, receiverId: number, message: string, reportId?: number): Promise<{ success: boolean; messageId?: number }> {
    try {
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          receiverId,
          message,
          reportId: reportId || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      
      // Invalidate caches for both users to ensure fresh data on next fetch
      apiCache.invalidate(`messages_${senderId}_${receiverId}`);
      apiCache.invalidate(`messages_${receiverId}_${senderId}`);
      apiCache.invalidate(`conversations_${senderId}`);
      apiCache.invalidate(`conversations_${receiverId}`);
      
      return result;
    } catch (error) {
      return { success: false };
    }
  }

  // Mark message as read
  async markAsRead(messageId: number): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.apiUrl}/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark message as read: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false };
    }
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(userId: number, otherUserId: number): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.apiUrl}/messages/conversation/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otherUserId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark conversation as read: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false };
    }
  }

  // Get unread message count
  async getUnreadCount(userId: number): Promise<{ success: boolean; count: number }> {
    try {
      const response = await fetch(`${this.apiUrl}/messages/unread/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, count: 0 };
    }
  }
}

export const messageService = new MessageService();
