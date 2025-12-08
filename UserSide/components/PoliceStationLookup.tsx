import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  getAllBarangayNames,
  searchBarangay,
  BarangayStation,
} from '../services/policeStationService';

interface PoliceStationLookupProps {
  visible: boolean;
  onClose: () => void;
}

const PoliceStationLookup: React.FC<PoliceStationLookupProps> = ({
  visible,
  onClose,
}) => {
  const [barangays, setBarangays] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');
  const [stationInfo, setStationInfo] = useState<BarangayStation | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadBarangays();
    }
  }, [visible]);

  const loadBarangays = async () => {
    setInitialLoading(true);
    try {
      const barangayList = await getAllBarangayNames();
      setBarangays(barangayList);
    } catch (error) {
      console.error('Error loading barangays:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleBarangaySelect = async (barangayName: string) => {
    setSelectedBarangay(barangayName);
    
    if (!barangayName) {
      setStationInfo(null);
      return;
    }

    setLoading(true);
    try {
      const result = await searchBarangay(barangayName);
      setStationInfo(result);
    } catch (error) {
      console.error('Error searching barangay:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string | null) => {
    if (!phoneNumber) return;
    
    // Extract first number if multiple numbers are present
    const cleanNumber = phoneNumber.split(/[\/,]/)[0].trim();
    const phoneUrl = `tel:${cleanNumber}`;
    
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        }
      })
      .catch((err) => console.error('Error opening phone dialer:', err));
  };

  const handleOpenMaps = (latitude: number | null, longitude: number | null, address: string | null) => {
    if (!latitude || !longitude) return;
    
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}${latitude},${longitude}?q=${encodeURIComponent(address || 'Police Station')}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(address || 'Police Station')})`,
    });

    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback to Google Maps web
            const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch((err) => console.error('Error opening maps:', err));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>🚔</Text>
              <Text style={styles.headerTitle}>Police Station Lookup</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Instruction */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionIcon}>ℹ️</Text>
              <Text style={styles.instructionText}>
                Select your barangay to view police station contact information
              </Text>
            </View>

            {/* Barangay Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select Barangay</Text>
              {initialLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1D3557" />
                  <Text style={styles.loadingText}>Loading barangays...</Text>
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedBarangay}
                    onValueChange={handleBarangaySelect}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Choose a barangay..." value="" />
                    {barangays.map((barangay) => (
                      <Picker.Item key={barangay} label={barangay} value={barangay} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1D3557" />
                <Text style={styles.loadingText}>Loading station info...</Text>
              </View>
            )}

            {/* Police Station Information */}
            {!loading && stationInfo && (
              <View style={styles.stationInfoCard}>
                <View style={styles.stationHeader}>
                  <Text style={styles.stationIcon}>🏢</Text>
                  <Text style={styles.stationName}>{stationInfo.station_name}</Text>
                </View>

                {/* Address */}
                {stationInfo.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Address</Text>
                      <Text style={styles.infoValue}>{stationInfo.address}</Text>
                    </View>
                  </View>
                )}

                {/* Contact Number */}
                {stationInfo.contact_number && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📞</Text>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Contact Number</Text>
                      <Text style={styles.infoValue}>{stationInfo.contact_number}</Text>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {stationInfo.contact_number && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleCall(stationInfo.contact_number)}
                    >
                      <Text style={styles.actionButtonIcon}>📱</Text>
                      <Text style={styles.actionButtonText}>Call Station</Text>
                    </TouchableOpacity>
                  )}

                  {stationInfo.latitude && stationInfo.longitude && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        handleOpenMaps(
                          stationInfo.latitude,
                          stationInfo.longitude,
                          stationInfo.address
                        )
                      }
                    >
                      <Text style={styles.actionButtonIcon}>🗺️</Text>
                      <Text style={styles.actionButtonText}>Open Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Offline Notice */}
                <View style={styles.offlineNotice}>
                  <Text style={styles.offlineIcon}>✓</Text>
                  <Text style={styles.offlineText}>
                    This information is available offline
                  </Text>
                </View>
              </View>
            )}

            {/* No Selection Message */}
            {!loading && !stationInfo && selectedBarangay === '' && !initialLoading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏘️</Text>
                <Text style={styles.emptyText}>
                  Please select a barangay to view police station information
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D3557',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  instructionIcon: {
    fontSize: 18,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    height: 50,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  stationInfoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  stationIcon: {
    fontSize: 28,
  },
  stationName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3557',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D3557',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  offlineIcon: {
    fontSize: 14,
    color: '#16a34a',
  },
  offlineText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PoliceStationLookup;
