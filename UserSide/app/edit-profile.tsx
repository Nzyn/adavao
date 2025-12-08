import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from './(tabs)/styles';
import { useUser } from '../contexts/UserContext';
import { directDbService } from '../services/directDbService';
import { useLoading } from '../contexts/LoadingContext';
import UpdateSuccessDialog from '../components/UpdateSuccessDialog';
import EnhancedLocationPicker from '../components/EnhancedLocationPicker';

const editStyles = StyleSheet.create({
    formContainer: {
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        width: '100%',
        backgroundColor: '#FF6B35',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        width: '100%',
        backgroundColor: 'transparent',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    locationDisplay: {
        backgroundColor: '#f0f7ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#d0e7ff',
    },
    locationDisplayText: {
        fontSize: 14,
        color: '#1D3557',
        fontWeight: '600',
        marginBottom: 4,
    },
    streetAddressText: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    locationButton: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: '#1D3557',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    locationButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyLocationText: {
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        color: '#666',
        fontSize: 14,
        marginBottom: 12,
        textAlign: 'center',
    },
});

export default function EditProfileScreen() {
    const { user, updateUser, refreshProfile } = useUser();
    const { showLoading, hideLoading, isLoading } = useLoading();
    const [userInfo, setUserInfo] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');

    // Location picker states
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [location, setLocation] = useState('');
    const [barangay, setBarangay] = useState('');
    const [barangayId, setBarangayId] = useState<number | null>(null);
    const [streetAddress, setStreetAddress] = useState('');
    const [locationCoordinates, setLocationCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    // Debug logging on component mount
    useEffect(() => {
        console.log('\n========== EDIT PROFILE SCREEN LOADED ==========');
        console.log('👤 User from context:', user);
        console.log('📋 UserInfo state:', userInfo);
        console.log('🔧 updateUser function available:', typeof updateUser);
        console.log('🔧 refreshProfile function available:', typeof refreshProfile);
        console.log('===============================================\n');
    }, []);

    useEffect(() => {
        if (user) {
            console.log('🔄 User context changed:', user);
        }
    }, [user]);

    const handleSave = async () => {
        console.log('\n');
        console.log('🔴 SAVE BUTTON CLICKED!');
        console.log('Current userInfo state:', userInfo);
        console.log('Current user from context:', user);

        // Validate required fields
        if (!userInfo.firstName.trim() || !userInfo.lastName.trim() || !userInfo.email.trim()) {
            console.log('❌ Validation failed: Missing required fields');
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userInfo.email)) {
            console.log('❌ Validation failed: Invalid email');
            Alert.alert('Error', 'Please enter a valid email address.');
            return;
        }

        // Use street address from location picker if available, otherwise use the text input
        const finalAddress = streetAddress.trim() || userInfo.address.trim();

        // Validate Davao City address
        if (finalAddress) {
            const davaoKeywords = ['davao', 'davao city'];
            const addressLower = finalAddress.toLowerCase();
            const isDavaoAddress = davaoKeywords.some(keyword => addressLower.includes(keyword));
            
            if (!isDavaoAddress) {
                console.log('❌ Validation failed: Address is not in Davao City');
                Alert.alert(
                    'Invalid Address',
                    'Please enter an address within Davao City only. This app is specifically for Davao City residents.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }

        console.log('✅ Validation passed, starting save process...');
        showLoading('Updating profile...');
        try {
            console.log('='.repeat(60));
            console.log('🔄 Starting profile update...');
            console.log('='.repeat(60));

            if (!user?.id) {
                throw new Error('User ID not found. Please log in again.');
            }

            console.log(`🎯 User ID: ${user.id}`);
            console.log(`👤 Current user:`, user);

            // Test backend connection first with timeout
            console.log('⏳ Testing backend connection...');
            const connectionPromise = directDbService.testMysqlConnection();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
            );

            const isConnected = await Promise.race([connectionPromise, timeoutPromise]) as boolean;
            if (!isConnected) {
                throw new Error('Cannot connect to backend server. Please ensure the backend is running on localhost:3000.');
            }
            console.log('✅ Backend connection successful');

            // Prepare profile data for update
            const profileUpdates = {
                firstName: userInfo.firstName.trim(),
                lastName: userInfo.lastName.trim(),
                email: userInfo.email.trim(),
                phone: userInfo.phone.trim(),
                address: finalAddress,
            };

            // Determine which fields actually changed (for success popup)
            const changedFields: string[] = [];
            if (profileUpdates.firstName !== (user?.firstName || '')) changedFields.push('First Name');
            if (profileUpdates.lastName !== (user?.lastName || '')) changedFields.push('Last Name');
            if (profileUpdates.email !== (user?.email || '')) changedFields.push('Email');
            if (profileUpdates.phone !== (user?.phone || '')) changedFields.push('Phone');
            if (profileUpdates.address !== (user?.address || '')) changedFields.push('Home Address');

            console.log('📦 Updating profile with data:', JSON.stringify(profileUpdates, null, 2));
            console.log(`📍 Address being saved: "${profileUpdates.address}"`);
            console.log(`📍 Address length: ${profileUpdates.address.length} characters`);

            // Update user context (this will also save to database)
            console.log('⏳ Calling updateUser...');
            await updateUser(profileUpdates);
            console.log('✅ User context updated successfully');

            // Refresh profile data to ensure consistency
            console.log('⏳ Refreshing profile from database...');
            await refreshProfile(user.id);
            console.log('✅ Profile data refreshed from database');

            console.log('='.repeat(60));
            console.log('🎉 Profile updated successfully in database and refreshed');
            console.log(`✅ Address "${profileUpdates.address}" saved to 'address' column in users table`);
            console.log('='.repeat(60));
            console.log('');
            console.log('📋 TO VERIFY IN DATABASE, RUN:');
            console.log(`   SELECT * FROM users WHERE id = ${user.id};`);
            console.log('');
            console.log('='.repeat(60));

            // Show success alert and navigate to profile
            const summary = changedFields.length
                ? `Updated: ${changedFields.join(', ')}`
                : 'No fields were changed.';

            setDialogMessage(summary);
            setDialogVisible(true);
        } catch (error) {
            console.log('='.repeat(60));
            console.error('❌ Profile update error:', error);
            console.error('❌ Error type:', error instanceof Error ? 'Error' : typeof error);
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.log('='.repeat(60));

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            Alert.alert(
                'Error',
                `Failed to update profile:

${errorMessage}

` +
                `Please check your internet connection and ensure the backend server is running on localhost:3000.\n\n` +
                `Check the console logs for more details.`,
                [{ text: 'OK' }]
            );
        } finally {
            hideLoading();
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setUserInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUseLocation = () => {
        setShowLocationPicker(true);
    };

    const handleLocationSelect = (data: {
        barangay: string;
        barangay_id: number;
        street_address: string;
        full_address: string;
        latitude: number;
        longitude: number;
    }) => {
        console.log('✅ Location selected:', data);

        // Set location display as full address
        setLocation(data.full_address);
        setBarangay(data.barangay);
        setBarangayId(data.barangay_id);
        setStreetAddress(data.street_address);
        setLocationCoordinates({
            latitude: data.latitude,
            longitude: data.longitude
        });
        setShowLocationPicker(false);
    };

    const handleLocationPickerClose = () => {
        setShowLocationPicker(false);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View style={styles.headerHistory}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.textTitle}>
                            <Text style={styles.alertWelcome}>Alert</Text>
                            <Text style={styles.davao}>Davao</Text>
                        </Text>
                        <Text style={styles.subheadingCenter}>Edit Profile</Text>
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                {/* Form Container */}
                <View style={[editStyles.formContainer, { marginTop: 20 }]}>
                    {/* First Name */}
                    <View style={editStyles.inputGroup}>
                        <Text style={editStyles.label}>First Name</Text>
                        <TextInput
                            style={editStyles.input}
                            value={userInfo.firstName}
                            onChangeText={(text) => handleInputChange('firstName', text)}
                            placeholder="Enter your first name"
                        />
                    </View>

                    {/* Last Name */}
                    <View style={editStyles.inputGroup}>
                        <Text style={editStyles.label}>Last Name</Text>
                        <TextInput
                            style={editStyles.input}
                            value={userInfo.lastName}
                            onChangeText={(text) => handleInputChange('lastName', text)}
                            placeholder="Enter your last name"
                        />
                    </View>

                    {/* Email */}
                    <View style={editStyles.inputGroup}>
                        <Text style={editStyles.label}>Email</Text>
                        <TextInput
                            style={editStyles.input}
                            value={userInfo.email}
                            onChangeText={(text) => handleInputChange('email', text)}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Phone */}
                    <View style={editStyles.inputGroup}>
                        <Text style={editStyles.label}>Phone Number</Text>
                        <TextInput
                            style={editStyles.input}
                            value={userInfo.phone}
                            onChangeText={(text) => handleInputChange('phone', text)}
                            placeholder="Enter your phone number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Home Address with Location Picker */}
                    <View style={editStyles.inputGroup}>
                        <Text style={editStyles.label}>Home Address</Text>

                        {/* Location Display */}
                        {location && (
                            <View style={editStyles.locationDisplay}>
                                <Text style={editStyles.locationDisplayText}>
                                    {location}
                                </Text>
                                {streetAddress && (
                                    <Text style={editStyles.streetAddressText}>
                                        📍 {streetAddress}
                                    </Text>
                                )}
                            </View>
                        )}

                        {!location && (
                            <Text style={editStyles.emptyLocationText}>
                                No location selected yet
                            </Text>
                        )}

                        {locationCoordinates && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={{ marginLeft: 6, color: '#4CAF50', fontSize: 12, fontWeight: '500' }}>
                                    Coordinates: {locationCoordinates.latitude.toFixed(6)}, {locationCoordinates.longitude.toFixed(6)}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity style={editStyles.locationButton} onPress={handleUseLocation}>
                            <Ionicons name="location" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={editStyles.locationButtonText}>
                                {location ? 'Change Location' : 'Select Location'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[editStyles.saveButton, isLoading && editStyles.disabledButton]}
                        onPress={handleSave}
                        onPressIn={() => console.log('👆 Save button pressed (onPressIn)')}
                        disabled={isLoading}
                        activeOpacity={0.7}
                    >
                        <Text style={editStyles.saveButtonText}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={editStyles.cancelButton}
                        onPress={() => router.back()}
                    >
                        <Text style={editStyles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Location Picker Modal */}
            {showLocationPicker && (
                <EnhancedLocationPicker
                    visible={showLocationPicker}
                    onClose={handleLocationPickerClose}
                    onLocationSelect={handleLocationSelect}
                />
            )}

            {/* Success Popup */}
            <UpdateSuccessDialog
                visible={dialogVisible}
                title="Confirm"
                message={`${dialogMessage}\n\nPlease confirm !`}
                onOk={() => {
                    setDialogVisible(false);
                    router.push('/profile');
                }}
            />
        </KeyboardAvoidingView>
    );
}

