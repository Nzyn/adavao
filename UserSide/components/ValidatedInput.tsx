/**
 * ValidatedInput Component
 * Input field with real-time validation and visual feedback
 * Shows validation status while user is typing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Pressable } from 'react-native';

// Validation result type
interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

// Validator function type
type ValidatorFn = (value: string) => ValidationResult;

// Component props
interface ValidatedInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string, sanitized: string, isValid: boolean) => void;
  validator?: ValidatorFn;
  sanitizer?: (value: string) => string;
  hint?: string;
  showPasswordToggle?: boolean;
  required?: boolean;
  containerStyle?: object;
}

// Sanitization functions
const sanitizers = {
  // Sanitize name (letters, spaces, hyphens, apostrophes only)
  name: (text: string): string => {
    return text
      .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
      .slice(0, 50);
  },
  
  // Sanitize email
  email: (text: string): string => {
    return text.trim().toLowerCase().slice(0, 100);
  },
  
  // Sanitize phone (digits, +, -, spaces, parentheses)
  phone: (text: string): string => {
    return text.replace(/[^0-9\+\-\s()]/g, '').slice(0, 20);
  },
  
  // No sanitization (for passwords - validate but don't modify)
  none: (text: string): string => text,
  
  // General text (remove dangerous characters)
  text: (text: string): string => {
    return text
      .replace(/[<>{}]/g, '')
      .slice(0, 500);
  },
  
  // Alphanumeric only
  alphanumeric: (text: string): string => {
    return text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 100);
  },
};

// Validation functions
const validators = {
  // Validate name (2-50 chars, letters only)
  name: (value: string): ValidationResult => {
    const sanitized = sanitizers.name(value);
    
    if (!sanitized || sanitized.length < 2) {
      return {
        valid: false,
        sanitized,
        error: 'Must be 2-50 characters',
      };
    }
    
    if (!/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(sanitized)) {
      return {
        valid: false,
        sanitized,
        error: 'Letters, spaces, hyphens, apostrophes only',
      };
    }
    
    return { valid: true, sanitized };
  },
  
  // Validate email
  email: (value: string): ValidationResult => {
    const sanitized = sanitizers.email(value);
    
    if (!sanitized) {
      return { valid: false, sanitized, error: 'Email is required' };
    }
    
    if (!sanitized.includes('@')) {
      return { valid: false, sanitized, error: 'Must contain @' };
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      return { valid: false, sanitized, error: 'Invalid email format' };
    }
    
    return { valid: true, sanitized };
  },
  
  // Validate phone (Philippine format)
  phone: (value: string): ValidationResult => {
    const sanitized = sanitizers.phone(value);
    
    if (!sanitized || sanitized.length < 7) {
      return { valid: false, sanitized, error: 'Must be 7-20 digits' };
    }
    
    // Remove non-digit characters for validation
    const digitsOnly = sanitized.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 12) {
      return { valid: false, sanitized, error: 'Invalid phone number length' };
    }
    
    return { valid: true, sanitized };
  },
  
  // Validate password
  password: (value: string): ValidationResult => {
    if (!value) {
      return { valid: false, error: 'Password is required' };
    }
    
    if (value.length < 8) {
      return { valid: false, error: 'Min 8 characters' };
    }
    
    if (!/[a-zA-Z]/.test(value)) {
      return { valid: false, error: 'Needs at least one letter' };
    }
    
    if (!/\d/.test(value)) {
      return { valid: false, error: 'Needs at least one number' };
    }
    
    if (!/[@$!%*?&]/.test(value)) {
      return { valid: false, error: 'Needs a symbol (@$!%*?&)' };
    }
    
    return { valid: true };
  },
  
  // Required field validation
  required: (value: string): ValidationResult => {
    if (!value || !value.trim()) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, sanitized: value.trim() };
  },
};

// Password strength indicator component
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    if (password.length >= 12) strength++;
    return strength;
  };
  
  const strength = getStrength();
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  
  if (!password) return null;
  
  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i < strength ? colors[strength - 1] : '#e5e7eb' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthText, { color: colors[Math.max(0, strength - 1)] }]}>
        {labels[Math.max(0, strength - 1)]}
      </Text>
    </View>
  );
};

// Main ValidatedInput component
const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChangeText,
  validator,
  sanitizer = sanitizers.none,
  hint,
  showPasswordToggle = false,
  required = false,
  containerStyle,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ valid: true });
  
  // Validate on value change
  useEffect(() => {
    if (touched && value) {
      const sanitized = sanitizer(value);
      let result: ValidationResult = { valid: true, sanitized };
      
      if (validator) {
        result = validator(value);
      } else if (required && !sanitized) {
        result = { valid: false, sanitized, error: 'This field is required' };
      }
      
      setValidationResult(result);
    }
  }, [value, touched, validator, sanitizer, required]);
  
  // Handle text change
  const handleChangeText = (text: string) => {
    const sanitized = sanitizer(text);
    const result = validator ? validator(text) : { valid: true, sanitized };
    onChangeText(text, sanitized, result.valid);
  };
  
  // Determine border color based on validation state
  const getBorderColor = () => {
    if (!touched) return isFocused ? '#3b82f6' : '#d1d5db';
    if (!value && required) return '#ef4444';
    if (validationResult.valid) return '#22c55e';
    return '#ef4444';
  };
  
  // Determine if we should show password
  const isSecure = secureTextEntry && !showPassword;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label with required indicator */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {touched && value && (
          <Text style={[
            styles.validationIcon,
            { color: validationResult.valid ? '#22c55e' : '#ef4444' }
          ]}>
            {validationResult.valid ? '✓' : '✗'}
          </Text>
        )}
      </View>
      
      {/* Input field */}
      <View style={[
        styles.inputContainer,
        { borderColor: getBorderColor() },
        isFocused && styles.inputFocused,
      ]}>
        <TextInput
          {...props}
          style={[styles.input, showPasswordToggle && { paddingRight: 60 }]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setTouched(true);
          }}
          secureTextEntry={isSecure}
          placeholderTextColor="#9ca3af"
        />
        
        {/* Password toggle button */}
        {showPasswordToggle && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </Pressable>
        )}
      </View>
      
      {/* Password strength indicator */}
      {showPasswordToggle && secureTextEntry && (
        <PasswordStrengthIndicator password={value} />
      )}
      
      {/* Error message or hint */}
      {touched && !validationResult.valid && validationResult.error ? (
        <Text style={styles.errorText}>⚠️ {validationResult.error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  validationIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputFocused: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D3557',
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ValidatedInput;
export { validators, sanitizers, ValidationResult, ValidatorFn };
