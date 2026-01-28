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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
    const params = useLocalSearchParams();
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
    const [isAnonymous, setIsAnonymous] = useState(params.anonymous === 'true');
    const [selectedPhotoEvidence, setSelectedPhotoEvidence] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [selectedVideoEvidence, setSelectedVideoEvidence] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    type ConfirmSnapshot = {
        crimeTypes: string[];
        description: string;
        incidentDateTime: string;
        isAnonymous: boolean;
        locationText: string;
        streetAddress: string;
        barangay: string;
        barangayId: number | null;
        coordinates: { latitude: number; longitude: number } | null;
        requiresEvidence: boolean;
        mediaFiles: Array<{
            fileName?: string;
            fileSize?: number;
            type?: string;
            uri: string;
        }>;
    };

    const [confirmSnapshot, setConfirmSnapshot] = useState<ConfirmSnapshot | null>(null);
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

                    // Resolve address + barangay for the selected coordinates
                    resolveAndSetLocationFromCoords(latitude, longitude)
                        .catch(err => console.error('Resolve location error:', err));
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

                    await resolveAndSetLocationFromCoords(latitude, longitude);
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

    const deriveStreetFromAddress = (address?: string) => {
        const raw = (address || '').trim();
        if (!raw) return '';
        if (raw.toLowerCase().startsWith('location:')) return '';
        const first = raw.split(',')[0]?.trim() || '';
        // Avoid returning pure coordinates as street
        if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(first)) return '';
        return first;
    };

    const resolveAndSetLocationFromCoords = async (latitude: number, longitude: number) => {
        setLocationCoordinates({ latitude, longitude });

        // 1) Get barangay by coordinates (authoritative for this app)
        let barangayName = '';
        let barangayIdLocal: number | null = null;
        try {
            const brgyRes = await fetch(
                `${BACKEND_URL}/api/barangay/by-coordinates?latitude=${latitude}&longitude=${longitude}`
            );
            const brgyData = await brgyRes.json();
            if (brgyData?.success && brgyData?.barangay) {
                barangayName = brgyData.barangay.barangay_name || '';
                barangayIdLocal = brgyData.barangay.barangay_id ?? null;
                setBarangay(barangayName);
                setBarangayId(barangayIdLocal);
            }
        } catch (e) {
            console.warn('Barangay lookup failed:', (e as any)?.message || e);
        }

        // 2) Reverse geocode to get a human-friendly street/address
        let street = '';
        let fullAddress = '';
        try {
            const apiUrl = (Platform.OS === 'web' && typeof window !== 'undefined')
                ? `${window.location.protocol}//${window.location.host}/api/location/reverse`
                : `${BACKEND_URL}/api/location/reverse`;

            const res = await fetch(`${apiUrl}?lat=${latitude}&lon=${longitude}`);
            const addressData = await res.json();
            if (addressData?.success) {
                fullAddress = (addressData.address || addressData.display_name || '').trim();
                street = deriveStreetFromAddress(fullAddress);
            }
        } catch (e) {
            console.warn('Reverse geocode failed:', (e as any)?.message || e);
        }

        // 3) Ensure streetAddress is never empty (required for submit)
        if (!street) {
            if (barangayName) street = `Near ${barangayName}`;
            else street = 'Location auto-detected';
        }

        setStreetAddress(street);

        // Keep a full address string for payload/confirmation, even if UI doesn't preview it
        const composed = [street, barangayName, 'Davao City'].filter(Boolean).join(', ');
        setLocation(composed || fullAddress || '');
    };

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

    const pickEvidence = async (kind: 'photo' | 'video') => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please grant access to your media library to upload evidence.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: kind === 'photo' ? ['images'] : ['videos'],
            allowsEditing: kind === 'photo',
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const asset = result.assets[0];

            const maxSizeInBytes = 25 * 1024 * 1024;
            if (asset.fileSize && asset.fileSize > maxSizeInBytes) {
                Alert.alert('File Too Large', 'Your file is too big. Please select a file smaller than 25MB.');
                return;
            }

            if (kind === 'photo') {
                setSelectedPhotoEvidence(asset);
            } else {
                setSelectedVideoEvidence(asset);
            }
        }
    };

    const removePhotoEvidence = () => setSelectedPhotoEvidence(null);
    const removeVideoEvidence = () => setSelectedVideoEvidence(null);

    // Helper function to format file sizes
    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes <= 0) return 'Unknown size';
        const units = ['B', 'KB', 'MB', 'GB'];
        const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / Math.pow(1024, exp);
        return `${value.toFixed(value >= 10 || exp === 0 ? 0 : 1)} ${units[exp]}`;
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
            Alert.alert('Missing Information', 'Please select at least one crime type.');
            return;
        }
        console.log('✅ Crime types validated');


        // Item 10: Sensitive Content Detection
        const sensitiveWords = ['fuck', 'shit', 'bitch', 'asshole', 'gago', 'putangina', 'leche', 'bobo', 'tanga', 'piste', 'yawa', 'inutil'];
        const textToCheck = (description || '').toLowerCase();
        const foundSensitive = sensitiveWords.filter(word => textToCheck.includes(word));

        if (foundSensitive.length > 0) {
            console.log('❌ Validation failed: Sensitive content detected');
            Alert.alert(
                'Sensitive Content Detected',
                `Your report contains inappropriate language ("${foundSensitive[0]}").\n\nPlease remove it to maintain community guidelines.`
            );
            return;
        }

        if (!description.trim()) {
            console.log('❌ Validation failed: No description');
            Alert.alert('Missing Information', 'Please describe what happened in detail.');
            return;
        }
        console.log('✅ Description validated');

        // ⚠️ Evidence validation - Required for most crime types
        const EVIDENCE_OPTIONAL_CRIMES = [
            'Threats', 'Harassment', 'Missing Person', 'Suspicious Activity', 'Noise Complaint'
        ];

        const selectedCrimesLower = selectedCrimes.map(c => (c || '').toLowerCase().trim());
        const requiresEvidence = !selectedCrimesLower.some(crime =>
            EVIDENCE_OPTIONAL_CRIMES.map(c => c.toLowerCase()).includes(crime)
        );

        if (requiresEvidence && (!selectedPhotoEvidence || !selectedVideoEvidence)) {
            console.log('❌ Validation failed: Evidence required but not provided');
            Alert.alert(
                'Evidence Required',
                `Please upload BOTH a photo AND a video of this incident.\n\nThis helps police verify and respond faster to your report.\n\nEvidence is required for: ${selectedCrimes.join(', ')}`
            );
            return;
        }

        if (selectedPhotoEvidence || selectedVideoEvidence) {
            console.log('✅ Evidence provided');
        } else {
            console.log('ℹ️ Evidence optional for this crime type');
        }



        // Check if user is logged in
        console.log('👤 Current user from context:', user);
        console.log('🆔 User ID:', user?.id);

        if (!isAnonymous && (!user || !user.id)) {
            console.log('❌ Validation failed: User not logged in and not anonymous');
            Alert.alert('Authentication Required', 'You must be logged in to submit a report.');
            console.error('User not logged in:', user);
            return;
        }
        console.log('✅ User authenticated');

        // Street address and coordinates are required, barangay is optional (will be determined server-side)
        if (!streetAddress.trim()) {
            console.log('❌ Validation failed: No street address');
            Alert.alert(
                'Missing Information',
                'Please enter a street address.\n\nClick "Change Location" to add your street name, building, and house number.'
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
            Alert.alert(
                'Missing Information',
                'Location coordinates are missing. Please use the location picker to set a valid location.'
            );
            return;
        }
        console.log('✅ Location coordinates exist');

        // Validate coordinates are not 0,0
        if (locationCoordinates.latitude === 0 && locationCoordinates.longitude === 0) {
            console.log('❌ Validation failed: Invalid coordinates (0,0)');
            Alert.alert(
                'Invalid Location',
                'The location has invalid coordinates. Please select a valid location using the map.'
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
            Alert.alert(
                'We Only Accept Reports Within Davao City',
                geofenceValidation.errorMessage ||
                'The selected location is outside Davao City boundaries.\n\nPlease go back and select a location within Davao City to proceed with your report.'
            );
            return;
        }
        console.log('✅ Final geofence check passed - location is within Davao City');

        console.log('✅ All validations passed');
        console.log('📢 About to show confirmation...');

        // Keep incident datetime logic consistent with submit payload (Asia/Manila, UTC+8)
        const getManilaIncidentDateTime = () => {
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

            return {
                payload: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
                display: `${month}/${day}/${year} ${hour}:${minute}:${second} (Asia/Manila)`
            };
        };

        const incident = getManilaIncidentDateTime();

        setConfirmSnapshot({
            crimeTypes: [...selectedCrimes],
            description: description.trim(),
            incidentDateTime: incident.display,
            isAnonymous,
            locationText: (location || '').trim(),
            streetAddress: (streetAddress || '').trim(),
            barangay: (barangay || '').trim(),
            barangayId,
            coordinates: locationCoordinates
                ? { latitude: locationCoordinates.latitude, longitude: locationCoordinates.longitude }
                : null,
            requiresEvidence,
            mediaFiles: [
                ...(selectedPhotoEvidence
                    ? [{
                        uri: selectedPhotoEvidence.uri,
                        fileName: selectedPhotoEvidence.fileName ?? undefined,
                        fileSize: selectedPhotoEvidence.fileSize ?? undefined,
                        type: selectedPhotoEvidence.type ?? undefined,
                    }]
                    : []),
                ...(selectedVideoEvidence
                    ? [{
                        uri: selectedVideoEvidence.uri,
                        fileName: selectedVideoEvidence.fileName ?? undefined,
                        fileSize: selectedVideoEvidence.fileSize ?? undefined,
                        type: selectedVideoEvidence.type ?? undefined,
                    }]
                    : []),
            ],
        });

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
                mediaFiles: [
                    ...(selectedPhotoEvidence
                        ? [{
                            uri: selectedPhotoEvidence.uri,
                            fileName: selectedPhotoEvidence.fileName ?? undefined,
                            fileSize: selectedPhotoEvidence.fileSize ?? undefined,
                            type: selectedPhotoEvidence.type ?? undefined,
                        }]
                        : []),
                    ...(selectedVideoEvidence
                        ? [{
                            uri: selectedVideoEvidence.uri,
                            fileName: selectedVideoEvidence.fileName ?? undefined,
                            fileSize: selectedVideoEvidence.fileSize ?? undefined,
                            type: selectedVideoEvidence.type ?? undefined,
                        }]
                        : []),
                ],
                userId: user?.id || '0',
            };

            console.log('📋 Report Data:');
            console.log('   Crime Types:', reportData.crimeTypes);
            console.log('   Location:', reportData.location);
            console.log('   Coordinates:', { lat: reportData.latitude, lng: reportData.longitude });
            console.log('   Has Media:', (reportData.mediaFiles?.length || 0) > 0);
            console.log('   Anonymous:', reportData.isAnonymous);
            console.log('   User ID:', reportData.userId);

            // Submit the report
            console.log('\n🚀 Calling reportService.submitReport()...');
            const response = await reportService.submitReport(reportData);

            console.log('✅ Report submitted successfully!');
            console.log('Response:', response);

            // Store success data to show in dialog
            const locationStr = location.trim() || streetAddress.trim() || barangay?.trim() || 'Location recorded';
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

            Alert.alert('Submission Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Anonymous Warning Banner */}
            {isAnonymous && (
                <View style={{ backgroundColor: '#fff3cd', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ffeeba' }}>
                    <Text style={{ color: '#856404', fontWeight: 'bold' }}>⚠️ You are reporting anonymously</Text>
                    <Text style={{ color: '#856404', fontSize: 12 }}>You will not receive updates for this report.</Text>
                </View>
            )}
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
                            Not sure which category to choose? If you&apos;re confused, please check the definitions above for guidance.
                        </Text>
                    </View>
                </View>

                <Text style={styles.label}>Location *</Text>

                {/* Minimal Location Info (no map/coordinate preview) */}
                <View style={{
                    backgroundColor: '#f5f5f5',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                }}>
                    <Text style={{ fontSize: 13, color: '#1D3557', fontWeight: '600' }}>
                        {barangay ? `Barangay: ${barangay}` : 'Barangay: Detecting...'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                        {streetAddress ? `Street: ${streetAddress}` : 'Street: Detecting...'}
                    </Text>
                </View>

                <TouchableOpacity style={styles.locationButton} onPress={handleUseLocation}>
                    <Ionicons name="location" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.locationButtonText}>
                        Change Location
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

                <Text style={styles.label}>Evidence (Photo + Video) *</Text>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8, marginTop: -8 }}>
                    Required for most crime types. If required, upload BOTH a photo AND a video of the incident, damage, or suspect.
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.mediaButton, { flex: 1 }, isFlagged && { opacity: 0.6 }]}
                        onPress={isFlagged ? undefined : () => pickEvidence('photo')}
                    >
                        <Ionicons name="image-outline" size={24} color="#1D3557" />
                        <Text style={styles.mediaButtonText}>Select Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mediaButton, { flex: 1 }, isFlagged && { opacity: 0.6 }]}
                        onPress={isFlagged ? undefined : () => pickEvidence('video')}
                    >
                        <Ionicons name="videocam-outline" size={24} color="#1D3557" />
                        <Text style={styles.mediaButtonText}>Select Video</Text>
                    </TouchableOpacity>
                </View>

                {(selectedPhotoEvidence || selectedVideoEvidence) && (
                    <View style={{ marginTop: 12 }}>
                        {selectedPhotoEvidence && (
                            <View style={styles.mediaPreviewContainer}>
                                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowMediaViewer(true)}>
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
                                            source={{ uri: selectedPhotoEvidence.uri }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mediaName}>{selectedPhotoEvidence.fileName || 'Selected Photo'}</Text>
                                        <Text style={styles.mediaSize}>{formatBytes(selectedPhotoEvidence.fileSize)}</Text>
                                        <Text style={{ color: '#1D3557', marginTop: 4, fontSize: 12 }}>Tap to view</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.removeButton} onPress={removePhotoEvidence}>
                                    <Ionicons name="close-circle" size={24} color="#dc3545" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedVideoEvidence && (
                            <View style={styles.mediaPreviewContainer}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
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
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mediaName}>{selectedVideoEvidence.fileName || 'Selected Video'}</Text>
                                        <Text style={styles.mediaSize}>{formatBytes(selectedVideoEvidence.fileSize)}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.removeButton} onPress={removeVideoEvidence}>
                                    <Ionicons name="close-circle" size={24} color="#dc3545" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Full-screen photo viewer */}
                {showMediaViewer && selectedPhotoEvidence && (
                    <Modal
                        transparent
                        visible={showMediaViewer}
                        animationType="fade"
                        onRequestClose={() => setShowMediaViewer(false)}
                    >
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={() => setShowMediaViewer(false)}
                                style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }}
                            >
                                <Ionicons name="close-circle" size={36} color="#fff" />
                            </TouchableOpacity>

                            <Image
                                source={{ uri: selectedPhotoEvidence.uri }}
                                style={{ width: '95%', height: '70%' }}
                                resizeMode="contain"
                                onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                                onLoad={() => console.log('✅ Image loaded successfully')}
                            />

                            <Text style={{ color: '#fff', marginTop: 16, fontSize: 14 }}>
                                {selectedPhotoEvidence.fileName || 'Selected Photo'}
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
                    onRequestClose={() => {
                        setShowConfirmDialog(false);
                        setConfirmSnapshot(null);
                    }}
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

                            <View style={confirmStyles.detailsContainer}>
                                <Text style={confirmStyles.detailsTitle}>Review your report details</Text>
                                <ScrollView style={confirmStyles.detailsScroll} contentContainerStyle={confirmStyles.detailsScrollContent}>
                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Crime type(s)</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {(confirmSnapshot?.crimeTypes?.length ? confirmSnapshot.crimeTypes : selectedCrimes).join(', ') || 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Description</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {confirmSnapshot?.description ?? description.trim()}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Incident time</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {confirmSnapshot?.incidentDateTime || 'Will be recorded at submission time (Asia/Manila)'}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Anonymous</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {(confirmSnapshot?.isAnonymous ?? isAnonymous) ? 'Yes' : 'No'}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Location</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {(
                                                confirmSnapshot?.locationText ||
                                                location.trim() ||
                                                streetAddress.trim() ||
                                                barangay?.trim() ||
                                                'Location recorded'
                                            )}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Street address</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {confirmSnapshot?.streetAddress || streetAddress.trim()}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Barangay</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {(confirmSnapshot?.barangay || barangay?.trim())
                                                ? `${confirmSnapshot?.barangay || barangay?.trim()}${(confirmSnapshot?.barangayId ?? barangayId) ? ` (ID: ${confirmSnapshot?.barangayId ?? barangayId})` : ''}`
                                                : 'Auto-detected server-side'}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Coordinates</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {(() => {
                                                const coords = confirmSnapshot?.coordinates || locationCoordinates;
                                                if (!coords) return 'N/A';
                                                return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
                                            })()}
                                        </Text>
                                    </View>

                                    <View style={confirmStyles.detailRow}>
                                        <Text style={confirmStyles.detailLabel}>Evidence</Text>
                                        <Text style={confirmStyles.detailValue}>
                                            {(() => {
                                                const mediaFiles = (confirmSnapshot?.mediaFiles && confirmSnapshot.mediaFiles.length > 0)
                                                    ? confirmSnapshot.mediaFiles
                                                    : [
                                                        ...(selectedPhotoEvidence ? [{
                                                            uri: selectedPhotoEvidence.uri,
                                                            fileName: selectedPhotoEvidence.fileName ?? undefined,
                                                            fileSize: selectedPhotoEvidence.fileSize ?? undefined,
                                                            type: selectedPhotoEvidence.type ?? undefined,
                                                        }] : []),
                                                        ...(selectedVideoEvidence ? [{
                                                            uri: selectedVideoEvidence.uri,
                                                            fileName: selectedVideoEvidence.fileName ?? undefined,
                                                            fileSize: selectedVideoEvidence.fileSize ?? undefined,
                                                            type: selectedVideoEvidence.type ?? undefined,
                                                        }] : []),
                                                    ];

                                                if (!mediaFiles || mediaFiles.length === 0) {
                                                    const required = confirmSnapshot?.requiresEvidence ?? false;
                                                    return required ? 'Required (missing photo + video)' : 'None (optional for selected crime types)';
                                                }

                                                return mediaFiles
                                                    .map((m) => {
                                                        const name = m.fileName || 'Selected file';
                                                        const type = m.type ? ` • ${m.type}` : '';
                                                        const size = m.fileSize ? ` • ${formatBytes(m.fileSize)}` : '';
                                                        return `${name}${type}${size}`;
                                                    })
                                                    .join(' | ');
                                            })()}
                                        </Text>
                                    </View>
                                </ScrollView>
                            </View>

                            <Text style={confirmStyles.question}>Do you want to proceed?</Text>

                            <View style={confirmStyles.buttonContainer}>
                                <TouchableOpacity
                                    style={[confirmStyles.button, confirmStyles.cancelButton]}
                                    onPress={() => {
                                        setShowConfirmDialog(false);
                                        setConfirmSnapshot(null);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <Text style={confirmStyles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[confirmStyles.button, confirmStyles.submitButton]}
                                    onPress={() => {
                                        console.log('🚀 User confirmed submission, calling submitReportData...');
                                        setShowConfirmDialog(false);
                                        setConfirmSnapshot(null);
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

                {/* Anonymous mode is set from login screen params */}

                <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting || isFlagged}
                        style={{
                            backgroundColor: isFlagged ? "#999" : "#1D3557",
                            paddingVertical: 18,
                            paddingHorizontal: 32,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            elevation: 4,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4.65,
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 }}>
                            {isFlagged ? "Account Flagged - Cannot Submit" : (isSubmitting ? "Submitting..." : "Submit Report")}
                        </Text>
                    </TouchableOpacity>
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
                            setSelectedPhotoEvidence(null);
                            setSelectedVideoEvidence(null);
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
                    initialLocation={{
                        barangay,
                        barangay_id: typeof barangayId === 'number' ? barangayId : undefined,
                        street_address: streetAddress,
                        full_address: location,
                        latitude: typeof locationCoordinates?.latitude === 'number' ? locationCoordinates.latitude : undefined,
                        longitude: typeof locationCoordinates?.longitude === 'number' ? locationCoordinates.longitude : undefined,
                    }}
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
    detailsContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        padding: 12,
        marginBottom: 16,
    },
    detailsTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    detailsScroll: {
        maxHeight: 260,
    },
    detailsScrollContent: {
        paddingBottom: 4,
    },
    detailRow: {
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 14,
        color: '#111827',
        lineHeight: 20,
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
