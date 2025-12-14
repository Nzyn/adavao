import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = "9XX XXX XXXX",
  error
}) => {
  return (
    <View style={styles.container}>
      <Text style={localStyles.label}>Mobile Number <Text style={{ color: 'red' }}>*</Text></Text>
      <View style={localStyles.inputContainer}>
        <View style={localStyles.prefixContainer}>
          <Text style={localStyles.prefixText}>+63</Text>
        </View>
        <TextInput
          style={localStyles.input}
          value={value}
          onChangeText={(text) => {
            // Allow only numbers and limit length
            const numeric = text.replace(/[^0-9]/g, '');
            if (numeric.length <= 10) {
              onChangeText(numeric);
            }
          }}
          placeholder={placeholder}
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>
      {error ? <Text style={localStyles.errorText}>{error}</Text> : null}
    </View>
  );
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Must be 10 digits and start with 9
  return phone.length === 10 && phone.startsWith('9');
};

const localStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    alignSelf: 'flex-start'
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
  },
  prefixContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  prefixText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff'
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  }
});

const styles = { container: {} }; // Dummy for compatibility if needed
