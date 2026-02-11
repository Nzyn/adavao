import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  title?: string;
  message: string;
  okText?: string;
  onOk: () => void;
}

export default function UpdateSuccessDialog({
  visible,
  title = 'Success',
  message,
  okText = 'OK',
  onOk,
}: Props) {
  const [displayMessage, setDisplayMessage] = useState(message);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Check if there's a custom message stored globally (for report submission)
      const customMsg = (global as any).successMessage;
      if (customMsg) {
        setDisplayMessage(customMsg);
        // Clear it after use
        (global as any).successMessage = null;
      } else {
        setDisplayMessage(message);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when hidden
      slideAnim.setValue(50);
      fadeAnim.setValue(0);
    }
  }, [visible, message]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.card,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{displayMessage}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.okButton} onPress={onOk} activeOpacity={0.8}>
              <Text style={styles.okText}>{okText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#222',
  },
  message: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
    marginTop: 16,
  },
  okButton: {
    minWidth: 120,
    backgroundColor: '#1D3557',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  okText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
