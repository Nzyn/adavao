import React, { useState, useEffect } from "react";
import { View, Text, Button, TextInput, ScrollView, Platform, TouchableOpacity, Alert, Modal, Pressable, StyleSheet } from "react-native";
import Checkbox from "expo-checkbox";
// import CaptchaObfuscated from '../../components/CaptchaObfuscated'; // Removed
import Recaptcha from 'react-native-recaptcha-that-works';
import styles from "./styles"; // Assuming this exists and is compatible
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PhoneInput, validatePhoneNumber } from '../../components/PhoneInput';
import { BACKEND_URL } from '../../config/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';
import TermsAndConditionsModal from '../../components/TermsAndConditionsModal';
import { useGoogleAuth, getGoogleUserInfo } from '../../config/googleAuth';
import * as Google from 'expo-auth-session/providers/google';

// Sanitization helpers
const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().replace(/\s+/g, '').slice(0, 100);
};

const sanitizeText = (text: string): string => {
  return text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

const Register = () => {
  // 📊 Performance Timing - Start
  const pageStartTime = React.useRef(Date.now());
  React.useEffect(() => {
    const loadTime = Date.now() - pageStartTime.current;
    console.log(`📊 [Register] Page Load Time: ${loadTime}ms`);
  }, []);
  // 📊 Performance Timing - End

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [contact, setContact] = useState("");

  // Recaptcha State (Removed)
  // const [captchaValid, setCaptchaValid] = useState(false);
  // const recaptchaRef = React.useRef<any>(null);

  const [isChecked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Google Auth State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<any>(null);
  const [phoneForGoogle, setPhoneForGoogle] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [userIdForOtp, setUserIdForOtp] = useState<string | null>(null);

  // Name collection modal state (for Google Sign-In when name not available)
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameFirstName, setNameFirstName] = useState("");
  const [nameLastName, setNameLastName] = useState("");

  const router = useRouter();
  const { setUser } = useUser();
  const { request, response, promptAsync } = useGoogleAuth();

  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Register screen focused - resetting state');
      setIsLoading(false);

      // Clear fields
      // setFirstname(''); setLastname(''); setEmail(''); setContact(''); 
      // setPassword(''); setConfirmPassword(''); setIsChecked(false);
      // setCaptchaValid(false);
      setRegistrationError('');
      setPasswordMatchError('');

      return () => { };
    }, [])
  );

  // Google Auth Effect
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

      console.log('🌐 Google User Info (Register Page):', userInfo.email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        // Case 1: New user but Google didn't provide name - need to collect it
        if (data.requiresName) {
          console.log('📝 Name required for Google registration');
          setGoogleInfo({
            googleId: data.googleInfo.googleId,
            email: data.googleInfo.email,
            profilePicture: data.googleInfo.profilePicture,
          });
          setShowNameModal(true);
          setIsLoading(false);
          return;
        }

        // Case 2: Login successful (existing or new user with Google name)
        if (data.user) {
          if (data.isNewUser) {
            Alert.alert('Welcome!', 'Your account has been created successfully.');
          }
          await processLoginSuccess(data.user);
          return;
        }

        Alert.alert('Login Failed', 'Unexpected response from server');
        setIsLoading(false);
      } else {
        Alert.alert('Login Failed', data.message || 'Google login failed');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      Alert.alert('Error', 'Google Sign-In failed: ' + (err.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const handleGoogleRegisterWithPhone = async () => {
    if (!googleInfo) return;

    if (!validatePhoneNumber(phoneForGoogle)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Philippine mobile number starting with 9 (10 digits total).');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/google-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...googleInfo,
          contact: phoneForGoogle
        })
      });

      const data = await response.json();
      if (response.ok) {
        setShowPhoneModal(false);

        // Check for OTP
        if (data.requireOtp) {
          setUserIdForOtp(data.userId);
          setShowOtpModal(true);
          setIsLoading(false);
          return;
        }

        await processLoginSuccess(data.user);
      } else {
        Alert.alert('Registration Failed', data.message || 'Failed to register with Google');
        setIsLoading(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to complete registration');
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/google-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdForOtp,
          otp: otpCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowOtpModal(false);
        await processLoginSuccess(data.user);
      } else {
        Alert.alert('Verification Failed', data.message || 'Invalid OTP');
        setIsLoading(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify OTP');
      setIsLoading(false);
    }
  };

  // [NEW] Handle name submission for Google registration
  const handleSubmitName = async () => {
    if (!nameFirstName.trim() || !nameLastName.trim()) {
      Alert.alert('Error', 'Please enter both first and last name.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/google-complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleInfo.googleId,
          email: googleInfo.email,
          firstName: nameFirstName.trim(),
          lastName: nameLastName.trim(),
          profilePicture: googleInfo.profilePicture,
        })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setShowNameModal(false);
        setNameFirstName('');
        setNameLastName('');
        Alert.alert('Welcome!', 'Your account has been created successfully.');
        await processLoginSuccess(data.user);
      } else {
        Alert.alert('Registration Failed', data.message || 'Failed to complete registration');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Name submission error:', err);
      Alert.alert('Error', 'Failed to complete registration');
      setIsLoading(false);
    }
  };

  const processLoginSuccess = async (user: any) => {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    setUser({
      id: user.id?.toString() || user.userId?.toString() || '0',
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
  };


  const handleRegister = async () => {
    setRegistrationError("");

    if (!isChecked) {
      alert("You must accept the Terms & Conditions before registering.");
      return;
    }

    const sanitizedFirstname = sanitizeText(firstname);
    const sanitizedLastname = sanitizeText(lastname);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedContact = contact.trim().replace(/\s+/g, '');

    // Basic Validation
    if (!sanitizedFirstname || !sanitizedLastname || !sanitizedEmail || !sanitizedContact || !password || !confirmpassword) {
      Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
      return;
    }
    if (!sanitizedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmpassword) {
      setPasswordMatchError("Passwords do not match");
      return;
    }

    // Captcha Validation (Removed)
    /* if (!captchaValid) {
      Alert.alert('Security Check', 'Please complete the captcha verification.');
      recaptchaRef.current?.open();
      return;
    } */

    try {
      if (!validatePhoneNumber(sanitizedContact)) {
        Alert.alert('Invalid Phone', 'Please enter a valid Philippine mobile number (e.g., 9123456789)');
        return;
      }

      setIsLoading(true);

      // Normalize phone
      let normalizedPhone = sanitizedContact;
      // If user entered 9xx..., backend might expect +639... depending on your logic.
      // Assuming backend handles raw or we standardize. Let's standarize if it starts with 9.
      // Actually PhoneInput usually returns pure digits.
      // If it starts with 9 and length 10, let's prepend 0 or +63? 
      // The backend 'handleGoogleRegister' expected raw digits or handled it.
      // Let's stick to what standard register expected:
      if (normalizedPhone.length === 10 && normalizedPhone.startsWith('9')) {
        normalizedPhone = '0' + normalizedPhone; // Convert 912... to 0912...
      }

      // Create a timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout (increased from 60s)

      const regResp = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: sanitizedFirstname,
          lastname: sanitizedLastname,
          email: sanitizedEmail,
          contact: normalizedPhone,
          password
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      const regData = await regResp.json();

      setIsLoading(false);

      if (regResp.ok) {
        if (regData.user) {
          await processLoginSuccess(regData.user);
          Alert.alert('Success', 'Welcome to AlertDavao!');
        } else {
          Alert.alert('Success', 'Please check your email to verify your account.', [{ text: 'OK', onPress: () => router.replace('/(tabs)/login') }]);
        }
      } else {
        setRegistrationError(regData.message || 'Failed to register');

        // Show more specific error messages
        if (regData.message && regData.message.includes('email')) {
          Alert.alert('Email Service Issue', regData.message + '\n\nPlease verify your email address is correct and try again.');
        } else {
          Alert.alert('Registration Failed', regData.message || 'Failed to register');
        }
      }
    } catch (error: any) {
      console.error('Register Error:', error);
      setIsLoading(false);

      // Handle different error types
      if (error.name === 'AbortError') {
        Alert.alert(
          'Request Timeout',
          'Registration is taking longer than expected. This might be due to email service delays.\n\nPlease check your email inbox (including spam folder) in a few minutes, or try registering again.'
        );
      } else {
        Alert.alert('Error', 'Failed to register: ' + (error.message || 'Network Error'));
      }
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 150, paddingHorizontal: 20, alignItems: 'center' }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ width: '100%', maxWidth: 440 }}>
        {/* Title */}
        <Text style={styles.textTitle}>
          <Text style={styles.alertWelcome}>Alert</Text>
          <Text style={styles.davao}>Davao</Text>
        </Text>

        <Text style={styles.subheadingCenter}>Welcome to AlertDavao!</Text>
        <Text style={styles.normalTxtCentered}>Register and Create an Account</Text>

        {registrationError ? (
          <Text style={{ color: '#E63946', fontSize: 12, marginBottom: 15, textAlign: 'center' }}>
            {registrationError}
          </Text>
        ) : null}

        {/* Form Fields */}
        <Text style={styles.subheading2}>Firstname <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          value={firstname}
          onChangeText={(text) => setFirstname(sanitizeText(text))}
        />

        <Text style={styles.subheading2}>Lastname <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your last name"
          value={lastname}
          onChangeText={(text) => setLastname(sanitizeText(text))}
        />

        <Text style={styles.subheading2}>Email <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => setEmail(sanitizeEmail(text))}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.subheading2}>Contact Number <Text style={{ color: 'red' }}>*</Text></Text>
        <PhoneInput
          value={contact}
          onChangeText={setContact}
          placeholder="9XX XXX XXXX"
        />

        <Text style={styles.subheading2}>Password <Text style={{ color: 'red' }}>*</Text></Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (confirmpassword) setPasswordsMatch(text === confirmpassword);
            }}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={localStyles.eyeIcon}>
            <Text style={{ fontSize: 12, color: '#1D3557', fontWeight: '600' }}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
          </Pressable>
        </View>

        <Text style={styles.subheading2}>Confirm Password <Text style={{ color: 'red' }}>*</Text></Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Re-enter your password"
            value={confirmpassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (password) setPasswordsMatch(text === password);
            }}
            secureTextEntry={!showConfirmPassword}
          />
          <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={localStyles.eyeIcon}>
            <Text style={{ fontSize: 12, color: '#1D3557', fontWeight: '600' }}>{showConfirmPassword ? 'HIDE' : 'SHOW'}</Text>
          </Pressable>
        </View>

        {confirmpassword && (
          <Text style={{ color: passwordsMatch ? '#10B981' : '#E63946', fontSize: 12, marginTop: -10, marginBottom: 10 }}>
            {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </Text>
        )}

        {/* Terms */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 10 }}>
          <Checkbox value={isChecked} onValueChange={setChecked} color={isChecked ? "#1D3557" : undefined} />
          <Text style={{ fontSize: 12, color: "#555", marginLeft: 8, marginBottom: 15, flex: 1 }}>
            By clicking you agree to accept our{" "}
            <Text style={{ color: "#1D3557", fontWeight: "bold", textDecorationLine: "underline" }} onPress={() => setShowTermsModal(true)}>Terms & Conditions</Text>
          </Text>
        </View>

        {/* Captcha Section Removed */}
        {/* <View style={localStyles.captchaSection}>
          <Recaptcha
            ref={recaptchaRef}
            siteKey="6Lc-kyMqAAAAAL_QW9-qFwT2su-3sylJgeuXqFq8"
            baseUrl="http://localhost"
            onVerify={() => setCaptchaValid(true)}
            onExpire={() => setCaptchaValid(false)}
            size="normal"
          />
          <TouchableOpacity
            style={[localStyles.captchaTrigger, captchaValid && localStyles.captchaTriggerValid]}
            onPress={() => recaptchaRef.current?.open()}
            disabled={captchaValid}
          >
            <Text style={[localStyles.captchaText, captchaValid && { color: '#fff' }]}>
              {captchaValid ? '✓ Verified' : 'Click to Verify (I am not a robot)'}
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* Register Button */}
        <TouchableOpacity
          style={[
            localStyles.registerButton,
            (!isChecked || isLoading) && localStyles.registerButtonDisabled
          ]}
          onPress={handleRegister}
          disabled={!isChecked || isLoading}
          activeOpacity={0.8}
        >
          <Text style={localStyles.registerButtonText}>
            {isLoading ? "REGISTERING..." : "REGISTER"}
          </Text>
        </TouchableOpacity>

        {/* Google Sign In Option */}
        <View style={localStyles.divider}>
          <View style={localStyles.dividerLine} />
          <Text style={localStyles.dividerText}>or continue with</Text>
          <View style={localStyles.dividerLine} />
        </View>

        <Pressable
          onPress={() => promptAsync()}
          disabled={isLoading || !request}
          style={[localStyles.googleButton, (isLoading || !request) && { opacity: 0.5 }]}
        >
          <View style={localStyles.googleIconContainer}>
            <Text style={localStyles.googleG}>G</Text>
          </View>
          <Text style={localStyles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </Pressable>


        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#555' }}>I already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/login')}>
            <Text style={{ color: '#1D3557', fontWeight: 'bold', textDecorationLine: 'underline' }}>Login here</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Terms Modal */}
      <TermsAndConditionsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* Phone Number Modal for Google */}
      <Modal
        visible={showPhoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Complete Registration</Text>
            <Text style={localStyles.modalSubtitle}>Please enter your mobile number to continue.</Text>

            <PhoneInput
              value={phoneForGoogle}
              onChangeText={setPhoneForGoogle}
              placeholder="9XX XXX XXXX"
            />

            <TouchableOpacity
              style={localStyles.modalButton}
              onPress={handleGoogleRegisterWithPhone}
              disabled={isLoading}
            >
              <Text style={localStyles.modalButtonText}>
                {isLoading ? 'Saving...' : 'Save & Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.modalButton, { backgroundColor: '#ccc', marginTop: 10 }]}
              onPress={() => setShowPhoneModal(false)}
            >
              <Text style={localStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Verify OTP</Text>
            <Text style={localStyles.modalSubtitle}>
              A verification code has been sent to your phone.
            </Text>

            <TextInput
              style={[localStyles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 5 }]}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[localStyles.modalButton, { marginTop: 20 }]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              <Text style={localStyles.modalButtonText}>
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.modalButton, { backgroundColor: '#ccc', marginTop: 10 }]}
              onPress={() => setShowOtpModal(false)}
            >
              <Text style={localStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Name Collection Modal (for Google Sign-In when name not provided) */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Complete Your Profile</Text>
            <Text style={localStyles.modalSubtitle}>
              Please enter your name to finish creating your account.
            </Text>

            <TextInput
              style={[localStyles.input, { width: '100%', marginBottom: 10, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 }]}
              value={nameFirstName}
              onChangeText={setNameFirstName}
              placeholder="First Name"
              autoCapitalize="words"
            />

            <TextInput
              style={[localStyles.input, { width: '100%', marginBottom: 10, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 }]}
              value={nameLastName}
              onChangeText={setNameLastName}
              placeholder="Last Name"
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[localStyles.modalButton, { marginTop: 10, backgroundColor: '#1D3557', padding: 12, borderRadius: 8, alignItems: 'center' }]}
              onPress={handleSubmitName}
              disabled={isLoading}
            >
              <Text style={[localStyles.modalButtonText, { color: '#fff', fontWeight: 'bold' }]}>
                {isLoading ? 'Creating Account...' : 'Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.modalButton, { backgroundColor: '#ccc', marginTop: 10, padding: 12, borderRadius: 8, alignItems: 'center' }]}
              onPress={() => setShowNameModal(false)}
            >
              <Text style={localStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

// Local styles to supplement imported styles
const localStyles = StyleSheet.create({
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 13,
    paddingHorizontal: 8,
  },
  captchaSection: { marginBottom: 20, marginTop: 10 },
  captchaTrigger: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f9fafb'
  },
  captchaTriggerValid: {
    backgroundColor: '#10B981',
    borderColor: '#10B981'
  },
  captchaText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
    marginLeft: 10,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  googleG: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  registerButton: {
    backgroundColor: '#1D3557',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1D3557'
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#1D3557',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 24, // Optimized for OTP
    backgroundColor: '#fff',
    color: '#1f2937',
  }
});

export default Register;