import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import styles from './styles';
import FlagStatusBadge from '../../components/FlagStatusBadge';
import { useUser } from '../../contexts/UserContext';
import { dbTest } from '../../utils/dbTest';
import { verificationService, VerificationStatus } from '../../services/verificationService';
import { notificationService } from '../../services/notificationService';
import { BACKEND_URL } from '../../config/backend';
import ChangePasswordModal from '../../components/ChangePasswordModal';

export default function ProfileScreen() {
  const { user, refreshProfile } = useUser();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [idPicture, setIdPicture] = useState<string | null>(null);
  const [idSelfie, setIdSelfie] = useState<string | null>(null);
  const [billingDocument, setBillingDocument] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [flagStatus, setFlagStatus] = useState<{ totalFlags: number; restrictionLevel: string | null } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleDatabaseTest = async () => {
    console.log('\n\n=== MANUAL DATABASE TEST STARTED ===');
    dbTest.logUserContext(user);
    await dbTest.runFullTest();

    // Refresh profile to get latest data
    if (user?.id) {
      await refreshProfile(user.id);
    }
    console.log('=== MANUAL DATABASE TEST COMPLETED ===\n\n');
  };

  // Load verification status and flag status
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 useEffect triggered, user:', user);
      if (user?.id) {
        console.log(`🚀 Loading verification status for user ID: ${user.id}`);
        setLoadingVerification(true);
        try {
          // Load verification status
          const result = await verificationService.getVerificationStatus(user.id);
          console.log('📥 Verification status result:', JSON.stringify(result, null, 2));
          if (result.success && result.data) {
            console.log('✅ Setting verification status:', result.data);
            setVerificationStatus(result.data);
            // Set existing document URLs if they exist
            if (result.data.id_picture) setIdPicture(result.data.id_picture);
            if (result.data.id_selfie) setIdSelfie(result.data.id_selfie);
            if (result.data.billing_document) setBillingDocument(result.data.billing_document);
          } else {
            console.log('⚠️ No verification data found or API returned failure');
          }

          // Load flag status
          try {
            const notifications = await notificationService.getUserNotifications(user.id.toString());
            const flagNotif = notifications.find(n => n.type === 'user_flagged');
            if (flagNotif && flagNotif.data) {
              setFlagStatus({
                totalFlags: flagNotif.data.total_flags || 1,
                restrictionLevel: flagNotif.data.restriction_applied || null,
              });
            }
          } catch (error) {
            console.error('Error loading flag status:', error);
          }
        } catch (error) {
          console.error('💥 Error loading verification status:', error);
        } finally {
          console.log('🏁 Finished loading verification status');
          setLoadingVerification(false);
        }
      } else {
        console.log('🚫 No user ID available, skipping verification load');
      }
    };

    loadData();
  }, [user?.id]);

  // Request permissions for image picker
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  };

  // Pick image from library
  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Upload a document to the server
  const uploadDocument = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'document.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Handle React Native Web file uploads properly
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        // For web, we need to fetch the blob and create a proper File object
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type });
        formData.append('document', file);
      } else {
        // For mobile platforms, use the existing approach
        formData.append('document', {
          uri,
          name: filename,
          type
        } as any);
      }

      const response = await fetch(`${BACKEND_URL}/api/verification/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        return result.filePath;
      } else {
        throw new Error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Submit verification documents
  const submitVerification = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    if (!idPicture && !idSelfie && !billingDocument) {
      Alert.alert('Error', 'Please upload at least one document');
      return;
    }

    // Check if user can submit verification
    if (isUserVerified) {
      Alert.alert('Error', 'Your account is already verified');
      return;
    }

    if (hasPendingVerification) {
      Alert.alert('Error', 'Your verification is already pending review. Please wait for admin approval.');
      return;
    }

    try {
      setUploading(true);

      // Upload documents if they are local files
      let idPicturePath = idPicture;
      let idSelfiePath = idSelfie;
      let billingDocumentPath = billingDocument;

      // Check if the paths are local URIs (not already uploaded server paths)
      // Handle both file:// URIs (mobile) and blob: URIs (web)
      if (idPicture && (idPicture.startsWith('file://') || idPicture.startsWith('blob:'))) {
        idPicturePath = await uploadDocument(idPicture);
        if (!idPicturePath) throw new Error('Failed to upload ID picture');
      }

      if (idSelfie && (idSelfie.startsWith('file://') || idSelfie.startsWith('blob:'))) {
        idSelfiePath = await uploadDocument(idSelfie);
        if (!idSelfiePath) throw new Error('Failed to upload selfie');
      }

      if (billingDocument && (billingDocument.startsWith('file://') || billingDocument.startsWith('blob:'))) {
        billingDocumentPath = await uploadDocument(billingDocument);
        if (!billingDocumentPath) throw new Error('Failed to upload billing document');
      }

      const result = await verificationService.submitVerification({
        userId: user.id,
        idPicture: idPicturePath || undefined,
        idSelfie: idSelfiePath || undefined,
        billingDocument: billingDocumentPath || undefined,
      });

      if (result.success) {
        Alert.alert('Success', 'Verification documents submitted successfully');
        // Refresh verification status
        const statusResult = await verificationService.getVerificationStatus(user.id);
        if (statusResult.success && statusResult.data) {
          setVerificationStatus(statusResult.data);
          // Clear local file URIs
          if (idPicture && (idPicture.startsWith('file://') || idPicture.startsWith('blob:'))) setIdPicture(null);
          if (idSelfie && (idSelfie.startsWith('file://') || idSelfie.startsWith('blob:'))) setIdSelfie(null);
          if (billingDocument && (billingDocument.startsWith('file://') || billingDocument.startsWith('blob:'))) setBillingDocument(null);
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to submit verification');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Check if user is verified
  const isUserVerified = user.isVerified || (verificationStatus?.is_verified ?? false);
  const hasPendingVerification = verificationStatus?.status === 'pending';
  const wasRejected = verificationStatus?.status === 'rejected';

  // Users can only submit verification once, unless they were rejected
  const canSubmitVerification = !isUserVerified && !hasPendingVerification;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
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
          <Text style={styles.subheadingCenter}>Profile</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://i.pinimg.com/736x/3c/ae/07/3cae079ca0b9e55ec6bfc1b358c9b1e2.jpg' }} // Replace with user image
          style={styles.profileImage}
        />
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>{isUserVerified ? 'Verified' : 'Not Verified'}</Text>
        </View>
        {flagStatus && (
          <View style={styles.flagBadgeContainer}>
            <FlagStatusBadge
              flagStatus={flagStatus}
              size="medium"
              showLabel={false}
            />
          </View>
        )}
      </View>

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        <Text style={styles.address}>
          {user.address}
        </Text>

        {/* Database Status Indicator - Removed per user request */}

        {user.updatedAt && (
          <View style={profileStyles.statusContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={profileStyles.statusText}>
              Last updated: {new Date(user.updatedAt).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}
            </Text>
          </View>
        )}

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={profileStyles.editButton}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="create-outline" size={20} color="#FF6B35" />
          <Text style={profileStyles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity
          style={profileStyles.editButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
          <Text style={profileStyles.editButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Verification Section */}
      <View style={profileStyles.verificationContainer}>
        <Text style={profileStyles.sectionTitle}>Verification</Text>

        {loadingVerification ? (
          <Text style={profileStyles.loadingText}>Loading verification status...</Text>
        ) : (
          <>
            <View style={profileStyles.verificationStatus}>
              <Text style={profileStyles.statusText}>
                Status: {verificationStatus?.status || (isUserVerified ? 'verified' : 'not verified')}
              </Text>
              {hasPendingVerification && (
                <Text style={profileStyles.pendingText}>Your verification is pending review</Text>
              )}
            </View>

            {/* Verification Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, isUserVerified || hasPendingVerification || uploading ? styles.disabledButton : {}]}
                disabled={isUserVerified || hasPendingVerification || uploading}
                onPress={() => pickImage(setIdPicture)}
              >
                <Text style={styles.buttonText}>
                  {idPicture ? '✓ ID Picture Uploaded' : 'Upload ID'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isUserVerified || hasPendingVerification || uploading ? styles.disabledButton : {}]}
                disabled={isUserVerified || hasPendingVerification || uploading}
                onPress={() => pickImage(setIdSelfie)}
              >
                <Text style={styles.buttonText}>
                  {idSelfie ? '✓ Selfie with ID Uploaded' : 'Upload a selfie holding an ID'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isUserVerified || hasPendingVerification || uploading ? styles.disabledButton : {}]}
                disabled={isUserVerified || hasPendingVerification || uploading}
                onPress={() => pickImage(setBillingDocument)}
              >
                <Text style={styles.buttonText}>
                  {billingDocument ? '✓ Billing Document Uploaded' : 'Billing Document'}
                </Text>
              </TouchableOpacity>

              {!isUserVerified && (
                <TouchableOpacity
                  style={[styles.button, (!idPicture && !idSelfie && !billingDocument) || uploading || !canSubmitVerification ? styles.disabledButton : {}]}
                  disabled={!idPicture && !idSelfie && !billingDocument || uploading || !canSubmitVerification}
                  onPress={submitVerification}
                >
                  <Text style={styles.buttonText}>
                    {uploading ? 'Submitting...' :
                      hasPendingVerification ? 'Verification Pending' :
                        wasRejected ? 'Resubmit Verification' :
                          'Submit Verification'}
                  </Text>
                </TouchableOpacity>
              )}

              {isUserVerified && (
                <TouchableOpacity style={[styles.button, styles.disabledButton]} disabled>
                  <Text style={styles.disabledText}>Account already Verified</Text>
                </TouchableOpacity>
              )}

              {hasPendingVerification && (
                <Text style={profileStyles.infoText}>
                  Your verification is pending review. Please wait for admin approval.
                </Text>
              )}

              {wasRejected && (
                <Text style={profileStyles.infoText}>
                  Your previous verification was rejected. You can resubmit once.
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </ScrollView >
  );
}

const profileStyles = StyleSheet.create({
  editButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#fff',
    borderColor: '#FF6B35',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    fontStyle: 'italic' as const,
  },
  debugButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  debugButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 6,
  },
  verificationContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 15,
    color: '#333',
  },
  verificationStatus: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pendingText: {
    fontSize: 14,
    color: '#ff9800',
    marginTop: 5,
    fontStyle: 'italic' as const,
  },
  loadingText: {
    textAlign: 'center' as const,
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});