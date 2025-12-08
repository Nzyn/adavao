import React, { useState } from "react";
import { View, Text, Button, TextInput, ScrollView, Platform, TouchableOpacity, Alert, Modal, Pressable } from "react-native";
import Checkbox from "expo-checkbox";
import CaptchaObfuscated, { generateCaptchaWord } from '../../components/CaptchaObfuscated';
import styles from "./styles";
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PhoneInput, validatePhoneNumber } from '../../components/PhoneInput';
import { BACKEND_URL } from '../../config/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';
import TermsAndConditionsModal from '../../components/TermsAndConditionsModal';
// import CaptchaWebView from '../../components/CaptchaWebView';
import Constants from 'expo-constants';
// OTP package is installed; we'll use a simple TextInput for the code entry here.

// Sanitization helpers
const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().replace(/\s+/g, '').slice(0, 100);
};

const sanitizeText = (text: string): string => {
  // Remove invisible characters, zero-width spaces, and trim whitespace
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [contact, setContact] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaWord, setCaptchaWord] = useState(generateCaptchaWord(6));
  const [isChecked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  // Reset loading state whenever screen comes into focus (especially after logout)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Register screen focused - resetting loading state');
      setIsLoading(false);

      // Clear all form fields when switching back to register screen (no drafts)
      setFirstname('');
      setLastname('');
      setEmail('');
      setContact('');
      setPassword('');
      setConfirmPassword('');
      setIsChecked(false);
      setCaptchaAnswer('');
      setCaptchaValid(false);
      setRegistrationError('');
      setPasswordMatchError('');

      // Generate new captcha
      const newWord = generateCaptchaWord(6);
      setCaptchaWord(newWord);

      return () => { };
    }, [])
  );

  const handleRegister = async () => {
    console.log('🚀 Register button clicked!');
    console.log('📋 Validation state:', { isChecked, captchaValid, captchaAnswer, captchaWord });

    setRegistrationError("");

    if (!isChecked) {
      alert("You must accept the Terms & Conditions before registering.");
      return;
    }

    // Sanitize inputs
    const sanitizedFirstname = sanitizeText(firstname);
    const sanitizedLastname = sanitizeText(lastname);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedContact = contact.trim().replace(/\s+/g, '');

    // Validate required fields
    if (!sanitizedFirstname || !sanitizedLastname || !sanitizedEmail || !sanitizedContact || !password || !confirmpassword) {
      Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
      return;
    }

    // Validate email format
    if (!sanitizedEmail.includes('@') || !sanitizedEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Validate email domain - block disposable/fake email providers
    const emailDomain = sanitizedEmail.toLowerCase().split('@')[1];
    const disposableEmailDomains = [
      'anymail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'tempmail.com', 'throwaway.email', 'getnada.com', 'trashmail.com',
      'fakeinbox.com', 'temp-mail.org', 'dispostable.com', 'yopmail.com',
      'maildrop.cc', 'emailondeck.com', 'sharklasers.com'
    ];
    if (emailDomain && disposableEmailDomains.includes(emailDomain)) {
      Alert.alert('Invalid Email', 'Please use a valid email address. Temporary or disposable email addresses are not allowed.');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmpassword) {
      setPasswordMatchError("Passwords do not match");
      return;
    }

    if (!passwordsMatch) {
      setPasswordMatchError("Passwords do not match");
      return;
    }

    try {
      // Validate phone number
      if (!validatePhoneNumber(sanitizedContact)) {
        Alert.alert('Invalid Phone', 'Please enter a valid Philippine mobile number (e.g., +639123456789)');
        return;
      }

      if (!captchaValid) {
        Alert.alert('Captcha Required', 'Please type the word shown in the captcha.');
        return;
      }

      setIsLoading(true);

      // Normalize phone number to match backend format
      let normalizedPhone = sanitizedContact;
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+63' + normalizedPhone.slice(1);
      }

      // Submit registration directly without OTP
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
      });
      const regData = await regResp.json();
      console.log('📥 Registration response:', regData);

      setIsLoading(false);

      if (regResp.ok) {
        // Check if the user needs email verification or can login directly
        if (regData.user) {
          // Auto-login after successful registration
          const user = regData.user;
          console.log('✅ Auto-login after registration for:', user.email);

          // Store user data in AsyncStorage
          await AsyncStorage.setItem('userData', JSON.stringify(user));

          // Set user in context
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

          Alert.alert(
            'Registration Successful!',
            'Welcome to AlertDavao! You are now logged in.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('🚀 Auto-redirecting to main app...');
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        } else {
          // Email verification required
          Alert.alert(
            'Registration Successful!',
            `Please check your email (${sanitizedEmail}) for a verification link to activate your account. The link will expire in 24 hours.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('🚀 Navigating to login...');
                  router.replace('/(tabs)/login');
                }
              }
            ]
          );
        }
      } else {
        const errorMessage = regData.message || 'Failed to register';
        setRegistrationError(errorMessage);
        Alert.alert('Registration Failed', errorMessage);
      }
    } catch (error: any) {
      console.error('Register flow error:', error);
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Please check:\n\n1. Your internet connection\n2. Backend server is running on localhost:3000\n3. Server URL is correct in config',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to register: ' + errorMessage);
      }
      setIsLoading(false);
    }
  };



  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingTop: 20, paddingBottom: 150, paddingHorizontal: 20, alignItems: 'center' }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      <View style={{ width: '100%', maxWidth: 440 }} pointerEvents="box-none">
        {/* Title */}
        <Text style={styles.textTitle}>
          <Text style={styles.alertWelcome}>Alert</Text>
          <Text style={styles.davao}>Davao</Text>
        </Text>

        <Text style={styles.subheadingCenter}>Welcome to AlertDavao!</Text>
        <Text style={styles.normalTxtCentered}>
          Register and Create an Account
        </Text>

        {registrationError ? (
          <Text style={{ color: '#E63946', fontSize: 12, marginBottom: 15, paddingHorizontal: 10, textAlign: 'center' }}>
            {registrationError}
          </Text>
        ) : null}

        {/* Firstname */}
        <Text style={styles.subheading2}>Firstname <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          value={firstname}
          onChangeText={(text) => setFirstname(sanitizeText(text).replace(/[^a-zA-Z\s]/g, ''))}
          maxLength={50}
        />

        {/* Lastname */}
        <Text style={styles.subheading2}>Lastname <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your last name"
          value={lastname}
          onChangeText={(text) => setLastname(sanitizeText(text).replace(/[^a-zA-Z\s]/g, ''))}
          maxLength={50}
        />

        {/* Email */}
        <Text style={styles.subheading2}>Email <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => setEmail(sanitizeEmail(text))}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={100}
        />

        {/* Contact */}
        <Text style={styles.subheading2}>Contact Number <Text style={{ color: 'red' }}>*</Text></Text>
        <PhoneInput
          value={contact}
          onChangeText={setContact}
          placeholder="9XX XXX XXXX"
        />

        {/* Password */}
        <Text style={styles.subheading2}>Password <Text style={{ color: 'red' }}>*</Text></Text>
        <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
          Must be at least 6 characters long
        </Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              // Sanitize password - remove invisible characters
              const sanitized = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
              setPassword(sanitized);
              setPasswordMatchError("");
              // Check if passwords match when typing
              if (confirmpassword) {
                if (sanitized === confirmpassword) {
                  setPasswordsMatch(true);
                } else {
                  setPasswordsMatch(false);
                }
              }
            }}
            secureTextEntry={!showPassword}
            minLength={6}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 10,
              top: 13,
              paddingHorizontal: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: '#1D3557', fontWeight: '600' }}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        </View>

        {/* Confirm Password */}
        <Text style={styles.subheading2}>Confirm Password <Text style={{ color: 'red' }}>*</Text></Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Re-enter your password"
            value={confirmpassword}
            onChangeText={(text) => {
              // Sanitize confirm password - remove invisible characters
              const sanitized = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
              setConfirmPassword(sanitized);
              setPasswordMatchError("");
              // Check if passwords match when typing
              if (password) {
                if (sanitized === password) {
                  setPasswordsMatch(true);
                } else {
                  setPasswordsMatch(false);
                }
              }
            }}
            secureTextEntry={!showConfirmPassword}
          />
          <Pressable
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute',
              right: 10,
              top: 13,
              paddingHorizontal: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: '#1D3557', fontWeight: '600' }}>
              {showConfirmPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        </View>
        {confirmpassword ? (
          <View style={{ marginTop: -10, marginBottom: 15 }}>
            {passwordsMatch ? (
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '500' }}>
                ✓ Passwords match
              </Text>
            ) : (
              <Text style={{ color: '#E63946', fontSize: 12 }}>
                ✗ Passwords do not match
              </Text>
            )}
          </View>
        ) : null}

        {/* Checkbox with disclaimer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginTop: 10,
          }}
        >
          <Checkbox
            value={isChecked}
            onValueChange={setChecked}
            color={isChecked ? "#1D3557" : undefined}
          />
          <Text
            style={{
              fontSize: 12,
              color: "#555",
              marginLeft: 8,
              marginBottom: 15,
              flex: 1,
            }}
          >
            By clicking you agree to accept our{" "}
            <Text
              style={{ color: "#1D3557", fontWeight: "bold", textDecorationLine: "underline" }}
              onPress={() => setShowTermsModal(true)}
            >
              Terms & Conditions
            </Text>
            {", that you are over 18 and aware of our reporting policies!"}
          </Text>
        </View>

        {/* Terms and Conditions Modal */}
        <TermsAndConditionsModal
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />

        {/* Obfuscated text captcha */}
        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
            Security Check <Text style={{ color: 'red' }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CaptchaObfuscated word={captchaWord} />
            <Pressable
              onPress={() => {
                const newWord = generateCaptchaWord(6);
                setCaptchaWord(newWord);
                setCaptchaAnswer('');
                setCaptchaValid(false);
                console.log('🔄 Captcha refreshed:', newWord);
              }}
              style={{
                backgroundColor: '#3b82f6',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                height: 44,
                minWidth: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '600' }}>↻</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter the code above"
            value={captchaAnswer}
            onChangeText={text => {
              const limited = text.replace(/[^A-Z0-9]/gi, '').slice(0, 6);
              setCaptchaAnswer(limited);
              setCaptchaValid(limited.trim().toUpperCase() === captchaWord);
            }}
            autoCapitalize="characters"
            maxLength={6}
          />
        </View>



        <Button
          title="Register"
          onPress={handleRegister}
          disabled={!isChecked || !captchaValid}
          color={isChecked && captchaValid ? "#1D3557" : "#999"}
        />

        {/* Link for users who already have an account */}
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#555' }}>I already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/login')}>
            <Text style={{ color: '#1D3557', fontWeight: 'bold', textDecorationLine: 'underline' }}>
              Login here
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default Register;