// API service for report-related operations
import { Platform } from 'react-native';
import { BACKEND_URL as CONFIG_BACKEND_URL, getOptimalBackendUrl } from '../config/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCache, CacheTTL } from '../utils/apiCache';
import { deduplicateRequest } from '../utils/requestOptimization';

// Use the backend URL from config
let BACKEND_URL = CONFIG_BACKEND_URL;

export interface ReportSubmissionData {
  title?: string; // Optional - will be auto-generated on backend if not provided
  crimeTypes: string[];
  description: string;
  incidentDate: string;
  isAnonymous: boolean;
  latitude?: number;
  longitude?: number;
  location?: string;  // Full location display (e.g., "Mindanao, Davao Del Sur, Davao City, Barangay 10-A")
  reporters_address?: string;  // Street address
  barangay?: string;  // Barangay name
  barangay_id?: number;  // Barangay ID for database linking
  mediaFiles?: Array<{
    uri: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
  }> | null;
  userId: string;
}

export const reportService = {
  // Submit a new report
  async submitReport(reportData: ReportSubmissionData) {
    try {
      console.log('✅ Using backend URL:', BACKEND_URL);
      console.log('📋 Submitting report:', reportData);

      // Create FormData for multipart upload (supports file upload)
      const formData = new FormData();

      // Add basic report fields (title auto-generated on backend)
      // formData.append('title', reportData.title); // Removed - auto-generated
      // Convert all crime types to lowercase for backend compatibility
      const lowerCrimeTypes = reportData.crimeTypes.map(type => type.toLowerCase());
      formData.append('crime_types', JSON.stringify(lowerCrimeTypes));
      formData.append('description', reportData.description);
      formData.append('incident_date', reportData.incidentDate);
      formData.append('is_anonymous', reportData.isAnonymous ? '1' : '0');
      formData.append('user_id', reportData.userId);

      // Add location fields
      if (reportData.reporters_address) {
        formData.append('reporters_address', reportData.reporters_address);
      }

      if (reportData.barangay) {
        formData.append('barangay', reportData.barangay);
      }

      if (reportData.barangay_id) {
        formData.append('barangay_id', reportData.barangay_id.toString());
      }

      // Add location data if available
      if (reportData.latitude !== undefined && reportData.latitude !== null &&
        reportData.longitude !== undefined && reportData.longitude !== null) {
        console.log('📍 Adding GPS coordinates to report:', {
          latitude: reportData.latitude,
          longitude: reportData.longitude
        });
        formData.append('latitude', reportData.latitude.toString());
        formData.append('longitude', reportData.longitude.toString());
      } else {
        console.warn('⚠️ No valid GPS coordinates found:', {
          latitude: reportData.latitude,
          longitude: reportData.longitude
        });
      }

      // Add media files if available (supports multiple uploads)
      const mediaFiles = Array.isArray(reportData.mediaFiles) ? reportData.mediaFiles.filter(m => !!m?.uri) : [];
      if (mediaFiles.length > 0) {
        console.log(`📎 Preparing ${mediaFiles.length} media file(s) for upload...`);

        // Extract file extension from URI or filename
        const getFileExtension = (uri: string, fileName?: string): string => {
          if (fileName) {
            const parts = fileName.split('.');
            if (parts.length > 1) return parts[parts.length - 1];
          }
          const uriParts = uri.split('.');
          if (uriParts.length > 1) return uriParts[uriParts.length - 1];
          return 'jpg'; // default
        };

        // Detect Platform
        // @ts-ignore
        const isWeb = typeof Platform !== 'undefined' ? Platform.OS === 'web' : typeof document !== 'undefined';

        for (const media of mediaFiles) {
          console.log('   URI:', media.uri);
          console.log('   File name:', media.fileName);
          console.log('   File type:', media.type);
          console.log('   File size:', media.fileSize);

          const fileExtension = getFileExtension(media.uri, media.fileName);
          const fileName = media.fileName || `evidence_${Date.now()}.${fileExtension}`;

          // Determine MIME type based on file extension
          // Don't trust media.type as it might be just 'image' or 'video'
          const ext = fileExtension.toLowerCase();
          let mimeType = 'image/jpeg'; // default

          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'gif') mimeType = 'image/gif';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'mp4') mimeType = 'video/mp4';
          else if (ext === 'mov') mimeType = 'video/quicktime';
          else if (ext === 'avi') mimeType = 'video/x-msvideo';
          else if (ext === 'webm') mimeType = 'video/webm';

          console.log('🔍 File extension:', ext);
          console.log('📋 Determined MIME type:', mimeType);

          if (isWeb) {
            console.log('🌐 Platform: Web - Converting URI to Blob...');
            try {
              const fileResponse = await fetch(media.uri);
              const fileBlob = await fileResponse.blob();
              const file = new File([fileBlob], fileName, { type: mimeType });
              formData.append('media', file, fileName);
              console.log('✅ Media file added to FormData (Web)');
            } catch (fileError) {
              console.error('❌ Error converting file:', fileError);
              throw new Error('Failed to process media file. Please try again.');
            }
          } else {
            console.log('📱 Platform: Native - Appending file object...');
            formData.append('media', {
              uri: media.uri,
              name: fileName,
              type: mimeType,
            } as any);
            console.log('✅ Media file added to FormData (Native)');
          }
        }
      } else {
        console.log('⚠️  No media files to upload');
      }

      console.log('\n' + '='.repeat(50));
      console.log('🚀 Sending report to backend...');
      console.log('API URL:', `${BACKEND_URL}/api/reports`);
      console.log('Has media:', mediaFiles.length > 0 ? 'YES' : 'NO');

      // CRITICAL DEBUG: Log FormData info
      console.log('\n📦 FormData Info:');
      console.log('   Media files included:', mediaFiles.length);
      console.log('='.repeat(50) + '\n');

      // Get user token for authentication
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const token = userData?.id || reportData.userId;

      console.log('🔑 User token:', token ? 'Found' : 'Missing');

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);

        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        } catch (parseError) {
          throw new Error(`Failed to submit report: HTTP ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Invalidate user reports cache after successful submission
      apiCache.invalidate(`user_reports_${reportData.userId}`);

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - Server took too long to respond. Please check your connection and try again.');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Get user's report history (with caching and deduplication)
  async getUserReports(userId: string) {
    const cacheKey = `user_reports_${userId}`;
    
    return deduplicateRequest(cacheKey, async () => {
      // Check cache first (short TTL for reports - 2 seconds)
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      try {
        const response = await fetch(`${BACKEND_URL}/api/reports/user/${userId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reports: HTTP ${response.status}`);
        }

        const data = await response.json();
        apiCache.set(cacheKey, data, CacheTTL.VERY_SHORT);
        return data;
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        throw error;
      }
    });
  },
};
