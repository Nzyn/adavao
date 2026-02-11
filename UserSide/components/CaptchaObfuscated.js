
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

function randomWord(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let word = '';
  for (let i = 0; i < length; i++) {
    word += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return word;
}

export default function CaptchaObfuscated({ word }) {
  const captchaWord = useMemo(() => word || randomWord(6), [word]);

  return (
    <View style={styles.container}>
      {captchaWord.split('').map((char, idx) => (
        <View key={idx} style={styles.charBox}>
          <Text style={styles.charText}>{char}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
  },
  charBox: {
    width: 36,
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0,
  },
});

export function generateCaptchaWord(length = 5) {
  return randomWord(length);
}
