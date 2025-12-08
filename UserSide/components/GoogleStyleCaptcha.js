import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

// Static distorted text rendering (no movement on input)
function getDistortedText(word) {
  // Use fixed random transforms for each character
  const transforms = [-12, 8, -6, 14, -10, 6];
  return word.split('').map((char, i) => (
    <Text
      key={i}
      style={[styles.captchaChar, { transform: [{ rotate: `${transforms[i % transforms.length]}deg` }] }]}
    >
      {char}
    </Text>
  ));
}

export default function GoogleStyleCaptcha({ onCaptchaVerified }) {
  const [checked, setChecked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [input, setInput] = useState('');
  const [captchaWord, setCaptchaWord] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    setCaptchaWord(generateCaptchaWord(6));
  }, []);

  function generateCaptchaWord(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let word = '';
    for (let i = 0; i < length; i++) {
      word += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return word;
  }

  const handleCheckbox = () => {
    if (!checked) {
      setChecked(true);
      setModalVisible(true);
    }
  };

  const handleVerify = () => {
    if (input.trim().toUpperCase() === captchaWord.toUpperCase()) {
      setModalVisible(false);
      setError('');
      setIsVerified(true);
      if (onCaptchaVerified) onCaptchaVerified(true);
    } else {
      setError('Incorrect, try again.');
    }
  };

  const handleRefresh = () => {
    setCaptchaWord(generateCaptchaWord(6));
    setInput('');
    setError('');
    setIsVerified(false);
    if (onCaptchaVerified) onCaptchaVerified(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.checkboxRow} onPress={handleCheckbox} activeOpacity={0.8}>
        <View style={[styles.checkbox, checked && styles.checkedBox]}>
          {checked && <MaterialIcons name="check" size={18} color="#4285F4" />}
        </View>
        <Text style={styles.label}>I'm not a robot</Text>
        <Image source={{ uri: 'https://www.gstatic.com/recaptcha/api2/logo_48.png' }} style={styles.logo} />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Type everything you see</Text>
            <View style={styles.captchaImgBox}>
              <View style={styles.captchaImg}>
                {getDistortedText(captchaWord)}
              </View>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}><MaterialIcons name="refresh" size={24} color="#555" /></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}><FontAwesome name="volume-up" size={22} color="#555" /></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}><MaterialIcons name="help-outline" size={24} color="#555" /></TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Type the text"
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              textAlign="center"
              maxLength={6}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} activeOpacity={0.85}>
              <Text style={styles.verifyText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginVertical: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    elevation: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#bbb',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkedBox: {
    borderColor: '#4285F4',
  },
  label: {
    fontSize: 16,
    color: '#222',
    marginRight: 10,
  },
  logo: {
    width: 24,
    height: 24,
    marginLeft: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: 320,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 15,
    marginBottom: 8,
    color: '#222',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  captchaImgBox: {
    backgroundColor: '#f7f7f7',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    minWidth: 200,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  captchaImg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captchaChar: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 3,
    color: '#222',
    textShadowColor: '#bbb',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    opacity: 0.95,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 18,
  },
  iconBtn: {
    marginHorizontal: 8,
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    padding: 8,
    width: '100%',
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    letterSpacing: 2,
  },
  verifyBtn: {
    backgroundColor: '#4285F4',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 6,
    alignSelf: 'center',
    elevation: 1,
  },
  verifyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  error: {
    color: '#d00',
    marginBottom: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});
