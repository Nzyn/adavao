import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { reportService } from '../../services/reportService';
import styles from "./styles";
import { BACKEND_URL } from '../../config/backend';

interface Report {
  report_id: number;
  title: string;
  report_type: string | string[]; // Array of crime types or single string (for backward compatibility)
  description: string;
  status: string;
  is_anonymous: boolean;
  date_reported: string;
  created_at: string;
  assigned_station_id?: number; // Station assigned to handle the report
  location: {
    latitude: number;
    longitude: number;
    barangay: string;
    reporters_address?: string;
  };
  media: Array<{
    media_id: number;
    media_url: string;
    media_type: string; // 'image', 'video', or 'audio'
  }>;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#FFA500';
    case 'verified':
    case 'resolved':
      return '#28a745';
    case 'investigating':
      return '#007bff';
    case 'rejected':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const HistoryItem = React.memo(({ item, onPress }: {
  item: Report;
  onPress: (report: Report) => void;
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(item)}
    activeOpacity={0.7}>

    <View style={styles.cardContentHistory}>
      <View style={{ flex: 1 }}>

        {/* Title and Crime Type */}
        <Text style={[styles.titleHistory, { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitleHistory, { fontSize: 14, color: '#666', marginBottom: 8 }]}>
          {Array.isArray(item.report_type) ? item.report_type.join(', ') : item.report_type}
        </Text>

        {/* Location/Address */}
        <Text style={[styles.addressHistory, { fontSize: 13, color: '#888', lineHeight: 18 }]} numberOfLines={2}>
          {item.location.barangay}
        </Text>

        {/* Anonymous Indicator */}
        {item.is_anonymous && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="eye-off" size={16} color="#999" />
            <Text style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>Anonymous</Text>
          </View>
        )}
      </View>

      {/* Right Section - Date and Status */}
      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={[styles.dateHistory, { fontSize: 13, color: '#999', marginBottom: 8 }]}>
          {formatDateTime(item.date_reported)}
        </Text>
        <View style={[
          styles.statusBadgeHistory,
          {
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }
        ]}>
          <Text style={[styles.statusTextHistory, { fontSize: 12, fontWeight: '600' }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

const history = () => {
  // 📊 Performance Timing - Start
  const pageStartTime = React.useRef(Date.now());
  React.useEffect(() => {
    const loadTime = Date.now() - pageStartTime.current;
    console.log(`📊 [History] Page Load Time: ${loadTime}ms`);
  }, []);
  // 📊 Performance Timing - End

  const { user } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [decodedAddress, setDecodedAddress] = useState<string>('Loading address...');

  const fetchReports = async () => {
    if (!user || !user.id) {
      setError('Please log in to view your reports');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching reports for user:', user.id);
      const response = await reportService.getUserReports(user.id);

      if (response.success) {
        setReports(response.data);
        console.log('Fetched', response.data.length, 'reports');
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('History screen focused, refreshing reports...');
      fetchReports();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };





  const handleReportClick = React.useCallback((report: Report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
    setDecodedAddress('Loading address...');

    // Reverse geocode the coordinates to get human-readable address
    if (report.location.latitude !== 0 || report.location.longitude !== 0) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.location.latitude}&lon=${report.location.longitude}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
          console.log('🗺️ Reverse geocoded address:', data);
          setDecodedAddress(data.display_name || `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`);
        })
        .catch(error => {
          console.error('❌ Reverse geocoding failed:', error);
          setDecodedAddress(`${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`);
        });
    } else {
      setDecodedAddress('No coordinates available');
    }
  }, []);

  const closeReportDetail = React.useCallback(() => {
    setShowReportDetail(false);
    setSelectedReport(null);
    setDecodedAddress('Loading address...');
  }, []);

  const renderItem = React.useCallback(({ item }: { item: Report }) => (
    <HistoryItem item={item} onPress={handleReportClick} />
  ), [handleReportClick]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D3557" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading your reports...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with Back Button and Title */}
      <View style={styles.headerHistory}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.textTitle}>
            <Text style={styles.alertWelcome}>Alert</Text>
            <Text style={styles.davao}>Davao</Text>
          </Text>
          <Text style={styles.subheadingCenter}>Report History</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Error Message */}
      {error && (
        <View style={{ padding: 16, backgroundColor: '#fee', margin: 16, borderRadius: 8 }}>
          <Text style={{ color: '#c00', textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {/* Empty State */}
      {!error && reports.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={{ fontSize: 18, color: '#666', marginTop: 16, fontWeight: '600' }}>
            No Reports Yet
          </Text>
          <Text style={{ fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }}>
            Your submitted reports will appear here
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: '#1D3557',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8
            }}
            onPress={() => router.push('/report')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Submit a Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* History List */}
      {!error && reports.length > 0 && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.report_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          bounces={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1D3557']} />
          }
        />
      )}

      {/* Report Detail Modal */}
      <Modal
        transparent
        visible={showReportDetail}
        animationType="fade"
        onRequestClose={closeReportDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%', width: '90%', maxWidth: 500 }]}>
            <ScrollView>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1D3557', flex: 1 }}>Report Details</Text>
                <TouchableOpacity onPress={closeReportDetail}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedReport && (
                <View>
                  {/* Title */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 }}>Title</Text>
                    <Text style={{ fontSize: 16, color: '#333', fontWeight: '600' }}>{selectedReport.title}</Text>
                  </View>

                  {/* Status */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 }}>Status</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[
                        {
                          backgroundColor: getStatusColor(selectedReport.status),
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                        }
                      ]}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                          {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                        </Text>
                      </View>
                      {selectedReport.is_anonymous && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                          <Ionicons name="eye-off" size={16} color="#999" />
                          <Text style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>Anonymous</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Location */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 }}>📍 Crime Location</Text>

                    {/* Crime Type */}
                    <Text style={{ fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 8 }}>
                      {Array.isArray(selectedReport.report_type) ? selectedReport.report_type.join(', ') : selectedReport.report_type}
                    </Text>

                    {/* Street Address - Only show the first part (street name) */}
                    {selectedReport.location.reporters_address && (
                      <Text style={{ fontSize: 15, color: '#333', marginBottom: 4 }}>
                        {selectedReport.location.reporters_address.split(',')[0].trim()}
                      </Text>
                    )}

                    {/* Barangay Name Only */}
                    {selectedReport.location.barangay &&
                      !selectedReport.location.barangay.startsWith('Lat:') &&
                      selectedReport.location.barangay !== selectedReport.location.reporters_address?.split(',')[0].trim() && (
                        <Text style={{ fontSize: 15, color: '#333', marginBottom: 6 }}>
                          {selectedReport.location.barangay.split(',')[0].trim()}
                        </Text>
                      )}

                    {/* Decoded Address from Coordinates */}
                    {(selectedReport.location.latitude !== 0 || selectedReport.location.longitude !== 0) && (
                      <Text style={{ fontSize: 13, color: '#3B82F6', marginTop: 4, fontStyle: 'italic', lineHeight: 18 }}>
                        {decodedAddress}
                      </Text>
                    )}
                  </View>

                  {/* Description */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 }}>Description</Text>
                    <Text style={{ fontSize: 15, color: '#333', lineHeight: 22 }}>{selectedReport.description}</Text>
                  </View>

                  {/* Date of Incident */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 }}>Date of Incident</Text>
                    <Text style={{ fontSize: 15, color: '#333' }}>{formatDateTime(selectedReport.date_reported)}</Text>
                  </View>

                  {/* Submitted Date */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 4 }}>Submitted On</Text>
                    <Text style={{ fontSize: 15, color: '#333' }}>{formatDateTime(selectedReport.created_at)}</Text>
                  </View>

