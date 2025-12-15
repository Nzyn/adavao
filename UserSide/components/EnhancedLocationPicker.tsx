import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { validateDavaoLocation, isInsideDavaoCity } from '../utils/geofence';

import { BACKEND_URL } from '../config/backend';

// Conditional WebView import for native platforms only

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

interface Barangay {
    barangay_id: number;
    barangay_name: string;
    latitude: number | null;
    longitude: number | null;
    station_id: number;
}

interface AddressSuggestion {
    display_name: string;
    lat: string;
    lon: string;
}

interface LocationData {
    barangay: string;
    barangay_id: number;
    street_address: string;
    full_address: string;
    latitude: number;
    longitude: number;
}

interface EnhancedLocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onLocationSelect: (data: LocationData) => void;
}

const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
    visible,
    onClose,
    onLocationSelect,
}) => {
    const [barangays, setBarangays] = useState<Barangay[]>([]);
    const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
    const [streetAddress, setStreetAddress] = useState('');
    const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
    const [barangaySearch, setBarangaySearch] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [mapCoordinates, setMapCoordinates] = useState<{ latitude: number; longitude: number }>({
        latitude: 7.0731,
        longitude: 125.6128,
    });
    const [loading, setLoading] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);
    const [barangaysError, setBarangaysError] = useState<string | null>(null);
    const [mapLocationSet, setMapLocationSet] = useState(false);
    const [barangayAutoDetected, setBarangayAutoDetected] = useState(false);
    const [isLocationValid, setIsLocationValid] = useState(true); // Track if current location is within Davao
    const [isMapInteractive, setIsMapInteractive] = useState(false); // Track if map is interactive
    const addressTimeoutRef = useRef<any>(null);
    const webViewRef = useRef<any>(null);

    // Fetch barangays on mount
    useEffect(() => {
        if (visible) {
            fetchBarangays();
        }
    }, [visible]);

    const fetchBarangays = async () => {
        try {
            console.log('🔄 Fetching barangays from:', `${BACKEND_URL}/api/barangays`);
            setLoadingBarangays(true);
            setBarangaysError(null);

            const response = await fetch(`${BACKEND_URL}/api/barangays`);
            console.log('📡 Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Barangays received:', data);

                if (data.success && data.data && Array.isArray(data.data)) {
                    console.log('📍 Total barangays loaded:', data.data.length);
                    setBarangays(data.data);
                    setBarangaysError(null);
                } else {
                    console.error('❌ Invalid response format:', data);
                    setBarangaysError('Invalid data format received');
                    Alert.alert('Error', 'Failed to load barangays: Invalid response format');
                }
            } else {
                console.error('❌ Request failed with status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                setBarangaysError(`Server error: ${response.status}`);
                Alert.alert('Error', `Failed to load barangays: Server error ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error fetching barangays:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setBarangaysError(errorMsg);
            Alert.alert('Error', `Failed to load barangays: ${errorMsg}`);
        } finally {
            setLoadingBarangays(false);
        }
    };

    // Handle barangay selection
    const handleBarangaySelect = (barangay: Barangay) => {
        setSelectedBarangay(barangay);
        setBarangaySearch(barangay.barangay_name);
        setShowBarangayDropdown(false);
        setBarangayAutoDetected(false); // User manually selected, not auto-detected

        // Update map to barangay center only if coordinates exist
        if (barangay.latitude && barangay.longitude) {
            setMapCoordinates({
                latitude: barangay.latitude,
                longitude: barangay.longitude,
            });
            updateMapLocation(barangay.latitude, barangay.longitude);
        } else {
            // Keep current map position if barangay has no coordinates
            console.log(`⚠️ Barangay '${barangay.barangay_name}' has no coordinates - keeping current map position`);
        }
    };

    // Filter barangays based on search
    const filteredBarangays = barangays.filter(b =>
        b.barangay_name.toLowerCase().includes(barangaySearch.toLowerCase())
    );

    // Handle street address input with autocomplete
    const handleStreetAddressChange = (text: string) => {
        setStreetAddress(text);

        // Clear previous timeout
        if (addressTimeoutRef.current) {
            clearTimeout(addressTimeoutRef.current);
        }

        // Set new timeout for autocomplete
        if (text.length > 2) {
            addressTimeoutRef.current = setTimeout(() => {
                searchAddressSuggestions(text);
            }, 500);
        } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    };

    // Search address suggestions - Google Maps style
    const searchAddressSuggestions = async (query: string) => {
        try {
            console.log('🔍 [Autocomplete] Searching for:', query);
            setLoading(true);

            // Simple query - backend handles Davao City filtering
            const searchQuery = query.trim();

            console.log('📡 [Autocomplete] API call:', `${BACKEND_URL}/api/location/search?q=${encodeURIComponent(searchQuery)}`);

            const response = await fetch(
                `${BACKEND_URL}/api/location/search?q=${encodeURIComponent(searchQuery)}`
            );

            console.log('📥 [Autocomplete] Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📦 [Autocomplete] Response data:', data);

                if (data.success && data.results && data.results.length > 0) {
                    console.log(`✅ [Autocomplete] Found ${data.results.length} suggestions`);
                    setAddressSuggestions(data.results.slice(0, 5));
                    setShowAddressSuggestions(true);
                } else {
                    console.log('⚠️ [Autocomplete] No results found');
                    setAddressSuggestions([]);
                    setShowAddressSuggestions(false);
                }
            } else {
                console.error('❌ [Autocomplete] API error:', response.status);
                setAddressSuggestions([]);
                setShowAddressSuggestions(false);
            }
        } catch (error) {
            console.error('❌ [Autocomplete] Error searching addresses:', error);
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        } finally {
            setLoading(false);
        }
    };

    // Handle address suggestion selection
    const handleAddressSuggestionSelect = (suggestion: AddressSuggestion) => {
        setStreetAddress(suggestion.display_name);
        setShowAddressSuggestions(false);

        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);

        setMapCoordinates({ latitude: lat, longitude: lon });
        updateMapLocation(lat, lon);

        // If no barangay selected, try to determine it from coordinates
        if (!selectedBarangay) {
            determineBarangayFromCoordinates(lat, lon);
        }
    };

    // Determine barangay from street address using reverse geocoding
    const determineBarangayFromCoordinates = async (lat: number, lon: number, addressComponents: any = null) => {
        console.log('🔍 Determining barangay from coordinates:', { lat, lon });

        // First, try to get barangay from provided address components (from reverse geocoding)
        if (addressComponents) {
            try {
                console.log('🗺️ Using provided address components:', addressComponents);

                // Construct a string to search for - prioritize likely barangay fields
                // Nominatim often puts barangay in: village, suburb, residential, neighbourhood, quarter
                const potentialBarangayNames = [
                    addressComponents.village,
                    addressComponents.suburb,
                    addressComponents.residential,
                    addressComponents.neighbourhood,
                    addressComponents.quarter,
                    addressComponents.city_district
                ].filter(Boolean); // Remove null/undefined

                console.log('🔍 Checking potential barangay names:', potentialBarangayNames);

                for (const name of potentialBarangayNames) {
                    const matchedBarangay = barangays.find(b =>
                        b.barangay_name.toLowerCase().includes(name.toLowerCase()) ||
                        name.toLowerCase().includes(b.barangay_name.toLowerCase())
                    );

                    if (matchedBarangay) {
                        console.log('✅ Barangay matched from address component:', matchedBarangay.barangay_name);
                        setSelectedBarangay(matchedBarangay);
                        setBarangaySearch(matchedBarangay.barangay_name);
                        setShowBarangayDropdown(false);
                        setBarangayAutoDetected(true);
                        return; // Successfully found barangay
                    }
                }
            } catch (error) {
                console.log('⚠️ Error matching address components:', error);
            }
        }

        // Fallback: Try coordinate-based barangay detection (Database PIP)
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/barangay/by-coordinates?latitude=${lat}&longitude=${lon}`
            );

            console.log('🔍 Barangay API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('🔍 Barangay API response data:', data);

                if (data.success && data.barangay) {
                    console.log('✅ Barangay found:', data.barangay);
                    const barangay = barangays.find(b => b.barangay_id === data.barangay.barangay_id);
                    if (barangay) {
                        console.log('✅ Matching barangay in list:', barangay.barangay_name);
                        setSelectedBarangay(barangay);
                        setBarangaySearch(barangay.barangay_name);
                        setShowBarangayDropdown(false);
                        setBarangayAutoDetected(true);
                        console.log('✅ Barangay auto-selected and dropdown closed:', barangay.barangay_name);
                    } else {
                        console.log('⚠️ Barangay not found in local list:', data.barangay.barangay_id);
                    }
                } else {
                    console.log('⚠️ No barangay data in response or not successful');
                }
            } else {
                console.log('❌ Barangay API request failed with status:', response.status);
            }
        } catch (error) {
            console.error('❌ Error determining barangay:', error);
        }
    };

    // Use current location
    const handleUseCurrentLocation = async () => {
        try {
            setLoadingLocation(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please grant location permission to use this feature.');
                return;
            }


            // Wrap get current position in a timeout promise (15 seconds)
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Location request timed out. Please make sure GPS is enabled and try again, or select manually on map.')), 15000)
            );

            const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

            const { latitude, longitude } = location.coords;

            // Validate GPS location is within Davao City (GEOFENCE CHECK)
            console.log('🚧 Checking geofence for GPS location:', { latitude, longitude });
            const geofenceValidation = validateDavaoLocation(latitude, longitude);

            if (!geofenceValidation.isValid) {
                console.log('❌ GPS location outside Davao City:', geofenceValidation.errorMessage);
                Alert.alert(
                    'We Only Accept Reports Within Davao City',
                    'Your current GPS location appears to be outside Davao City boundaries.\n\n' +
                    'AlertDavao only accepts reports from locations within Davao City.\n\n' +
                    'Please manually select a location on the map if you are in Davao City, or move to a location within Davao City.',
                    [{
                        text: 'Select Manually on Map',
                        style: 'default',
                        onPress: () => {
                            console.log('🔄 User will manually select location on map');
                        }
                    }]
                );
                return;
            }

            console.log('✅ GPS location within Davao City boundaries');

            setMapCoordinates({ latitude, longitude });
            updateMapLocation(latitude, longitude);

            // Reverse geocode to get address
            const response = await fetch(
                `${BACKEND_URL}/api/location/reverse?lat=${latitude}&lon=${longitude}`
            );

            let rawAddress = null;
            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                if (data.success) {
                    // Try to get address from structured address object or fallback to display_name
                    const addr = data.address || data.display_name;
                    if (addr) {
                        console.log('🏠 Reverse geocoded address (GPS):', addr);
                        setStreetAddress(addr);
                    }

                    if (data.raw && data.raw.address) {
                        rawAddress = data.raw.address;
                    }
                }
            }

            await determineBarangayFromCoordinates(latitude, longitude, rawAddress);

        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert('Error', 'Failed to get current location. Please try again.');
        } finally {
            setLoadingLocation(false);
        }
    };

    // Update map location
    const updateMapLocation = (lat: number, lon: number) => {
        if (Platform.OS === 'web') {
            const iframe = document.getElementById('location-map-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                    { type: 'updateLocation', latitude: lat, longitude: lon },
                    '*'
                );
            }
        } else if (webViewRef.current) {
            webViewRef.current.postMessage(
                JSON.stringify({ type: 'updateLocation', latitude: lat, longitude: lon })
            );
        }
    };

    // Handle map click
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMessage = (event: MessageEvent) => {
                console.log('🔔 Message received:', event.data);

                if (event.data && event.data.type === 'locationOutOfBounds') {
                    const { latitude, longitude } = event.data;
                    console.log('❌ Location out of bounds:', { latitude, longitude });

                    setIsLocationValid(false);

                    Alert.alert(
                        'Location Outside Davao City',
                        'The marker went outside Davao City boundaries.\n\n' +
                        'Please select a location within Davao City to continue.',
                        [{
                            text: 'OK',
                            style: 'default'
                        }]
                    );
                    return;
                }

                if (event.data && event.data.type === 'locationSelected') {
                    const { latitude, longitude } = event.data;
                    console.log('📍 Map location selected:', { latitude, longitude });
                    console.log('📍 Previous coordinates:', mapCoordinates);

                    // Validate map click location is within Davao City (GEOFENCE CHECK)
                    console.log('🚧 Checking geofence for map click:', { latitude, longitude });
                    if (!isInsideDavaoCity(latitude, longitude)) {
                        console.log('❌ Map click outside Davao City');
                        setIsLocationValid(false);
                        Alert.alert(
                            'We Only Accept Reports Within Davao City',
                            'The selected location is outside Davao City boundaries.\n\n' +
                            'Please click on a location within Davao City to continue.',
                            [{
                                text: 'Try Again',
                                style: 'default',
                                onPress: () => {
                                    console.log('🔄 User will click another location on map');
                                }
                            }]
                        );
                        // Do not update coordinates - keep previous valid location
                        return;
                    }

                    console.log('✅ Map click within Davao City boundaries');
                    setIsLocationValid(true);

                    setMapCoordinates({ latitude, longitude });
                    setMapLocationSet(true);
                    console.log('📍 Map coordinates updated, mapLocationSet:', true);

                    // Reverse geocode
                    fetch(`${BACKEND_URL}/api/location/reverse?lat=${latitude}&lon=${longitude}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                const addr = data.address || data.display_name;
                                if (addr) {
                                    console.log('🏠 Reverse geocoded address (Web):', addr);
                                    setStreetAddress(addr);
                                } else {
                                    console.warn('⚠️ No address found in reverse geocode response');
                                }

                            }

                            // Determine barangay using raw address components if available
                            const rawAddress = (data.success && data.raw && data.raw.address) ? data.raw.address : null;
                            console.log('🔍 Calling determineBarangayFromCoordinates (web) with address:', rawAddress);
                            determineBarangayFromCoordinates(latitude, longitude, rawAddress);
                        })
                        .catch(err => {
                            console.error('Reverse geocode error (Web):', err);
                            // Set coordinates as fallback address when geocode fails
                            const fallbackAddr = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                            setStreetAddress(fallbackAddr);
                            determineBarangayFromCoordinates(latitude, longitude);
                        });
                }
            };

            console.log('📡 Setting up message listener for web platform');
            window.addEventListener('message', handleMessage);
            return () => {
                console.log('📡 Removing message listener');
                window.removeEventListener('message', handleMessage);
            };
        }
    }, [barangays]);

    // Handle confirm
    const handleConfirm = () => {
        console.log('🔍 Confirm clicked - Current state:', {
            selectedBarangay: selectedBarangay?.barangay_name,
            selectedBarangay_id: selectedBarangay?.barangay_id,
            streetAddress,
            streetAddressLength: streetAddress.length,
            streetAddressTrimmed: streetAddress.trim(),
            mapCoordinates,
            mapCoordinates_lat: mapCoordinates.latitude,
            mapCoordinates_lng: mapCoordinates.longitude,
            mapLocationSet,
            hasLatitude: !!mapCoordinates.latitude,
            hasLongitude: !!mapCoordinates.longitude,
        });

        // Barangay is now optional - will be determined server-side if not found

        if (!streetAddress.trim()) {
            console.log('❌ No street address');
            Alert.alert(
                'Missing Information',
                'Please enter your street address, building, and house number in the text field above.'
            );
            return;
        }

        // Validate that we have valid coordinates
        if (!mapCoordinates.latitude || !mapCoordinates.longitude) {
            console.log('❌ Invalid coordinates:', {
                latitude: mapCoordinates.latitude,
                longitude: mapCoordinates.longitude,
                hasLat: !!mapCoordinates.latitude,
                hasLng: !!mapCoordinates.longitude
            });
            Alert.alert(
                'Invalid Location',
                'Please select a valid location on the map or use your current location.'
            );
            return;
        }

        // Validate location is within Davao City boundaries (GEOFENCE CHECK)
        console.log('🚧 Checking geofence for coordinates:', {
            latitude: mapCoordinates.latitude,
            longitude: mapCoordinates.longitude
        });

        const geofenceValidation = validateDavaoLocation(
            mapCoordinates.latitude,
            mapCoordinates.longitude
        );

        if (!geofenceValidation.isValid) {
            console.log('❌ Location outside Davao City:', geofenceValidation.errorMessage);
            Alert.alert(
                'We Only Accept Reports Within Davao City',
                geofenceValidation.errorMessage ||
                'The selected location is outside Davao City boundaries.\n\n' +
                'Please select a different location within Davao City to proceed with your report.',
                [{
                    text: 'Select Another Location',
                    style: 'default',
                    onPress: () => {
                        // Keep the modal open, allow user to try again
                        console.log('🔄 User will select another location within Davao City');
                    }
                }]
            );
            // DO NOT close modal - keep it open so user can try selecting another location
            return;
        }

        console.log('✅ Location within Davao City boundaries');

        // Build the data object - barangay can be null if not found
        const fullAddress = selectedBarangay
            ? `Mindanao, Davao Del Sur, Davao City, ${selectedBarangay.barangay_name}`
            : `Mindanao, Davao Del Sur, Davao City`;

        const dataToSend = {
            barangay: selectedBarangay ? selectedBarangay.barangay_name : null,
            barangay_id: selectedBarangay ? selectedBarangay.barangay_id : null,
            street_address: streetAddress,
            full_address: fullAddress,
            latitude: mapCoordinates.latitude,
            longitude: mapCoordinates.longitude,
        };

        console.log('✅ All validations passed, confirming location:', dataToSend);
        if (!selectedBarangay) {
            console.log('⚠️ Barangay not found in list - will be determined server-side from coordinates');
        }
        console.log('📤 Calling onLocationSelect with data...');

        onLocationSelect(dataToSend);

        console.log('📤 onLocationSelect called, closing modal...');
        handleClose();
    };

    const handleClose = () => {
        console.log('🔄 Closing location picker - resetting all state');

        // Reset all form fields
        setSelectedBarangay(null);
        setBarangaySearch('');
        setStreetAddress('');
        setAddressSuggestions([]);
        setShowBarangayDropdown(false);
        setShowAddressSuggestions(false);
        setMapLocationSet(false);
        setBarangayAutoDetected(false);
        setIsLocationValid(true);
        setIsMapInteractive(false);

        // Reset map coordinates to Davao City center
        setMapCoordinates({
            latitude: 7.0731,
            longitude: 125.6128,
        });

        // Clear any pending timeouts
        if (addressTimeoutRef.current) {
            clearTimeout(addressTimeoutRef.current);
            addressTimeoutRef.current = null;
        }

        console.log('✅ Location picker state reset complete');
        onClose();
    };

    const mapHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { width: 100%; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                // Davao City boundaries - Strict enforcement
                // Based on administrative boundary level 6
                var davaoBounds = L.latLngBounds(
                    L.latLng(6.85, 125.20),  // Southwest corner
                    L.latLng(7.40, 125.75)   // Northeast corner
                );
                
                var map = L.map('map', {
                    maxBounds: davaoBounds,
                    maxBoundsViscosity: 1.0,  // Prevent dragging outside bounds
                    minZoom: 11,
                    maxZoom: 18
                }).setView([${mapCoordinates?.latitude || 7.0731}, ${mapCoordinates?.longitude || 125.6128}], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    bounds: davaoBounds
                }).addTo(map);

                // Add visual indicator of Davao City boundary
                var davaoPolygon = L.polygon([
                    [7.38, 125.45], [7.35, 125.55], [7.30, 125.65],
                    [7.25, 125.70], [7.20, 125.72], [7.15, 125.73],
                    [7.10, 125.72], [7.05, 125.70], [7.00, 125.68],
                    [6.95, 125.65], [6.90, 125.60], [6.88, 125.55],
                    [6.87, 125.50], [6.88, 125.45], [6.90, 125.40],
                    [6.95, 125.35], [7.00, 125.30], [7.05, 125.25],
                    [7.10, 125.23], [7.15, 125.22], [7.20, 125.23],
                    [7.25, 125.25], [7.30, 125.30], [7.35, 125.35]
                ], {
                    color: '#FF6B6B',
                    weight: 2,
                    fillOpacity: 0.05,
                    dashArray: '5, 10'
                }).addTo(map);

                var marker = L.marker([${mapCoordinates?.latitude || 7.0731}, ${mapCoordinates?.longitude || 125.6128}], {
                    draggable: true
                }).addTo(map);

                // Function to check if point is inside Davao City
                function isInsideDavao(lat, lng) {
                    return lat >= 6.85 && lat <= 7.40 && lng >= 125.20 && lng <= 125.75;
                }

                // Store the last valid position
                var lastValidPosition = [${mapCoordinates?.latitude || 7.0731}, ${mapCoordinates?.longitude || 125.6128}];

                function sendMessage(data) {
                    console.log('Posting message:', data);
                    // Web Platform
                    if (window.parent) {
                        window.parent.postMessage(data, '*');
                    }
                    // Mobile Platform (React Native WebView)
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify(data));
                    }
                }

                marker.on('dragend', function(e) {
                    var pos = marker.getLatLng();
                    console.log('Marker dragged to:', pos.lat, pos.lng);
                    
                    if (isInsideDavao(pos.lat, pos.lng)) {
                        console.log('Position is inside Davao City - updating coordinates');
                        lastValidPosition = [pos.lat, pos.lng];
                        sendMessage({
                            type: 'locationSelected',
                            latitude: pos.lat,
                            longitude: pos.lng
                        });
                    } else {
                        console.log('Position is OUTSIDE Davao City - showing alert');
                        // Snap back to last valid position
                        marker.setLatLng(lastValidPosition);
                        
                        // Send message to show alert
                        sendMessage({
                            type: 'locationOutOfBounds',
                            latitude: pos.lat,
                            longitude: pos.lng
                        });
                    }
                });

                map.on('click', function(e) {
                    console.log('Map clicked at:', e.latlng.lat, e.latlng.lng);
                    
                    if (isInsideDavao(e.latlng.lat, e.latlng.lng)) {
                        console.log('Click is inside Davao City - updating marker');
                        lastValidPosition = [e.latlng.lat, e.latlng.lng];
                        marker.setLatLng(e.latlng);
                        sendMessage({
                            type: 'locationSelected',
                            latitude: e.latlng.lat,
                            longitude: e.latlng.lng
                        });
                    } else {
                        console.log('Click is OUTSIDE Davao City - showing alert');
                        sendMessage({
                            type: 'locationOutOfBounds',
                            latitude: e.latlng.lat,
                            longitude: e.latlng.lng
                        });
                    }
                });

                window.addEventListener('message', function(event) {
                    if (event.data.type === 'updateLocation') {
                        var newPos = [event.data.latitude, event.data.longitude];
                        if (isInsideDavao(newPos[0], newPos[1])) {
                            lastValidPosition = newPos;
                            marker.setLatLng(newPos);
                            map.setView(newPos, 15);
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={localStyles.container}>
                {/* Header */}
                <View style={localStyles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={localStyles.headerTitle}>Select Location</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView
                    style={localStyles.content}
                    scrollEnabled={!isMapInteractive}
                >
                    {/* Location Display */}
                    <View style={localStyles.locationDisplay}>
                        <Text style={localStyles.locationText}>
                            Mindanao, Davao Del Sur, Davao City, {selectedBarangay?.barangay_name || '(Select Barangay)'}
                        </Text>
                    </View>

                    {/* Barangay Selector */}
                    <View style={localStyles.section}>
                        <Text style={localStyles.label}>Barangay * {loadingBarangays && '⏳'}</Text>
                        <TouchableOpacity
                            style={localStyles.dropdown}
                            onPress={() => setShowBarangayDropdown(!showBarangayDropdown)}
                            disabled={loadingBarangays}
                        >
                            <TextInput
                                style={localStyles.dropdownInput}
                                placeholder="Search or select barangay..."
                                value={barangaySearch}
                                onChangeText={setBarangaySearch}
                                onFocus={() => setShowBarangayDropdown(true)}
                                editable={!loadingBarangays}
                            />
                            {loadingBarangays ? (
                                <ActivityIndicator size="small" color="#1D3557" />
                            ) : (
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            )}
                        </TouchableOpacity>

                        {/* Error Message */}
                        {barangaysError && (
                            <View style={{
                                backgroundColor: '#ffebee',
                                padding: 10,
                                borderRadius: 6,
                                marginTop: 8,
                                borderLeftWidth: 3,
                                borderLeftColor: '#d32f2f'
                            }}>
                                <Text style={{ color: '#d32f2f', fontSize: 12, fontWeight: '500' }}>
                                    ❌ {barangaysError}
                                </Text>
                            </View>
                        )}

                        {/* Loading State */}
                        {loadingBarangays && barangays.length === 0 && (
                            <View style={localStyles.dropdownList}>
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#1D3557" />
                                    <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
                                        Loading barangays...
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Dropdown List */}
                        {showBarangayDropdown && !loadingBarangays && barangays.length > 0 && (
                            <View style={localStyles.dropdownList}>
                                <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
                                    {filteredBarangays.length > 0 ? (
                                        filteredBarangays.map((item) => (
                                            <TouchableOpacity
                                                key={item.barangay_id.toString()}
                                                style={[
                                                    localStyles.dropdownItem,
                                                    selectedBarangay?.barangay_id === item.barangay_id && {
                                                        backgroundColor: '#e3f2fd'
                                                    }
                                                ]}
                                                onPress={() => handleBarangaySelect(item)}
                                            >
                                                <Text style={localStyles.dropdownItemText}>
                                                    {selectedBarangay?.barangay_id === item.barangay_id ? '✓ ' : ''}
                                                    {item.barangay_name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={{ padding: 12 }}>
                                            <Text style={{ color: '#999', textAlign: 'center', fontSize: 14 }}>
                                                No barangay matches "{barangaySearch}"
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                                {/* Footer showing total */}
                                <View style={{
                                    padding: 8,
                                    borderTopWidth: 1,
                                    borderTopColor: '#eee',
                                    backgroundColor: '#f9f9f9',
                                    alignItems: 'center'
                                }}>
                                    <Text style={{ fontSize: 12, color: '#999' }}>
                                        Showing {filteredBarangays.length} of {barangays.length} barangays
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* No Results Message */}
                        {showBarangayDropdown && !loadingBarangays && barangays.length === 0 && !barangaysError && (
                            <View style={localStyles.dropdownList}>
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#999', fontSize: 14 }}>
                                        No barangays available
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Info when no dropdown shown */}
                        {!showBarangayDropdown && barangays.length > 0 && selectedBarangay && (
                            <>
                                <Text style={{ fontSize: 12, color: '#4CAF50', marginTop: 4, fontWeight: '500' }}>
                                    ✓ {selectedBarangay.barangay_name} selected
                                    {barangayAutoDetected && ' (auto-detected from map)'}
                                </Text>
                                {/* Warning if barangay has no coordinates */}
                                {(!selectedBarangay.latitude || !selectedBarangay.longitude) && (
                                    <View style={{
                                        backgroundColor: '#fff3e0',
                                        padding: 10,
                                        borderRadius: 6,
                                        marginTop: 8,
                                        borderLeftWidth: 3,
                                        borderLeftColor: '#ff9800'
                                    }}>
                                        <Text style={{ color: '#e65100', fontSize: 12, fontWeight: '500' }}>
                                            ⚠️ This barangay has no predefined map area. Please manually select the exact location on the map below or use your current location.
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>

                    {/* Street Address */}
                    <View style={localStyles.section}>
                        <Text style={localStyles.label}>Street Name, Building and House No. *</Text>
                        <TextInput
                            style={localStyles.input}
                            placeholder="e.g., Silver Right Street Marfori, San Rafael Village"
                            value={streetAddress}
                            onChangeText={handleStreetAddressChange}
                            multiline
                        />

                        {loading && <ActivityIndicator size="small" color="#1D3557" style={{ marginTop: 8 }} />}

                        {showAddressSuggestions && addressSuggestions.length > 0 && (
                            <View style={localStyles.suggestions}>
                                {addressSuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={localStyles.suggestionItem}
                                        onPress={() => handleAddressSuggestionSelect(suggestion)}
                                    >
                                        <Ionicons name="location-outline" size={16} color="#666" />
                                        <Text style={localStyles.suggestionText}>{suggestion.display_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Use Current Location Button */}
                    <TouchableOpacity
                        style={localStyles.locationButton}
                        onPress={handleUseCurrentLocation}
                        disabled={loadingLocation}
                    >
                        {loadingLocation ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="locate" size={20} color="#fff" />
                                <Text style={localStyles.locationButtonText}>Use My Current Location</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Map */}
                    <View style={localStyles.mapContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={localStyles.mapLabel}>
                                {isMapInteractive ? 'Drag marker to pin location' : 'Map preview - Tap to interact'}
                            </Text>
                            {isMapInteractive && (
                                <TouchableOpacity
                                    onPress={() => setIsMapInteractive(false)}
                                    style={{
                                        backgroundColor: '#1D3557',
                                        paddingHorizontal: 12,
                                        paddingVertical: 4,
                                        borderRadius: 16,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Done</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ height: 300, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                            {/* Map View */}
                            <View style={{ flex: 1, pointerEvents: isMapInteractive ? 'auto' : 'none' }}>
                                {Platform.OS === 'web' ? (
                                    <iframe
                                        id="location-map-iframe"
                                        srcDoc={mapHtml}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                    />
                                ) : (
                                    WebView && (
                                        <WebView
                                            ref={webViewRef}
                                            source={{ html: mapHtml }}
                                            style={{ width: '100%', height: '100%', opacity: 0.99 }}
                                            scrollEnabled={false}
                                            onMessage={(event: any) => {
                                                const data = JSON.parse(event.nativeEvent.data);
                                                console.log('📱 WebView message received:', data);
                                                if (data.type === 'locationSelected') {
                                                    const { latitude, longitude } = data;
                                                    console.log('📍 Map location selected (mobile):', { latitude, longitude });
                                                    setMapCoordinates({ latitude, longitude });
                                                    setMapLocationSet(true);
                                                    console.log('📍 Map coordinates updated (mobile), mapLocationSet:', true);

                                                    // Reverse geocode to get street address
                                                    fetch(`${BACKEND_URL}/api/location/reverse?lat=${latitude}&lon=${longitude}`)
                                                        .then(res => res.json())
                                                        .then(addressData => {
                                                            let rawAddress = null;
                                                            if (addressData.success) {
                                                                const addr = addressData.address || addressData.display_name;
                                                                if (addr) {
                                                                    console.log('🏠 Reverse geocoded address (mobile):', addr);
                                                                    setStreetAddress(addr);
                                                                }

                                                                if (addressData.raw && addressData.raw.address) {
                                                                    rawAddress = addressData.raw.address;
                                                                }
                                                            }
                                                            // Determine barangay with address components
                                                            determineBarangayFromCoordinates(latitude, longitude, rawAddress);
                                                        })
                                                        .catch(err => {
                                                            console.error('Reverse geocode error (Mobile):', err);
                                                            // Set coordinates as fallback address when geocode fails
                                                            const fallbackAddr = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                                                            setStreetAddress(fallbackAddr);
                                                            determineBarangayFromCoordinates(latitude, longitude);
                                                        });
                                                }
                                            }}
                                        />
                                    )
                                )}
                            </View>

                            {/* Overlay for non-interactive mode */}
                            {!isMapInteractive && (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setIsMapInteractive(true)}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 10,
                                    }}
                                >
                                    <View style={{
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 20,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 4,
                                        elevation: 3,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <Ionicons name="finger-print" size={20} color="#1D3557" style={{ marginRight: 8 }} />
                                        <Text style={{ color: '#1D3557', fontWeight: '600', fontSize: 14 }}>
                                            Tap to interact with map
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Coordinates Display */}
                    <View style={localStyles.coordsDisplay}>
                        <Text style={localStyles.coordsText}>
                            Latitude: {mapCoordinates.latitude?.toFixed(6) || 'N/A'} | Longitude: {mapCoordinates.longitude?.toFixed(6) || 'N/A'}
                        </Text>
                        {mapLocationSet && isLocationValid && (
                            <Text style={{ fontSize: 12, color: '#4CAF50', marginTop: 4, fontWeight: '500' }}>
                                ✓ Map location updated
                            </Text>
                        )}
                        {!isLocationValid && (
                            <Text style={{ fontSize: 12, color: '#f44336', marginTop: 4, fontWeight: '500' }}>
                                ✗ Location is outside Davao City boundaries
                            </Text>
                        )}
                    </View>
                </ScrollView>

                {/* Confirm Button */}
                <View style={localStyles.footer}>
                    <TouchableOpacity
                        style={[
                            localStyles.confirmButton,
                            !isLocationValid && localStyles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirm}
                        disabled={!isLocationValid}
                    >
                        <Text style={[
                            localStyles.confirmButtonText,
                            !isLocationValid && localStyles.confirmButtonTextDisabled
                        ]}>
                            Confirm Location
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    locationDisplay: {
        backgroundColor: '#f0f7ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    locationText: {
        fontSize: 14,
        color: '#1D3557',
        fontWeight: '500',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingRight: 12,
    },
    dropdownInput: {
        flex: 1,
        padding: 12,
        fontSize: 15,
    },
    dropdownList: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        maxHeight: 200,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    suggestions: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1D3557',
        padding: 14,
        borderRadius: 8,
        marginBottom: 20,
    },
    locationButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    mapContainer: {
        marginBottom: 16,
    },
    mapLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    coordsDisplay: {
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 6,
        marginBottom: 16,
    },
    coordsText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    confirmButton: {
        backgroundColor: '#1D3557',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonTextDisabled: {
        color: '#888',
    },
});

export default EnhancedLocationPicker;
