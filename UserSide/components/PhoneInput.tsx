import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = "Enter mobile number",
  style
}) => {
  const [focused, setFocused] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Handle different input formats
    let formatted = cleaned;
    
    // If starts with 63, keep it
    if (cleaned.startsWith('63')) {
      formatted = cleaned;
    }
    // If starts with 0, replace with 63
    else if (cleaned.startsWith('0')) {
      formatted = '63' + cleaned.substring(1);
    }
    // If starts with 9 (user might skip the 0), add 63
    else if (cleaned.startsWith('9')) {
      formatted = '63' + cleaned;
    }
    
    // Limit to 12 digits (63 + 10 digits)
    formatted = formatted.substring(0, 12);
    
    return formatted;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText('+' + formatted);
  };

  const displayValue = value.startsWith('+') ? value : '+' + value;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>🇵🇭 +63</Text>
        <TextInput
          style={[styles.input, focused && styles.inputFocused]}
          value={displayValue.replace('+63', '')}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <Text style={styles.hint}>Format: 9XX XXX XXXX (10 digits)</Text>
    </View>
  );
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Remove + and spaces
  const cleaned = phone.replace(/[\s+]/g, '');
  
  // Should be 12 digits starting with 63
  if (!/^63\d{10}$/.test(cleaned)) {
    return false;
  }
  
  // Philippine mobile numbers start with 63 + 9
  if (!cleaned.startsWith('639')) {
    return false;
  }
  
  return true;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  prefix: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  inputFocused: {
    borderColor: '#1D3557',
  },
  hint: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
});
