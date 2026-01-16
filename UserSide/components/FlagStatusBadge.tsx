import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FlagCountdown from './FlagCountdown';

interface FlagData {
  totalFlags: number;
  restrictionLevel: string | null;
  message?: string;
  expiresAt?: string | null;
}

interface FlagStatusBadgeProps {
  flagData: FlagData | null;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const FlagStatusBadge: React.FC<FlagStatusBadgeProps> = ({
  flagData,
  onPress,
  size = 'medium',
  showLabel = true
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!flagData || flagData.totalFlags === 0) {
    return null;
  }

  const getRestrictionColor = (restriction: string | null) => {
    switch (restriction?.toLowerCase()) {
      case 'warning':
        return '#f59e0b'; // Amber
      case 'suspended':
        return '#ef4444'; // Red
      case 'banned':
        return '#7c3aed'; // Violet
      default:
        return '#dc2626'; // Red
    }
  };

  const getRestrictionIcon = (restriction: string | null) => {
    switch (restriction?.toLowerCase()) {
      case 'warning':
        return 'alert-circle';
      case 'suspended':
        return 'hand-left';
      case 'banned':
        return 'close-circle';
      default:
        return 'flag';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: 11 };
      case 'large':
        return { width: 48, height: 48, fontSize: 14 };
      default:
        return { width: 40, height: 40, fontSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();
  const restrictionColor = getRestrictionColor(flagData.restrictionLevel);

  return (
    <>
      <Pressable
        style={[
          styles.badgeContainer,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            backgroundColor: restrictionColor,
          }
        ]}
        onPress={() => {
          onPress?.();
          setShowDetails(true);
        }}
      >
        <View style={styles.badgeContent}>
          <Ionicons
            name={getRestrictionIcon(flagData.restrictionLevel) as any}
            size={sizeStyles.fontSize + 4}
            color="#fff"
          />
          {size !== 'small' && flagData.totalFlags > 0 && (
            <Text style={[styles.flagCount, { fontSize: sizeStyles.fontSize }]}>
              {flagData.totalFlags}
            </Text>
          )}
        </View>
      </Pressable>

      {showLabel && size !== 'small' && (
        <Text style={[styles.label, { fontSize: sizeStyles.fontSize - 2 }]}>
          {flagData.totalFlags} Flag{flagData.totalFlags !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Flag Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Status</Text>
              <Pressable onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#1D3557" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.statusCard, { borderLeftColor: restrictionColor }]}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Flags:</Text>
                  <Text style={styles.statusValue}>{flagData.totalFlags}</Text>
                </View>

                {flagData.restrictionLevel && flagData.restrictionLevel !== 'none' && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Restriction:</Text>
                      <Text
                        style={[
                          styles.statusValue,
                          { color: restrictionColor, fontWeight: 'bold' }
                        ]}
                      >
                        {flagData.restrictionLevel.toUpperCase()}
                      </Text>
                    </View>
                  </>
                )}

                {flagData.message && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.messageContainer}>
                      <Text style={styles.messageLabel}>Details:</Text>
                      <Text style={styles.messageText}>{flagData.message}</Text>
                    </View>
                  </>
                )}

                {/* Countdown Timer */}
                {flagData.expiresAt && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.messageContainer}>
                      <FlagCountdown expiresAt={flagData.expiresAt} />
                    </View>
                  </>
                )}
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#0ea5e9" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.infoTitle}>What does this mean?</Text>
                  <Text style={styles.infoText}>
                    Your account has been flagged for violating community guidelines.
                    Restrictions may limit your ability to report incidents or use certain features.
                  </Text>
                </View>
              </View>

              <View style={styles.guidelinesBox}>
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.guidelinesTitle}>How to resolve this?</Text>
                  <Text style={styles.guidelinesText}>
                    Review our community guidelines and ensure you follow them.
                    You can appeal this decision through your profile settings.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={styles.closeModalButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  flagCount: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 500,
    width: '100%',
    maxHeight: '80%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 0,
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  messageContainer: {
    gap: 8,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  messageText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#cffafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#164e63',
    lineHeight: 18,
  },
  guidelinesBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 4,
  },
  guidelinesText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  closeModalButton: {
    backgroundColor: '#1D3557',
    padding: 14,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FlagStatusBadge;
