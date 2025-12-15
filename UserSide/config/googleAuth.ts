import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Get Google Client ID from app.json configuration
export const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '';
export const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId || '';
// export const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId || ''; // Future use

export const useGoogleAuth = () => {
  try {
    // For Expo Go: Use the standard Expo redirect URI
    // For Android production: Falls back to userside:// scheme
    const redirectUrl = makeRedirectUri({
      preferredScheme: Constants.appOwnership === 'expo' ? 'https' : 'userside',
    });

    console.log('🔐 Google Auth Config:', {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      redirectUrl: redirectUrl,
      appOwnership: Constants.appOwnership,
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID, // Default/Web
      androidClientId: GOOGLE_ANDROID_CLIENT_ID, // [NEW] Use Native Android Client ID
      scopes: ['profile', 'email'],
      redirectUri: redirectUrl,
    });

    return {
      request,
      response,
      promptAsync,
      isConfigured: true,
    };
  } catch (error) {
    console.error('❌ Google Auth Error:', error);
    return {
      request: null,
      response: null,
      promptAsync: async () => {
        throw new Error('Google Sign-In not configured');
      },
      isConfigured: false,
      error: error,
    };
  }
};

export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting Google user info:', error);
    return null;
  }
};
