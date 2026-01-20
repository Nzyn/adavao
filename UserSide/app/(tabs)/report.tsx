import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Button,
    TouchableOpacity,
    Image,
    Pressable,
    Alert,
    StyleSheet,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../config/backend';

// Conditional WebView import for native platforms only
let WebView: any = null;
if (Platform.OS !== 'web') {
    try {
        const { WebView: RNWebView } = require('react-native-webview');
        WebView = RNWebView;
    } catch (e) {
        console.log('WebView not available on this platform');
    }
}


import EnhancedLocationPicker from '../../components/EnhancedLocationPicker';
import UpdateSuccessDialog from '../../components/UpdateSuccessDialog';
import FlagNotificationToast from '../../components/FlagNotificationToast';
import { reportService } from '../../services/reportService';
import { notificationService, type Notification } from '../../services/notificationService';
import { useUser } from '../../contexts/UserContext';
import { Link } from 'expo-router';
import styles from './styles';
import { validateDavaoLocation } from '../../utils/geofence';



const CRIME_CATEGORIES = {
    'Crime Against Persons': [
        'Homicide',
        'Murder',
        'Physical Injury',
        'Sexual Assault',
        'Rape',
        'Domestic Violence',
        'Harassment',
        'Threats',
        'Missing Person'
    ],
    'Crime Against Property': [
        'Theft',
        'Robbery',
        'Burglary',
        'Break-in',
        'Carnapping',
        'Motornapping'
    ],
    'Crime Against Society': [
        'Fraud',
        'Cybercrime'
    ],
    'Uncategorized': [
        'Others'
    ]
};

// Flatten for backward compatibility
const CRIME_TYPES = Object.values(CRIME_CATEGORIES).flat();


// ✅ Type for CheckRow props
type CheckRowProps = {
    label: string;
    checked: boolean;
    onToggle: () => void;
};

