import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../contexts/UserContext';
import { BACKEND_URL } from '../../config/backend';
import CaptchaObfuscated, { generateCaptchaWord } from '../../components/CaptchaObfuscated';
import { useGoogleAuth, getGoogleUserInfo } from '../../config/googleAuth';
import * as Google from 'expo-auth-session/providers/google';
import PoliceStationLookup from '../../components/PoliceStationLookup';
import { syncPoliceStations } from '../../services/policeStationService';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

// Sanitization helpers
const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().replace(/\s+/g, '').slice(0, 100);
};

const sanitizeText = (text: string): string => {
  // Remove invisible characters, zero-width spaces, and trim whitespace
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .slice(0, 100);
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaWord, setCaptchaWord] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [showPoliceStationLookup, setShowPoliceStationLookup] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setUser } = useUser();
  const router = useRouter();
  const { request, response, promptAsync } = useGoogleAuth();

  // Reset loading state whenever screen comes into focus (especially after logout)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Login screen focused - resetting loading state');
      setIsLoading(false);

      // Clear password and captcha fields when returning to login
      setPassword("");
      setCaptchaInput("");
      setCaptchaValid(false);
      refreshCaptcha();

      return () => { };
    }, [])
  );

  useEffect(() => {
    setCaptchaWord(generateCaptchaWord(6));

    // Load saved email if remember me was checked
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved email:', error);
      }
    };
    loadSavedEmail();

    // Check if user was logged out due to inactivity
    const checkInactivityLogout = async () => {
      try {
        const wasInactive = await AsyncStorage.getItem('inactivityLogout');
        if (wasInactive === 'true') {
          await AsyncStorage.removeItem('inactivityLogout');
          Alert.alert(
            'Session Expired',
            'You have been logged out due to 5 minutes of inactivity. Please log in again.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('Error checking inactivity logout:', err);
      }
    };

    checkInactivityLogout();

    // Sync police station data in the background (non-blocking)
    syncPoliceStations().catch(err => {
      console.warn('Background sync of police stations failed:', err);
    });
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleSignIn(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const userInfo = await getGoogleUserInfo(accessToken);
      if (!userInfo) {
        Alert.alert('Error', 'Failed to get user information from Google');
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${BACKEND_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          googleId: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          profilePicture: userInfo.picture,
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (response.ok) {
        const user = data.user || data;

        console.log('✅ Google login successful for:', user.email);
        console.log('📦 Full user data received:', user);

        // Store complete user data in AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        // Set user in context with all available fields
        setUser({
          id: user.id?.toString() || '0',
          firstName: user.firstname || user.firstName || '',
          lastName: user.lastname || user.lastName || '',
          email: user.email || '',
          phone: user.contact || user.phone || '',
          address: user.address || '',
          isVerified: Boolean(user.is_verified || user.isVerified),
          profileImage: user.profile_image || user.profileImage || '',
          createdAt: user.createdAt || user.created_at || '',
          updatedAt: user.updatedAt || user.updated_at || '',
        });

        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', data.message || 'Google login failed');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const errorMessage = err.message || 'Unknown error';
      if (errorMessage.includes('aborted')) {
        Alert.alert('Connection Timeout', 'The server is taking too long to respond. Please check your connection or try again later.', [{ text: 'OK' }]);
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          `Cannot connect to server at ${BACKEND_URL}.\nPlease check:\n1. Your internet connection\n2. Backend server is running\n3. Your device is on the same Wi-Fi as server`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Network Error', errorMessage);
      }
      setIsLoading(false);
    }
  };

  const refreshCaptcha = () => {
    const newWord = generateCaptchaWord(6);
    setCaptchaWord(newWord);
    setCaptchaInput("");
    setCaptchaValid(false);
  };

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");
    setCaptchaError("");

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Validate email format
    if (!sanitizedEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Verify captcha
    if (!captchaValid) {
      setCaptchaError('Incorrect captcha. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    console.log('🔑 Starting login for:', sanitizedEmail);
    const loginUrl = `${BACKEND_URL}/login`;
    console.log('🌐 Fetching URL:', loginUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email: sanitizedEmail, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('📥 Login response:', data);
      if (response.ok) {
        // Login successful - get full user data
        const user = data.user || data;

        // Check user role restrictions
        if (user.role === 'police' || user.role === 'admin') {
          Alert.alert('Error', 'Police and Admin users must log in through the AdminSide dashboard.');
          setIsLoading(false);
          return;
        }

        console.log('✅ Login successful for:', user.email);
        console.log('📦 Full user data received:', user);

        // Handle remember me
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', sanitizedEmail);
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
        }

        // Store complete user data in AsyncStorage
        const jsonUser = JSON.stringify(user);
        await AsyncStorage.setItem('userData', jsonUser);

        // Verify persistence
        const storedCheck = await AsyncStorage.getItem('userData');
        console.log('💾 AsyncStorage check immediately after write:', storedCheck ? 'EXISTS' : 'NULL');

        // Set user in context with all available fields
        setUser({
          id: user.id?.toString() || user.userId?.toString() || '0',
          firstName: user.firstname || user.firstName || '',
          lastName: user.lastName || user.lastname || user.lastName || '',
          email: user.email || '',
          phone: user.contact || user.phone || '',
          address: user.address || '',
          isVerified: Boolean(user.is_verified || user.isVerified),
          profileImage: user.profile_image || user.profileImage || '',
          createdAt: user.createdAt || user.created_at || '',
          updatedAt: user.updatedAt || user.updated_at || '',
        });

        // Reset navigation stack and go to home
        setTimeout(() => {
          console.log('🚀 Navigating to / (home)...');
          router.replace('/');
        }, 100);
      } else {
        // Display error messages under relevant input fields
        const errorMessage = data.message || 'Login failed';
        const lowerError = errorMessage.toLowerCase();

        // Handle email not verified
        if (data.emailNotVerified) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email address before logging in. Check your inbox for the verification link.',
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Resend Email',
                onPress: async () => {
                  try {
                    const resendResponse = await fetch(`${BACKEND_URL}/resend-verification`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                      },
                      body: JSON.stringify({ email: sanitizedEmail }),
                    });
                    const resendData = await resendResponse.json();
                    if (resendResponse.ok) {
                      Alert.alert('Success', 'Verification email has been sent! Please check your inbox.');
                    } else {
                      Alert.alert('Error', resendData.message || 'Failed to resend verification email');
                    }
                  } catch (err: any) {
                    Alert.alert('Error', 'Failed to resend verification email');
                  }
                },
              },
            ]
          );
        } else if (lowerError.includes('user') || lowerError.includes('email') || lowerError.includes('not found')) {
          setEmailError(errorMessage);
        } else if (lowerError.includes('password') || lowerError.includes('incorrect') || lowerError.includes('invalid')) {
          setPasswordError(errorMessage);
        } else {
          Alert.alert('Login Failed', errorMessage);
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      const errorMessage = err.message || 'Unknown error';
      // Check for timeout/abort error first
      if (err.name === 'AbortError' || errorMessage.includes('aborted')) {
        Alert.alert('Connection Timeout', 'The server is taking too long to respond. Please check your connection or try again later.', [{ text: 'OK' }]);
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          `Cannot connect to server at ${BACKEND_URL}.\nPlease check:\n1. Your internet connection\n2. Backend server is running\n3. Your device is on the same Wi-Fi as server\n4. Firewall is allowing port 3000`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Network Error', errorMessage);
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot Password clicked!");
    router.push('/(tabs)/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/(tabs)/register');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingBottom: 100,
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        <View style={{ width: '100%', maxWidth: 420 }} pointerEvents="box-none">
          {/* Police Station Lookup Icon - Positioned at top right */}
          <TouchableOpacity
            style={localStyles.policeIconButton}
            onPress={() => setShowPoliceStationLookup(true)}
          >
            <Ionicons name="ellipsis-horizontal-circle" size={28} color="#1D3557" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={localStyles.title}>
            <Text style={localStyles.alertText}>Alert</Text>
            <Text style={localStyles.davaoText}>Davao</Text>
          </Text>

          <Text style={localStyles.subtitle}>Welcome back to AlertDavao!</Text>
          <Text style={localStyles.description}>Sign in to your account</Text>

          {/* Email Field */}
          <View style={localStyles.fieldContainer}>
            <Text style={localStyles.label}>Email <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={[localStyles.input, emailError && localStyles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={(text) => {
                try {
                  setEmail(sanitizeEmail(text));
                  setEmailError("");
                } catch (error) {
                  console.error('Error sanitizing email:', error);
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              maxLength={100}
            />
            {emailError ? (
              <Text style={localStyles.errorText}>⚠️ {emailError}</Text>
            ) : null}
          </View>

          {/* Password Field */}
          <View style={localStyles.fieldContainer}>
            <Text style={localStyles.label}>Password <Text style={{ color: 'red' }}>*</Text></Text>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={[localStyles.input, localStyles.passwordInput, passwordError && localStyles.inputError]}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => {
                  try {
                    // Sanitize password - remove invisible characters
                    const sanitized = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    setPassword(sanitized);
                    setPasswordError("");
                  } catch (error) {
                    console.error('Error setting password:', error);
                  }
                }}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={localStyles.toggleButton}
              >
                <Text style={localStyles.toggleText}>
                  {showPassword ? 'HIDE' : 'SHOW'}
                </Text>
              </Pressable>
            </View>
            {passwordError ? (
              <Text style={localStyles.errorText}>⚠️ {passwordError}</Text>
            ) : null}
          </View>

          {/* Captcha Section */}
          <View style={localStyles.captchaSection}>
            <Text style={localStyles.label}>Captcha Verification <Text style={{ color: 'red' }}>*</Text></Text>
            <View style={localStyles.captchaRow}>
              <View style={localStyles.captchaDisplay}>
                <CaptchaObfuscated word={captchaWord} />
              </View>
              <Pressable onPress={refreshCaptcha} style={localStyles.refreshButton}>
                <Text style={localStyles.refreshIcon}>↻</Text>
              </Pressable>
            </View>
            <TextInput
              style={[
                localStyles.input,
                localStyles.captchaInput,
                captchaInput && (captchaValid ? localStyles.inputValid : localStyles.inputError)
              ]}
              placeholder="Enter captcha above"
              placeholderTextColor="#9ca3af"
              value={captchaInput}
              onChangeText={(text) => {
                try {
                  const limited = text.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
                  setCaptchaInput(limited);
                  setCaptchaValid(limited === captchaWord.toUpperCase());
                  setCaptchaError("");
                } catch (error) {
                  console.error('Error processing captcha input:', error);
                }
              }}
              autoCapitalize="characters"
              maxLength={6}
            />
            {captchaInput && (
              <Text style={[localStyles.captchaStatus, { color: captchaValid ? '#22c55e' : '#ef4444' }]}>
                {captchaValid ? '✓ Correct' : '✗ Incorrect code'}
              </Text>
            )}
            {captchaError ? (
              <Text style={localStyles.errorText}>⚠️ {captchaError}</Text>
            ) : null}
          </View>

          {/* Remember Me Checkbox */}
          <View style={localStyles.rememberMeContainer}>
            <Checkbox
              value={rememberMe}
              onValueChange={setRememberMe}
              color={rememberMe ? '#1D3557' : undefined}
              style={localStyles.checkbox}
            />
            <Text style={localStyles.rememberMeText}>Remember my email</Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              localStyles.loginButton,
              (!captchaValid || isLoading) && localStyles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={!captchaValid || isLoading}
          >
            <Text style={localStyles.loginButtonText}>
              {isLoading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <Text onPress={handleForgotPassword} style={localStyles.forgotPassword}>
            Forgot Password?
          </Text>

          <Text style={localStyles.signUpPrompt}>
            Don't have an account?{' '}
            <Text onPress={handleSignUp} style={localStyles.signUpLink}>
              Sign Up
            </Text>
          </Text>

          {/* Divider */}
          <View style={localStyles.divider}>
            <View style={localStyles.dividerLine} />
            <Text style={localStyles.dividerText}>or continue with</Text>
            <View style={localStyles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <Pressable
            onPress={() => promptAsync()}
            disabled={isLoading || !request}
            style={[localStyles.googleButton, (isLoading || !request) && { opacity: 0.5 }]}
          >
            <Text style={localStyles.googleButtonText}>
              🔐 {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </Pressable>

          {/* Emergency Contact Info */}
          <View style={localStyles.emergencyBox}>
            <Text style={localStyles.emergencyIcon}>🚨</Text>
            <View style={localStyles.emergencyContent}>
              <Text style={localStyles.emergencyTitle}>Need Emergency Help?</Text>
              <Text style={localStyles.emergencyText}>
                Tap the options icon (⋯) above to find your nearest police station contact
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Police Station Lookup Modal */}
      <PoliceStationLookup
        visible={showPoliceStationLookup}
        onClose={() => setShowPoliceStationLookup(false)}
      />
    </KeyboardAvoidingView>
  );
};

// Responsive styles
const localStyles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  policeIconButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1D3557',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  title: {
    fontSize: Math.min(32, SCREEN_WIDTH * 0.08),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertText: {
    color: '#1D3557',
  },
  davaoText: {
    color: '#000',
  },
  subtitle: {
    fontSize: Math.min(18, SCREEN_WIDTH * 0.045),
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
    marginBottom: 4,
  },
  description: {
    fontSize: isSmallScreen ? 13 : 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  passwordInput: {
    paddingRight: 60,
  },
  inputValid: {
    borderColor: '#22c55e',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D3557',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  captchaSection: {
    marginBottom: 20,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  captchaDisplay: {
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  captchaInput: {
    height: 40,
    paddingVertical: 8,
  },
  captchaStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#374151',
  },
  loginButton: {
    backgroundColor: '#1D3557',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    color: '#1D3557',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  signUpPrompt: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 20,
  },
  signUpLink: {
    color: '#1D3557',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#9ca3af',
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  googleButtonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  emergencyBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  emergencyIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
});

export default Login;
