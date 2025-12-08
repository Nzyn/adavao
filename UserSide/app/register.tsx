import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet
} from "react-native";
import Checkbox from "expo-checkbox";
import CaptchaObfuscated, { generateCaptchaWord } from '../components/CaptchaObfuscated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOptimalBackendUrl } from '../config/backend';
import { useLoading } from '../contexts/LoadingContext';
// import { sendSupabaseOtp, verifySupabaseOtp, normalizePhoneNumber } from '../services/supabaseOtp';
const normalizePhoneNumber = (phone: string) => phone.replace(/\D/g, ''); // Simple normalization
import { useUser } from '../contexts/UserContext';
import { 
  validateName, 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  validatePasswordMatch, 
  sanitizeTextInput,
  sanitizeEmail,
  sanitizePhone
} from '../utils/inputSanitizer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

const Register = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [contact, setContact] = useState("");
  
  // Validation states for real-time feedback
  const [validation, setValidation] = useState({
    firstname: { touched: false, valid: false, error: '' },
    lastname: { touched: false, valid: false, error: '' },
    email: { touched: false, valid: false, error: '' },
    contact: { touched: false, valid: false, error: '' },
    password: { touched: false, valid: false, error: '' },
    confirmpassword: { touched: false, valid: false, error: '' },
  });
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaWord, setCaptchaWord] = useState(() => generateCaptchaWord(6));
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isChecked, setChecked] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const { showLoading, hideLoading } = useLoading();
  const { setUser } = useUser();
  const router = useRouter();
  
  // Validation helper functions
  const validateField = useCallback((field: string, value: string) => {
    let result = { valid: false, error: '' };
    
    switch(field) {
      case 'firstname':
      case 'lastname':
        const nameResult = validateName(sanitizeTextInput(value));
        result = { valid: nameResult.valid, error: nameResult.error || '' };
        break;
      case 'email':
        const emailResult = validateEmail(sanitizeEmail(value));
        result = { valid: emailResult.valid, error: emailResult.error || '' };
        break;
      case 'contact':
        const phoneResult = validatePhone(sanitizePhone(value));
        result = { valid: phoneResult.valid, error: phoneResult.error || '' };
        break;
      case 'password':
        const passResult = validatePassword(value);
        result = { valid: passResult.valid, error: passResult.error || '' };
        break;
      case 'confirmpassword':
        const matchResult = validatePasswordMatch(password, value);
        result = { valid: matchResult.valid, error: matchResult.error || '' };
        break;
    }
    
    setValidation(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev], valid: result.valid, error: result.error }
    }));
    
    return result;
  }, [password]);
  
  const handleFieldBlur = (field: string) => {
    setValidation(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev], touched: true }
    }));
  };
  
  // Check if form is complete
  const isFormComplete = 
    validation.firstname.valid &&
    validation.lastname.valid &&
    validation.email.valid &&
    validation.contact.valid &&
    validation.password.valid &&
    validation.confirmpassword.valid &&
    captchaValid &&
    isChecked;

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.log("Error checking login status:", error);
      }
    };
    checkLoggedIn();
  }, []);
  
  // Re-validate confirm password when password changes
  useEffect(() => {
    if (validation.confirmpassword.touched && confirmpassword) {
      validateField('confirmpassword', confirmpassword);
    }
  }, [password]);

  const handleRegister = async () => {
    try {
      // Sanitize all inputs
      const sanitizedFirstname = sanitizeTextInput(firstname);
      const sanitizedLastname = sanitizeTextInput(lastname);
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedContact = sanitizePhone(contact);

      // Validate terms
      if (!isChecked) {
        Alert.alert('❌ Error', 'You must accept the Terms & Conditions before registering.');
        return;
      }

      // Validate all fields
      const validations = [
        { field: 'firstname', result: validateName(sanitizedFirstname) },
        { field: 'lastname', result: validateName(sanitizedLastname) },
        { field: 'email', result: validateEmail(sanitizedEmail) },
        { field: 'contact', result: validatePhone(sanitizedContact) },
        { field: 'password', result: validatePassword(password) },
        { field: 'confirmpassword', result: validatePasswordMatch(password, confirmpassword) },
      ];
      
      for (const { field, result } of validations) {
        if (!result.valid) {
          Alert.alert('❌ Validation Error', result.error || `Invalid ${field}`);
          return;
        }
      }

      if (!captchaValid) {
        Alert.alert('❌ Captcha Required', 'Please type the word shown in the captcha correctly.');
        return;
      }

      console.log('✅ All validations passed, skipping OTP for now...');
      showLoading('Creating account...');

      const normalizedPhone = normalizePhoneNumber(sanitizedContact);
      console.log('📱 Registering with phone:', normalizedPhone);
      
      // Skip OTP - use direct registration endpoint (no OTP/email verification required)
      try {
        const response = await fetch(`${await getOptimalBackendUrl()}/register-direct`, {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ 
            firstname: sanitizedFirstname, 
            lastname: sanitizedLastname, 
            email: sanitizedEmail, 
            contact: normalizedPhone, 
            password
          })
        });
        const data = await response.json();
        console.log('📥 Registration response:', data);
        
        hideLoading();
        
        if (response.ok) {
          // Registration successful - now auto-login the user
          const user = data.user || data;
          
          console.log('✅ Registration successful, auto-logging in user:', user.email);
          console.log('📦 User data received:', user);
          
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
            '✅ Registration Successful',
            'Your account has been created and you are now logged in!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Redirect to main app
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        } else {
          Alert.alert('❌ Registration Failed', data.message || 'Unable to create account');
        }
      } catch (err) {
        console.error('❌ Registration error:', err);
        Alert.alert('❌ Error', 'An error occurred during registration');
        hideLoading();
      }
    } catch (err) {
      console.error('❌ Register error:', err);
      Alert.alert('❌ Error', 'An error occurred. Please try again.');
      hideLoading();
    }
  };

  const submitOtpAndRegister = async (code: string) => {
    if (!code || code.length !== 6) {
      return; // Wait for complete code
    }

    showLoading('Verifying OTP...');
    console.log('🔐 Verifying OTP for phone:', contact);
    try {
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(contact);
      
      // Verify OTP via Supabase
      // const result = await verifySupabaseOtp(normalizedPhone, code);
      const result = { success: true, message: 'OTP verified' }; // Fallback for demo
      
      if (!result.success) {
        hideLoading();
        Alert.alert('Invalid OTP', result.message);
        setOtpCode('');
        return;
      }

      console.log('✅ OTP verified, proceeding with registration...');
      hideLoading();
      showLoading('Creating account...');
      
      // Now call backend to create account (phone already verified)
      const response = await fetch(`${await getOptimalBackendUrl()}/register`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ 
          firstname, 
          lastname, 
          email, 
          contact: normalizedPhone, 
          password,
          phone_verified: true // Flag that phone is verified
        })
      });
      const data = await response.json();
      console.log('📥 Registration response:', data);
      
      hideLoading();
      
      if (response.ok) {
        // Clean up state
        setShowOtpModal(false);
        setOtpCode('');
        
        Alert.alert(
          'Account Created',
          'Your account has been created successfully. You can now log in.',
          [{ 
            text: 'OK', 
            onPress: () => {
              console.log('🚀 Navigating to login...');
              router.replace('/(tabs)/login');
            }
          }]
        );
      } else {
        Alert.alert('Registration failed', data.message || 'Failed to register');
        setOtpCode('');
      }
    } catch (err) {
      console.error('❌ submitOtpAndRegister error:', err);
      Alert.alert('Error', 'Failed to verify OTP or register. Please try again.');
      setOtpCode('');
      hideLoading();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) {
      Alert.alert('Please Wait', `You can resend OTP in ${resendCountdown} seconds`);
      return;
    }

    showLoading('Resending OTP...');
    try {
      // const normalizedPhone = normalizePhoneNumber(contact);
      // const result = await sendSupabaseOtp(normalizedPhone);
      const result = { success: true, message: 'OTP sent' }; // Fallback for demo
      
      hideLoading();
      
      if (!result.success) {
        Alert.alert('Error', result.message);
        return;
      }

      // Reset countdown
      setCanResend(false);
      setResendCountdown(60);
      
      const timer = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      Alert.alert('OTP Resent', 'A new verification code has been sent to your phone.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      Alert.alert('Error', 'Failed to resend OTP');
      hideLoading();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={localStyles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={localStyles.container}
        contentContainerStyle={localStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={localStyles.formContainer}>
          {/* Title */}
          <Text style={localStyles.title}>
            <Text style={localStyles.alertText}>Alert</Text>
            <Text style={localStyles.davaoText}>Davao</Text>
          </Text>

          <Text style={localStyles.subtitle}>Welcome to AlertDavao!</Text>
          <Text style={localStyles.description}>Register and Create an Account</Text>

          {/* Name Fields Row */}
          <View style={localStyles.nameRow}>
            {/* Firstname */}
            <View style={localStyles.nameField}>
              <Text style={localStyles.label}>First Name <Text style={localStyles.required}>*</Text></Text>
              <View style={localStyles.inputWrapper}>
                <TextInput
                  style={[
                    localStyles.input,
                    validation.firstname.touched && (validation.firstname.valid ? localStyles.inputValid : localStyles.inputError)
                  ]}
                  placeholder="e.g., Juan"
                  placeholderTextColor="#9ca3af"
                  value={firstname}
                  onChangeText={(text) => {
                    try {
                      const sanitized = sanitizeTextInput(text);
                      setFirstname(sanitized);
                      validateField('firstname', sanitized);
                    } catch (error) {
                      console.error('Error processing firstname:', error);
                    }
                  }}
                  onBlur={() => handleFieldBlur('firstname')}
                  autoCapitalize="words"
                  maxLength={50}
                />
                {validation.firstname.touched && (
                  <Text style={[localStyles.statusIcon, { color: validation.firstname.valid ? '#22c55e' : '#ef4444' }]}>
                    {validation.firstname.valid ? '✓' : '✗'}
                  </Text>
                )}
              </View>
              {validation.firstname.touched && !validation.firstname.valid && (
                <Text style={localStyles.errorText}>{validation.firstname.error}</Text>
              )}
              <Text style={localStyles.hint}>Letters only, 2-50 chars</Text>
            </View>

            {/* Lastname */}
            <View style={localStyles.nameField}>
              <Text style={localStyles.label}>Last Name <Text style={localStyles.required}>*</Text></Text>
              <View style={localStyles.inputWrapper}>
                <TextInput
                  style={[
                    localStyles.input,
                    validation.lastname.touched && (validation.lastname.valid ? localStyles.inputValid : localStyles.inputError)
                  ]}
                  placeholder="e.g., Dela Cruz"
                  placeholderTextColor="#9ca3af"
                  value={lastname}
                  onChangeText={(text) => {
                    try {
                      const sanitized = sanitizeTextInput(text);
                      setLastname(sanitized);
                      validateField('lastname', sanitized);
                    } catch (error) {
                      console.error('Error processing lastname:', error);
                    }
                  }}
                  onBlur={() => handleFieldBlur('lastname')}
                  autoCapitalize="words"
                  maxLength={50}
                />
                {validation.lastname.touched && (
                  <Text style={[localStyles.statusIcon, { color: validation.lastname.valid ? '#22c55e' : '#ef4444' }]}>
                    {validation.lastname.valid ? '✓' : '✗'}
                  </Text>
                )}
              </View>
              {validation.lastname.touched && !validation.lastname.valid && (
                <Text style={localStyles.errorText}>{validation.lastname.error}</Text>
              )}
              <Text style={localStyles.hint}>Letters only, 2-50 chars</Text>
            </View>
          </View>

          {/* Email */}
          <View style={localStyles.fieldContainer}>
            <Text style={localStyles.label}>Email Address <Text style={localStyles.required}>*</Text></Text>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={[
                  localStyles.input,
                  validation.email.touched && (validation.email.valid ? localStyles.inputValid : localStyles.inputError)
                ]}
                placeholder="your.email@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => {
                  try {
                    const sanitized = sanitizeEmail(text);
                    setEmail(sanitized);
                    validateField('email', sanitized);
                  } catch (error) {
                    console.error('Error processing email:', error);
                  }
                }}
                onBlur={() => handleFieldBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                maxLength={100}
              />
              {validation.email.touched && (
                <Text style={[localStyles.statusIcon, { color: validation.email.valid ? '#22c55e' : '#ef4444' }]}>
                  {validation.email.valid ? '✓' : '✗'}
                </Text>
              )}
            </View>
            {validation.email.touched && !validation.email.valid && (
              <Text style={localStyles.errorText}>{validation.email.error}</Text>
            )}
            <Text style={localStyles.hint}>Valid email with @ and domain</Text>
          </View>

          {/* Contact Number */}
          <View style={localStyles.fieldContainer}>
            <Text style={localStyles.label}>Contact Number <Text style={localStyles.required}>*</Text></Text>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={[
                  localStyles.input,
                  validation.contact.touched && (validation.contact.valid ? localStyles.inputValid : localStyles.inputError)
                ]}
                placeholder="09XX XXX XXXX"
                placeholderTextColor="#9ca3af"
                value={contact}
                onChangeText={(text) => {
                  try {
                    const sanitized = sanitizePhone(text);
                    setContact(sanitized);
                    validateField('contact', sanitized);
                  } catch (error) {
                    console.error('Error processing contact:', error);
                  }
                }}
                onBlur={() => handleFieldBlur('contact')}
                keyboardType="phone-pad"
                maxLength={20}
              />
              {validation.contact.touched && (
                <Text style={[localStyles.statusIcon, { color: validation.contact.valid ? '#22c55e' : '#ef4444' }]}>
                  {validation.contact.valid ? '✓' : '✗'}
                </Text>
              )}
            </View>
            {validation.contact.touched && !validation.contact.valid && (
              <Text style={localStyles.errorText}>{validation.contact.error}</Text>
            )}
            <Text style={localStyles.hint}>Philippine mobile: 09XX or +639XX</Text>
          </View>

          {/* Password */}
          <View style={localStyles.fieldContainer}>
            <Text style={localStyles.label}>Password <Text style={localStyles.required}>*</Text></Text>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={[
                  localStyles.input,
                  localStyles.passwordInput,
                  validation.password.touched && (validation.password.valid ? localStyles.inputValid : localStyles.inputError)
                ]}
                placeholder="Create a strong password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => {
                  try {
                    setPassword(text);
                    validateField('password', text);
                  } catch (error) {
                    console.error('Error processing password:', error);
                  }
                }}
                onBlur={() => handleFieldBlur('password')}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={localStyles.toggleButton}
              >
                <Text style={localStyles.toggleText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
              </Pressable>
            </View>
            {validation.password.touched && !validation.password.valid && (
              <Text style={localStyles.errorText}>{validation.password.error}</Text>
            )}
            <Text style={localStyles.hint}>Min 8 chars: letter + number + symbol (@$!%*?&)</Text>
            
            {/* Password Strength Indicator */}
            {password && (
              <View style={localStyles.strengthContainer}>
                <View style={localStyles.strengthBars}>
                  {[0, 1, 2, 3, 4].map((i) => {
                    let strength = 0;
                    if (password.length >= 8) strength++;
                    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
                    if (/\d/.test(password)) strength++;
                    if (/[@$!%*?&]/.test(password)) strength++;
                    if (password.length >= 12) strength++;
                    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
                    return (
                      <View
                        key={i}
                        style={[
                          localStyles.strengthBar,
                          { backgroundColor: i < strength ? colors[strength - 1] : '#e5e7eb' }
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={localStyles.fieldContainer}>
            <Text style={localStyles.label}>Confirm Password <Text style={localStyles.required}>*</Text></Text>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={[
                  localStyles.input,
                  localStyles.passwordInput,
                  validation.confirmpassword.touched && (validation.confirmpassword.valid ? localStyles.inputValid : localStyles.inputError)
                ]}
                placeholder="Re-enter your password"
                placeholderTextColor="#9ca3af"
                value={confirmpassword}
                onChangeText={(text) => {
                  try {
                    setConfirmPassword(text);
                    validateField('confirmpassword', text);
                  } catch (error) {
                    console.error('Error processing confirm password:', error);
                  }
                }}
                onBlur={() => handleFieldBlur('confirmpassword')}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={localStyles.toggleButton}
              >
                <Text style={localStyles.toggleText}>{showConfirmPassword ? 'HIDE' : 'SHOW'}</Text>
              </Pressable>
            </View>
            {validation.confirmpassword.touched && !validation.confirmpassword.valid && (
              <Text style={localStyles.errorText}>{validation.confirmpassword.error}</Text>
            )}
          </View>

          {/* Terms Checkbox */}
          <View style={localStyles.checkboxContainer}>
            <Checkbox
              value={isChecked}
              onValueChange={setChecked}
              color={isChecked ? "#1D3557" : undefined}
              style={localStyles.checkbox}
            />
            <Text style={localStyles.checkboxText}>
              By checking this box, you agree to our{" "}
              <Text style={localStyles.termsLink}>Terms & Conditions</Text>
              {"\n"}and confirm you are over 18 years old.
            </Text>
          </View>

          {/* Captcha */}
          <View style={localStyles.captchaSection}>
            <Text style={localStyles.label}>Security Verification</Text>
            <View style={localStyles.captchaRow}>
              <View style={localStyles.captchaDisplay}>
                <CaptchaObfuscated word={captchaWord} />
              </View>
              <Pressable
                onPress={() => {
                  const newWord = generateCaptchaWord(6);
                  setCaptchaWord(newWord);
                  setCaptchaAnswer('');
                  setCaptchaValid(false);
                }}
                style={localStyles.refreshButton}
              >
                <Text style={localStyles.refreshIcon}>↻</Text>
              </Pressable>
            </View>
            <TextInput
              style={[
                localStyles.input,
                captchaAnswer && (captchaValid ? localStyles.inputValid : localStyles.inputError)
              ]}
              placeholder="Enter the code above"
              placeholderTextColor="#9ca3af"
              value={captchaAnswer}
              onChangeText={text => {
                const limited = text.replace(/[^A-Z0-9]/gi, '').slice(0, 6);
                setCaptchaAnswer(limited);
                setCaptchaValid(limited.toUpperCase() === captchaWord.toUpperCase());
              }}
              autoCapitalize="characters"
              maxLength={6}
            />
            {captchaAnswer && (
              <Text style={[localStyles.captchaStatus, { color: captchaValid ? '#22c55e' : '#ef4444' }]}>
                {captchaValid ? '✓ Correct' : '✗ Incorrect code'}
              </Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              localStyles.registerButton,
              !isFormComplete && localStyles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={!isFormComplete}
          >
            <Text style={localStyles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={localStyles.loginLinkContainer}>
            <Text style={localStyles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/login')}>
              <Text style={localStyles.loginLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Modal - DISABLED FOR NOW */}
        <Modal visible={false} animationType="slide" transparent={true}>
          <View style={localStyles.modalOverlay}>
            <View style={localStyles.modalContent}>
              <Text style={localStyles.modalTitle}>Verify Your Phone</Text>
              <Text style={localStyles.modalSubtitle}>Enter the 6-digit code sent to</Text>
              <Text style={localStyles.modalPhone}>{contact}</Text>
              
              <TextInput
                style={localStyles.otpInput}
                placeholder="000000"
                placeholderTextColor="#ccc"
                value={otpCode}
                onChangeText={async (code) => {
                  setOtpCode(code);
                  if (code.length === 6) {
                    await submitOtpAndRegister(code);
                  }
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />
              
              <View style={localStyles.resendSection}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={localStyles.resendButton}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={localStyles.resendCountdown}>
                    Resend OTP in {resendCountdown}s
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpCode('');
                }}
                style={localStyles.cancelButton}
              >
                <Text style={localStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Responsive styles for universal phone screen compatibility
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
    paddingBottom: 50,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
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
  nameRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: 12,
    marginBottom: 8,
  },
  nameField: {
    flex: isSmallScreen ? undefined : 1,
    marginBottom: isSmallScreen ? 8 : 0,
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
  required: {
    color: '#ef4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
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
  statusIcon: {
    position: 'absolute',
    right: 12,
    fontSize: 16,
    fontWeight: '700',
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
  hint: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 8,
  },
  checkbox: {
    marginTop: 2,
    marginRight: 10,
  },
  checkboxText: {
    flex: 1,
    fontSize: isSmallScreen ? 11 : 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  termsLink: {
    color: '#1D3557',
    fontWeight: '600',
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  captchaStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#1D3557',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  loginLinkText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#1D3557',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  modalPhone: {
    fontSize: 15,
    color: '#1D3557',
    fontWeight: '600',
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 10,
    fontWeight: '700',
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resendButton: {
    color: '#1D3557',
    fontWeight: '600',
    fontSize: 14,
  },
  resendCountdown: {
    color: '#6b7280',
    fontSize: 13,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Register;