function CheckRow({ label, checked, onToggle }: CheckRowProps) {
    return (
        <Pressable onPress={onToggle} style={styles.checkboxRow} android_ripple={{ color: '#e5e5e5' }}>
            <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
                {checked && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>{label}</Text>
        </Pressable>
    );
}

export default function ReportCrime() {
    // 📊 Performance Timing - Start
    const pageStartTime = React.useRef(Date.now());
    React.useEffect(() => {
        const loadTime = Date.now() - pageStartTime.current;
        console.log(`📊 [Report] Page Load Time: ${loadTime}ms`);
    }, []);
    // 📊 Performance Timing - End

    const { user } = useUser();
    const [title, setTitle] = useState('');
    const [titleError, setTitleError] = useState('');
    const [selectedCrimes, setSelectedCrimes] = useState<string[]>([]);
    const [openedCategories, setOpenedCategories] = useState<string[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [location, setLocation] = useState('');
    const [barangay, setBarangay] = useState('');
    const [barangayId, setBarangayId] = useState<number | null>(null);
    const [streetAddress, setStreetAddress] = useState('');
    const [description, setDescription] = useState('');

    // Item #2: Report Templates
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const REPORT_TEMPLATES: { [key: string]: string } = {
        'Theft': 'Item stolen: ___\nLocation where it happened: ___\nApproximate time: ___\nSuspect description (if seen): ___\nEstimated value: ___',
        'Robbery': 'What was taken: ___\nWeapon used (if any): ___\nNumber of suspects: ___\nSuspect description: ___\nDirection suspects fled: ___',
        'Noise Complaint': 'Type of noise: ___\nDuration: ___\nFrequency (daily/weekly): ___\nSource of noise: ___',
        'Suspicious Activity': 'Activity observed: ___\nNumber of people involved: ___\nVehicle description (if any): ___\nHow long has this been happening: ___',
        'Missing Person': 'Name: ___\nAge: ___\nLast seen: ___\nWearing: ___\nDistinguishing features: ___',
        'Physical Injury': 'Type of injury: ___\nHow it happened: ___\nSuspect name/description: ___\nWitnesses present: ___',
        'Domestic Violence': 'Relationship to suspect: ___\nType of violence: ___\nInjuries sustained: ___\nIs this ongoing: ___',
        'Burglary': 'Entry point: ___\nItems taken: ___\nTime discovered: ___\nSigns of forced entry: ___',
        'Vandalism': 'Property damaged: ___\nType of damage: ___\nEstimated repair cost: ___\nWitnesses: ___',
    };

    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [locationCoordinates, setLocationCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [flagNotification, setFlagNotification] = useState<Notification | null>(null);
    const [isFlagged, setIsFlagged] = useState(false);
    const [userId, setUserId] = useState<string>('');

    // Load user ID and check flag status when component mounts or comes into focus
    // Polling for real-time restriction status
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            let pollInterval: any;

            const checkRestrictions = async () => {
                if (!userId) return;

                try {
                    // Use the specific endpoint for restrictions check
                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/${userId}/restrictions`);
                    const data = await response.json();

                    if (isActive && data) {
                        const isRestricted = data.isRestricted && (!data.expiresAt || new Date(data.expiresAt) > new Date());

                        // Only update state if it changed to avoid re-renders
                        if (isRestricted !== isFlagged) {
                            setIsFlagged(isRestricted);
                            if (isRestricted) {
                                // If newly restricted, verify if we need to show notification
                                const notifications = await notificationService.getUserNotifications(userId);
                                const flaggedNotification = notifications.find(n => n.type === 'user_flagged');
                                if (flaggedNotification) {
                                    setFlagNotification(flaggedNotification);
                                }
                            } else {
                                // If restriction lifted, clear notification
                                setFlagNotification(null);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error polling restrictions:', error);
                }
            };

            // Initial check
            checkRestrictions();

            // Poll every 5 seconds
            pollInterval = setInterval(checkRestrictions, 5000);

            return () => {
                isActive = false;
                clearInterval(pollInterval);
            };
        }, [userId, isFlagged])
    );

    // Listen for messages from web iframe minimap
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'locationSelected') {
                    const { latitude, longitude } = event.data;

                    // Validate location is within Davao City
                    const validation = validateDavaoLocation(latitude, longitude);
                    if (!validation.isValid) {
                        Alert.alert(
                            'Location Outside Davao City',
                            'We only accept reports within Davao City.\\n\\nThe selected location is outside Davao City boundaries. Please tap on the map within Davao City to proceed with your report.',
                            [
                                {
                                    text: 'OK',
                                    style: 'default'
                                }
                            ]
                        );
                        return; // Don't set invalid location
                    }

                    setLocationCoordinates({
                        latitude,
                        longitude
                    });

                    // Auto-reverse geocode to get address
                    // Use BACKEND_URL directly (it's already configured for live/dev)
                    const apiUrl = typeof window !== 'undefined'
                        ? `${window.location.protocol}//${window.location.host}/api/location/reverse`
                        : `${BACKEND_URL}/api/location/reverse`;

                    fetch(`${apiUrl}?lat=${latitude}&lon=${longitude}`)
                        .then(res => res.json())
                        .then(addressData => {
                            if (addressData.success) {
                                setStreetAddress(addressData.address || '');
                                setLocation(addressData.barangay || '');
                                setBarangayId(addressData.barangay_id || null);
                            }
                        })
                        .catch(err => console.error('Reverse geocode error:', err));
                }
            };

            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, []);

    // Debug: Log when showLocationPicker changes
    // Item #6: Auto-pin current location on mount
    useEffect(() => {
        const autoGetCurrentLocation = async () => {
            try {
                console.log('🗺️ Auto-pinning current location...');
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High
                    });

                    const { latitude, longitude } = location.coords;
                    console.log(`📍 Auto-pinned location: ${latitude}, ${longitude}`);

                    setLocationCoordinates({ latitude, longitude });

                    // Auto-reverse geocode to get address
                    try {
                        const response = await fetch(
                            `${BACKEND_URL}/api/location/reverse?latitude=${latitude}&longitude=${longitude}`
                        );
                        const data = await response.json();

                        if (data.success && data.location) {
                            setLocation(data.location.display_name || '');
                            setBarangay(data.location.barangay || '');
                            setStreetAddress(data.location.street_address || '');
                            console.log(`✅ Auto-location set: ${data.location.barangay}`);
                        }
                    } catch (error) {
                        console.error('Error reverse geocoding:', error);
                    }
                } else {
                    console.log('⚠️ Location permission not granted');
                }
            } catch (error) {
                console.error('Error auto-pinning location:', error);
            }
        };

        autoGetCurrentLocation();
    }, []); // Run once on mount

    useEffect(() => {
        console.log('📍 showLocationPicker changed:', showLocationPicker);
    }, [showLocationPicker]);

    // ✅ Toggle function with correct typing
    const toggleCrimeType = (crime: string) => {
        setSelectedCrimes((prev) =>
            prev.includes(crime) ? prev.filter((c) => c !== crime) : [...prev, crime]
        );
    };

    const handleUseLocation = () => {
        console.log('🗺️ Opening location picker...');
        setShowLocationPicker(true);
        console.log('✅ showLocationPicker set to true');
    };

    const handleLocationSelect = (data: {
        barangay: string;
        barangay_id: number;
        street_address: string;
        full_address: string;
        latitude: number;
        longitude: number;
    }) => {
        console.log('📥 handleLocationSelect called in report.tsx');
        console.log('✅ Location data received:', data);
        console.log('📍 Coordinates:', {
            latitude: data.latitude,
            longitude: data.longitude
        });

        // Validate location is within Davao City
        const validation = validateDavaoLocation(data.latitude, data.longitude);
        if (!validation.isValid) {
            Alert.alert(
                'Location Outside Davao City',
                'We only accept reports within Davao City.\n\nThe selected location is outside Davao City boundaries. Please select a different location within Davao City to proceed with your report.',
                [
                    {
                        text: 'Select Different Location',
                        onPress: () => {
                            // Keep the location picker open or reopen it
                            setShowLocationPicker(true);
                        },
                        style: 'default'
                    }
                ],
                { cancelable: false }
            );
            return; // Don't proceed with invalid location
        }

        // Set location display as full address
        setLocation(data.full_address);
        setBarangay(data.barangay);
        setBarangayId(data.barangay_id);
        setStreetAddress(data.street_address);
        setLocationCoordinates({
            latitude: data.latitude,
            longitude: data.longitude
        });

        console.log('✅ State updated:', {
            location: data.full_address,
            barangay: data.barangay,
            barangayId: data.barangay_id,
            streetAddress: data.street_address,
            coordinates: {
                latitude: data.latitude,
                longitude: data.longitude
            }
        });

        setShowLocationPicker(false);
        console.log('✅ Location picker closed');
    };

    const handleLocationPickerClose = () => {
        setShowLocationPicker(false);
    };

    const pickMedia = async () => {
        // Request permission first
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please grant access to your photo library to upload evidence.');
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const asset = result.assets[0];

            // Check file size (25MB = 25 * 1024 * 1024 bytes)
            const maxSizeInBytes = 25 * 1024 * 1024;

            if (asset.fileSize && asset.fileSize > maxSizeInBytes) {
                Alert.alert('File Too Large', 'Your file is too big. Please select a file smaller than 25MB.');
                return;
            }

            setSelectedMedia(asset);
        }
    };

    const removeMedia = () => {
        setSelectedMedia(null);
    };




    const handleSubmit = async () => {
        console.log('🔍 Validating report submission...');

        // Check if user is flagged
        if (isFlagged) {
            Alert.alert(
                'Account Flagged',
                'Your account has been flagged. You are unable to submit new reports until the flag is lifted by an administrator.',
                [{ text: 'OK' }]
            );
            return;
        }

        console.log('Current state:', {
            title: title.trim(),
            selectedCrimes,
            description: description.trim(),
            user,
            barangay,
            barangayId,
            streetAddress: streetAddress.trim(),
            locationCoordinates
        });

        // Validation - Check all required fields
        // Title validation removed - will be auto-generated

        if (selectedCrimes.length === 0) {
            console.log('❌ Validation failed: No crime types');
            window.alert('Missing Information: Please select at least one crime type.');
            return;
        }
        console.log('✅ Crime types validated');


        // Item 10: Sensitive Content Detection
        const sensitiveWords = ['fuck', 'shit', 'bitch', 'asshole', 'gago', 'putangina', 'leche', 'bobo', 'tanga', 'piste', 'yawa', 'inutil'];
        const textToCheck = (description || '').toLowerCase();
        const foundSensitive = sensitiveWords.filter(word => textToCheck.includes(word));

        if (foundSensitive.length > 0) {
            console.log('❌ Validation failed: Sensitive content detected');
            window.alert('Sensitive Content Detected\n\nYour report contains inappropriate language ("' + foundSensitive[0] + '").\n\nPlease remove it to maintain community guidelines.');
            return;
        }

        if (!description.trim()) {
            console.log('❌ Validation failed: No description');
            window.alert('Missing Information: Please describe what happened in detail.');
            return;
        }
        console.log('✅ Description validated');

        // ⚠️ Evidence validation - Required for most crime types
        const EVIDENCE_OPTIONAL_CRIMES = [
            'Threats', 'Harassment', 'Missing Person', 'Suspicious Activity', 'Noise Complaint'
        ];

        const requiresEvidence = !selectedCrimes.some(crime =>
            EVIDENCE_OPTIONAL_CRIMES.includes(crime)
        );

        if (requiresEvidence && !selectedMedia) {
            console.log('❌ Validation failed: Evidence required but not provided');
            window.alert(
                'Evidence Required: Please upload photo or video evidence of this incident.\n\n' +
                'This helps police verify and respond faster to your report.\n\n' +
                'Evidence is required for: ' + selectedCrimes.join(', ')
            );
            return;
        }

        if (selectedMedia) {
            console.log('✅ Evidence provided');
        } else {
            console.log('ℹ️ Evidence optional for this crime type');
        }



        // Check if user is logged in
        console.log('👤 Current user from context:', user);
        console.log('🆔 User ID:', user?.id);

        if (!user || !user.id) {
            console.log('❌ Validation failed: User not logged in');
            window.alert('Authentication Required: You must be logged in to submit a report.');
            console.error('User not logged in:', user);
            return;
        }
        console.log('✅ User authenticated');

        // Street address and coordinates are required, barangay is optional (will be determined server-side)
        if (!streetAddress.trim()) {
            console.log('❌ Validation failed: No street address');
            window.alert(
                'Missing Information: Please enter a street address.\n\nClick "Select Location" to add your street name, building, and house number.'
            );
            return;
        }
        console.log('✅ Street address validated');

        if (barangay && barangayId) {
            console.log('✅ Barangay selected:', barangay);
        } else {
            console.log('⚠️ No barangay selected - will be determined server-side from coordinates');
        }

        if (!locationCoordinates) {
            console.log('❌ Validation failed: No coordinates');
            window.alert(
                'Missing Information: Location coordinates are missing. Please use the location picker to set a valid location.'
            );
            return;
        }
        console.log('✅ Location coordinates exist');

        // Validate coordinates are not 0,0
        if (locationCoordinates.latitude === 0 && locationCoordinates.longitude === 0) {
            console.log('❌ Validation failed: Invalid coordinates (0,0)');
            window.alert(
                'Invalid Location: The location has invalid coordinates. Please select a valid location using the map.'
            );
            return;
        }
        console.log('✅ Coordinates validated');

        // Final geofence check - ensure location is within Davao City
        console.log('🚧 Final geofence check for coordinates:', locationCoordinates);
        const geofenceValidation = validateDavaoLocation(
            locationCoordinates.latitude,
            locationCoordinates.longitude
        );

        if (!geofenceValidation.isValid) {
            console.log('❌ Final geofence check failed:', geofenceValidation.errorMessage);
            window.alert(
                'We Only Accept Reports Within Davao City\n\n' +
                (geofenceValidation.errorMessage ||
                    'The selected location is outside Davao City boundaries.\n\n' +
                    'Please go back and select a location within Davao City to proceed with your report.')
            );
            return;
        }
        console.log('✅ Final geofence check passed - location is within Davao City');

        console.log('✅ All validations passed');
        console.log('📢 About to show confirmation...');

        // Show custom confirmation modal
        setShowConfirmDialog(true);
    };

    const submitReportData = async () => {
        try {
            setIsSubmitting(true);
            console.log('\n' + '='.repeat(50));
            console.log('📤 Starting report submission...');

            // Format the incident date and time
            // Automatically get current time in Asia/Manila (UTC+8)
            const now = new Date();
            const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
            const manilaTime = new Date(utcMs + 8 * 3600000);

            const pad = (n: number) => n.toString().padStart(2, '0');
            const year = manilaTime.getFullYear();
            const month = pad(manilaTime.getMonth() + 1);
            const day = pad(manilaTime.getDate());
            const hour = pad(manilaTime.getHours());
            const minute = pad(manilaTime.getMinutes());
            const second = pad(manilaTime.getSeconds());

            const incidentDateTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

            // Prepare report data (title will be auto-generated on backend)
            const reportData = {
                crimeTypes: selectedCrimes,
                description: description.trim(),
                incidentDate: incidentDateTime,
                isAnonymous,
                latitude: locationCoordinates?.latitude ?? null,
                longitude: locationCoordinates?.longitude ?? null,
                location: location.trim(),
                reporters_address: streetAddress.trim(), // Street address for database
                barangay: barangay, // Barangay name
                barangay_id: barangayId, // Barangay ID for linking
                media: selectedMedia ? {
                    uri: selectedMedia.uri,
                    fileName: selectedMedia.fileName ?? undefined,
                    fileSize: selectedMedia.fileSize ?? undefined,
                    type: selectedMedia.type ?? undefined
                } : null,
                userId: user.id,
            };

            console.log('📋 Report Data:');
            console.log('   Crime Types:', reportData.crimeTypes);
            console.log('   Location:', reportData.location);
            console.log('   Coordinates:', { lat: reportData.latitude, lng: reportData.longitude });
            console.log('   Has Media:', !!reportData.media);
            console.log('   Anonymous:', reportData.isAnonymous);
            console.log('   User ID:', reportData.userId);

            // Submit the report
            console.log('\n🚀 Calling reportService.submitReport()...');
            const response = await reportService.submitReport(reportData);

            console.log('✅ Report submitted successfully!');
            console.log('Response:', response);

            // Store success data to show in dialog
            const locationStr = location.trim() || `${locationCoordinates?.latitude?.toFixed(4)}, ${locationCoordinates?.longitude?.toFixed(4)}`;
            const successMessage = `Your report has been submitted successfully.\n\nLocation: ${locationStr}\n\nIP Address and location have been recorded for security and tracking purposes.`;

            // Show success dialog with IP/location recording message
            setShowSuccessDialog(true);

            // Store the message to display
            (global as any).successMessage = successMessage;

            console.log('='.repeat(50) + '\n');
        } catch (error) {
            console.error('\n❌ Error submitting report:', error);
            console.log('='.repeat(50) + '\n');

            const errorMessage = error instanceof Error
                ? error.message
                : 'An unexpected error occurred. Please try again.';

            window.alert('Submission Failed: ' + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Flag Notification Toast - Fixed at top */}
            <FlagNotificationToast
                notification={flagNotification}
                onDismiss={() => setFlagNotification(null)}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 48 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                bounces={true}
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
                        <Text style={styles.subheadingCenter}>Report Crime</Text>
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                {/* Title removed - will be auto-generated from crime type + location + date */}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.subheading}>Select the type of </Text>
                    <Link href={{ pathname: "/guidelines", params: { scrollToSection: "crime-types" } }} asChild>
                        <TouchableOpacity>
                            <Text style={[styles.subheading, { color: '#0066cc', textDecorationLine: 'underline' }]}>crimes</Text>
                        </TouchableOpacity>
                    </Link>
                    <Text style={styles.subheading}> *</Text>
                </View>
                <View style={[styles.card, isFlagged && { opacity: 0.6, pointerEvents: 'none' }]}>
                    {/* Render each opened category */}
                    {openedCategories.map((category, index) => (
                        <View key={category} style={{ marginBottom: 16 }}>
                            {/* Category Header with Remove Button */}
                            <View style={{
                                backgroundColor: '#1D3357',
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 8,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Text style={{
                                    fontSize: 17,
                                    fontWeight: 'bold',
                                    color: '#FFFFFF',
                                    flex: 1
                                }}>
                                    {category}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setOpenedCategories(prev => prev.filter(c => c !== category));
                                    }}
                                    style={{ padding: 4 }}
                                >
                                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Crime Types for this Category */}
                            <View style={{ paddingLeft: 8 }}>
                                {CRIME_CATEGORIES[category as keyof typeof CRIME_CATEGORIES].map((crime) => (
                                    <CheckRow
                                        key={crime}
                                        label={crime}
                                        checked={selectedCrimes.includes(crime)}
                                        onToggle={() => toggleCrimeType(crime)}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Add Category Button */}
                    {openedCategories.length < Object.keys(CRIME_CATEGORIES).length && (
                        <TouchableOpacity
                            style={{
                                borderWidth: 2,
                                borderColor: '#1D3357',
                                borderStyle: 'dashed',
                                borderRadius: 8,
                                padding: 16,
                                alignItems: 'center',
                                backgroundColor: '#f8f9fa',
                                marginBottom: 12
                            }}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="add-circle-outline" size={24} color="#1D3357" />
                                <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#1D3357' }}>
                                    {openedCategories.length === 0 ? 'Add Category' : 'Add Another Category'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Helper Message */}
                    <View style={{ marginTop: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#1D3357' }}>
                        <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                            Not sure which category to choose? If you're confused, please check the definitions above for guidance.
                        </Text>
                    </View>
                </View>

                <Text style={styles.label}>Location *</Text>

                {/* Location Display */}
                {location && (
                    <View style={{
                        backgroundColor: '#f0f7ff',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#d0e7ff'
                    }}>
                        <Text style={{ fontSize: 14, color: '#1D3557', fontWeight: '600', marginBottom: 4 }}>
                            {location}
                        </Text>
                        {streetAddress && (
                            <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                                📍 {streetAddress}
                            </Text>
                        )}
                    </View>
                )}

                {!location && (
                    <Text style={{
                        padding: 12,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8,
                        color: '#666',
                        fontSize: 14,
                        marginBottom: 12,
                        textAlign: 'center'
                    }}>
                        No location selected yet
                    </Text>
                )}

                {locationCoordinates && (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={{ marginLeft: 6, color: '#4CAF50', fontSize: 12, fontWeight: '500' }}>
                                Coordinates: {locationCoordinates.latitude.toFixed(6)}, {locationCoordinates.longitude.toFixed(6)}
                            </Text>
                        </View>

                        {/* Static Preview */}
                        <View style={{
                            width: '100%',
                            height: 150,
                            borderRadius: 8,
                            overflow: 'hidden',
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: '#d0e7ff',
                        }}>
                            <Image
                                source={{
                                    uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+1D3557(${locationCoordinates.longitude},${locationCoordinates.latitude})/${locationCoordinates.longitude},${locationCoordinates.latitude},14,0/350x150@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`
                                }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                            <View style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 4,
                            }}>
                                <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>
                                    📍 Location Preview
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity style={styles.locationButton} onPress={handleUseLocation}>
                    <Ionicons name="location" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.locationButtonText}>
                        {location ? 'Change Location' : 'Select Location'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Description *</Text>

                {/* Item #2: Template Button */}
                {selectedCrimes.length > 0 && Object.keys(REPORT_TEMPLATES).some(t => selectedCrimes.includes(t)) && (
                    <TouchableOpacity
                        style={styles.templateButton}
                        onPress={() => setShowTemplateModal(true)}>
                        <Ionicons name="document-text-outline" size={18} color="#1D3557" style={{ marginRight: 6 }} />
                        <Text style={styles.templateButtonText}>📋 Use Template</Text>
                    </TouchableOpacity>
                )}

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe what happened in detail..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <Text style={styles.label}>Photo/Video Evidence *</Text>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8, marginTop: -8 }}>
                    Required for most crime types. Upload a photo or video of the incident, damage, or suspect.
                </Text>
                <TouchableOpacity style={[styles.mediaButton, isFlagged && { opacity: 0.6 }]} onPress={isFlagged ? undefined : pickMedia}>
                    <Ionicons name="camera-outline" size={24} color="#1D3557" />
                    <Text style={styles.mediaButtonText}>Select Photo/Video</Text>
                </TouchableOpacity>

                {selectedMedia && (
                    <View style={styles.mediaPreviewContainer}>
                        <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowMediaViewer(true)}>
                            {/* Image Thumbnail Preview */}
                            {(selectedMedia?.mimeType?.startsWith('image') ||
                                selectedMedia?.type?.startsWith('image') ||
                                selectedMedia?.uri?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) ? (
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    marginRight: 12,
                                    backgroundColor: '#f0f0f0',
                                    borderWidth: 1,
                                    borderColor: '#ddd'
                                }}>
                                    <Image
                                        source={{ uri: selectedMedia.uri }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : (
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 8,
                                    marginRight: 12,
                                    backgroundColor: '#f0f0f0',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#ddd'
                                }}>
                                    <Ionicons name="videocam" size={32} color="#1D3557" />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mediaName}>{selectedMedia.fileName || 'Selected Media'}</Text>
                                <Text style={styles.mediaSize}>
                                    {selectedMedia.fileSize ? `${(selectedMedia.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'}
                                </Text>
                                <Text style={{ color: '#1D3557', marginTop: 4, fontSize: 12 }}>Tap to view full size</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.removeButton} onPress={removeMedia}>
                            <Ionicons name="close-circle" size={24} color="#dc3545" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Full-screen media viewer */}
                {showMediaViewer && selectedMedia && (
                    <Modal
                        transparent
                        visible={showMediaViewer}
                        animationType="fade"
                        onRequestClose={() => setShowMediaViewer(false)}
                    >
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                            {/* Close button */}
                            <TouchableOpacity
                                onPress={() => setShowMediaViewer(false)}
                                style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }}
                            >
                                <Ionicons name="close-circle" size={36} color="#fff" />
                            </TouchableOpacity>

                            {/* Image preview - full width */}
                            <Image
                                source={{ uri: selectedMedia.uri }}
                                style={{ width: '95%', height: '70%' }}
                                resizeMode="contain"
                                onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                                onLoad={() => console.log('✅ Image loaded successfully')}
                            />

                            {/* File name at bottom */}
                            <Text style={{ color: '#fff', marginTop: 16, fontSize: 14 }}>
                                {selectedMedia.fileName || 'Selected Image'}
                            </Text>
                        </View>
                    </Modal>
                )}

                {/* Category Selection Modal */}
                <Modal
                    transparent
                    visible={showCategoryModal}
                    animationType="fade"
                    onRequestClose={() => setShowCategoryModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { padding: 0 }]}>
                            <View style={{
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: '#eee',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1D3357' }}>Select Category</Text>
                                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {Object.keys(CRIME_CATEGORIES)
                                    .filter(category => !openedCategories.includes(category))
                                    .map((category) => (
                                        <TouchableOpacity
                                            key={category}
                                            style={{
                                                padding: 16,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#f0f0f0',
                                                backgroundColor: '#fff',
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => {
                                                setOpenedCategories(prev => [...prev, category]);
                                                setShowCategoryModal(false);
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 16,
                                                color: '#333',
                                                fontWeight: '400'
                                            }}>
                                                {category}
                                            </Text>
                                            <Ionicons name="add" size={20} color="#1D3357" />
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>



                {/* Confirmation Dialog */}
                <Modal
                    visible={showConfirmDialog}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowConfirmDialog(false)}
                >
                    <View style={confirmStyles.overlay}>
                        <View style={confirmStyles.dialog}>
                            <View style={confirmStyles.iconContainer}>
                                <Ionicons name="shield-checkmark" size={60} color="#1D3557" />
                            </View>

                            <Text style={confirmStyles.title}>Confirm Submission</Text>

                            <Text style={confirmStyles.message}>
                                Your <Text style={confirmStyles.highlight}>IP address</Text> will be recorded for security and tracking purposes.
                            </Text>

                            <Text style={confirmStyles.subMessage}>
                                This helps ensure accountability and assists law enforcement in responding to reports.
                            </Text>

                            <Text style={confirmStyles.question}>Do you want to proceed?</Text>

                            <View style={confirmStyles.buttonContainer}>
                                <TouchableOpacity
                                    style={[confirmStyles.button, confirmStyles.cancelButton]}
                                    onPress={() => setShowConfirmDialog(false)}
                                    disabled={isSubmitting}
                                >
                                    <Text style={confirmStyles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[confirmStyles.button, confirmStyles.submitButton]}
                                    onPress={() => {
                                        console.log('🚀 User confirmed submission, calling submitReportData...');
                                        setShowConfirmDialog(false);
                                        submitReportData();
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={confirmStyles.submitButtonText}>Submit Report</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <CheckRow
                    label="Report Anonymously"
                    checked={isAnonymous}
                    onToggle={() => setIsAnonymous((v) => !v)}
                />

                <View style={styles.submitButton}>
                    <Button
                        title={isFlagged ? "Account Flagged - Cannot Submit" : (isSubmitting ? "Submitting..." : "Submit Report")}
                        onPress={handleSubmit}
                        color={isFlagged ? "#999" : "#1D3557"}
                        disabled={isSubmitting || isFlagged}
                    />
                </View>

                {isFlagged && (
                    <View style={{
                        backgroundColor: '#fee2e2',
                        borderLeftWidth: 4,
                        borderLeftColor: '#dc2626',
                        padding: 12,
                        marginTop: 12,
                        marginHorizontal: 12,
                        borderRadius: 6,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                            <Ionicons name="warning" size={18} color="#dc2626" style={{ marginTop: 2 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#991b1b', marginBottom: 4 }}>
                                    Account Flagged
                                </Text>
                                <Text style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 18 }}>
                                    Your account has been flagged. You are unable to submit new reports until the flag is lifted by an administrator.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {isSubmitting && (
                    <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 16 }}>
                        <ActivityIndicator size="large" color="#1D3557" />
                        <Text style={{ marginTop: 8, color: '#666' }}>Submitting your report...</Text>
                    </View>
                )}

                {/* Success Dialog */}
                {showSuccessDialog && (
                    <UpdateSuccessDialog
                        visible={showSuccessDialog}
                        title="Report Submitted!"
                        message="Your report has been submitted successfully. Thank you for helping make our community safer."
                        okText="View History"
                        onOk={() => {
                            setShowSuccessDialog(false);
                            // Reset form
                            setTitle('');
                            setSelectedCrimes([]);
                            setLocation('');
                            setBarangay('');
                            setBarangayId(null);
                            setStreetAddress('');
                            setDescription('');

                            setLocationCoordinates(null);
                            setIsAnonymous(false);
                            setSelectedMedia(null);
                            // Navigate to history
                            router.push('/history');
                        }}
                    />
                )}
            </ScrollView>

            {/* Item #2: Template Selection Modal */}
            <Modal
                visible={showTemplateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTemplateModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1D3557' }}>Select Template</Text>
                            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                                <Ionicons name="close" size={28} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {selectedCrimes.filter(crime => REPORT_TEMPLATES[crime]).map(crime => (
                                <TouchableOpacity
                                    key={crime}
                                    style={{
                                        backgroundColor: '#F5F5F5',
                                        padding: 16,
                                        borderRadius: 8,
                                        marginBottom: 12,
                                        borderWidth: 1,
                                        borderColor: '#ddd'
                                    }}
                                    onPress={() => {
                                        setDescription(REPORT_TEMPLATES[crime]);
                                        setShowTemplateModal(false);
                                    }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1D3557', marginBottom: 8 }}>{crime}</Text>
                                    <Text style={{ fontSize: 12, color: '#666', lineHeight: 18 }} numberOfLines={3}>
                                        {REPORT_TEMPLATES[crime]}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#E3F2FD',
                                    padding: 16,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: '#1D3557',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setDescription('');
                                    setShowTemplateModal(false);
                                }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1D3557' }}>Write Custom Description</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Location Picker Modal - Moved outside ScrollView */}
            {showLocationPicker && (
                <EnhancedLocationPicker
                    visible={showLocationPicker}
                    onClose={handleLocationPickerClose}
                    onLocationSelect={handleLocationSelect}
                />
            )}
        </View>
    );
}

const confirmStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialog: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 440,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1D3557',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 12,
    },
    highlight: {
        fontWeight: '700',
        color: '#1D3557',
    },
    subMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D3557',
        textAlign: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    cancelButton: {
        backgroundColor: '#f1f3f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#1D3557',
        shadowColor: '#1D3557',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