                  {/* Media Attachments */}
                  {selectedReport.media && selectedReport.media.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 8 }}>Evidence Attachments</Text>
                      {selectedReport.media.map((media) => (
                        <View key={media.media_id} style={{
                          marginBottom: 12,
                          padding: 12,
                          backgroundColor: '#f8f9fa',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e9ecef'
                        }}>
                          {/* Display image if it's an image type */}
                          {(media.media_type.toLowerCase().startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'].includes(media.media_type.toLowerCase())) && (
                            <Image
                              source={{ uri: `${BACKEND_URL}${media.media_url}` }}
                              style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 8, backgroundColor: '#e9ecef' }}
                              resizeMode="cover"
                              onError={(error) => {
                                console.error('❌ Image failed to load:', `${BACKEND_URL}${media.media_url}`, error.nativeEvent);
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully:', `${BACKEND_URL}${media.media_url}`);
                              }}
                            />
                          )}

                          {/* Media Info */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <Ionicons
                                name={(media.media_type.toLowerCase().startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'].includes(media.media_type.toLowerCase())) ? 'image' :
                                  (media.media_type.toLowerCase().startsWith('video') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(media.media_type.toLowerCase())) ? 'videocam' : 'document'}
                                size={20}
                                color="#1D3557"
                              />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={{ fontSize: 13, color: '#333', fontWeight: '600' }}>Evidence File</Text>
                                <Text style={{ fontSize: 12, color: '#666' }}>Type: {media.media_type.toUpperCase()}</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={{ padding: 8, backgroundColor: '#1D3557', borderRadius: 6 }}
                              onPress={() => {
                                // Open media in new window/tab
                                if (typeof window !== 'undefined') {
                                  window.open(`${BACKEND_URL}${media.media_url}`, '_blank');
                                }
                              }}
                            >
                              <Ionicons name="open-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedReport.media && selectedReport.media.length === 0 && (
                    <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>No evidence files attached</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default history;
