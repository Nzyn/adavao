// Debug service for testing flag status issues
import { API_URL } from '../config/backend';

export const debugService = {
  // Check actual flag status from backend database
  async checkFlagStatus(userId: string) {
    try {
      console.log('📋 Checking flag status for user:', userId);
      
      const response = await fetch(`${API_URL}/debug/user/${userId}/flag-status`);
      
      if (!response.ok) {
        throw new Error(`Failed to check flag status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Flag Status Response:', data.flagStatus);
        console.log('📊 Detailed Info:', data.details);
        return data;
      } else {
        throw new Error(data.message || 'Failed to check flag status');
      }
    } catch (error) {
      console.error('❌ Error checking flag status:', error);
      throw error;
    }
  },

  // Log current flag state to console
  async logFlagState(userId: string) {
    try {
      const result = await this.checkFlagStatus(userId);
      const status = result.flagStatus;
      
      console.log(`
=== FLAG STATUS DEBUG LOG ===
User ID: ${userId}
Is Flagged: ${status.isFlagged}
Has Active Restrictions: ${status.hasActiveRestrictions}
Total Flags in DB: ${status.totalFlagsInDb}
Restriction Level: ${status.restrictionLevel}
Active Flags: ${status.activeFlags}
Total Flag Records: ${status.totalFlagRecords}
Dismissed Flag Records: ${status.dismissedFlagRecords}
========================
      `);
      
      return result;
    } catch (error) {
      console.error('Error logging flag state:', error);
      throw error;
    }
  }
};
