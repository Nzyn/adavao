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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import LoadingScreen from './LoadingScreen';
import SearchLoading from './SearchLoading';

const GEOCODING_API_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_GEOCODING_API_URL = 'https://nominatim.openstreetmap.org/reverse';

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

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onLocationSelect: (address: string, coordinates: { latitude: number; longitude: number }) => void;
}

interface MarkerCoordinate {
    latitude: number;
    longitude: number;
}

interface SearchResult {
    address: string;
    latitude: number;
    longitude: number;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    onClose,
    onLocationSelect,
}) => {
    const [markerCoordinate, setMarkerCoordinate] = useState<MarkerCoordinate>({
        latitude: 7.0731, // Default to Davao City
        longitude: 125.6128,
    });

    // Store the initial map coordinates to prevent map regeneration when dragging
    const mapInitialCoordinates = useRef<MarkerCoordinate>({
        latitude: 7.0731,
        longitude: 125.6128,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const webViewRef = useRef<any>(null);

    // Handle iframe messages on web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'locationSelected') {
                    const { latitude, longitude } = event.data;
                    // DO NOT update markerCoordinate to prevent map regeneration!
                    // Just update the displayed address
                    reverseGeocode(latitude, longitude, false);
                }
            };

            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, []);

    // Initialize default location when modal opens
    useEffect(() => {
        if (visible) {
            // Set default to Davao City if no location selected
            if (!selectedAddress) {
                setMarkerCoordinate({
                    latitude: 7.0731,
                    longitude: 125.6128,
                });
            }
        }
    }, [visible]);

    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            console.log('Getting current location...');

            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'AlertDavao needs location permission to use the current location feature. Please grant permission in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Try Again', onPress: getCurrentLocation }
                    ]
                );
                setLoading(false);
                return;
            }

            console.log('Location permission granted, fetching position...');

            // Use a shorter timeout (10 seconds) for faster fallback
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 1000,
                distanceInterval: 0,
            });

            const timeoutPromise = new Promise<any>((_, reject) =>
                setTimeout(() => reject(new Error('Location request timed out')), 10000)
            );

            let location: any;
            try {
                location = await Promise.race([locationPromise, timeoutPromise]);
            } catch (timeoutError) {
                // If it times out, try with lower accuracy for faster response
                console.warn('Timeout with Balanced accuracy, trying with Low accuracy...');
                const fallbackPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low,
                    timeInterval: 500,
                    distanceInterval: 0,
                });

                const fallbackTimeout = new Promise<any>((_, reject) =>
                    setTimeout(() => reject(new Error('Location request timed out')), 8000)
                );

                location = await Promise.race([fallbackPromise, fallbackTimeout]);
            }

            console.log('Got current location:', location.coords);

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            console.log('🎯 Setting marker coordinate from device location:', coords);
            setMarkerCoordinate(coords);
            // Also update the map reference
            mapInitialCoordinates.current = coords;

            // Reverse geocode to get address and directly populate it
            console.log('Reverse geocoding coordinates...');
            try {
                const address = await Promise.race([
                    reverseGeocodeNominatim(coords.latitude, coords.longitude, false),
                    new Promise<string>((_, reject) =>
                        setTimeout(() => reject(new Error('Geocoding timeout')), 5000)
                    )
                ]);
                console.log('✅ Location loaded directly:', address);
            } catch (geocodeError) {
                // Fallback: use coordinates if geocoding fails
                console.warn('Reverse geocoding failed, using coordinates:', geocodeError);
                const coordinateAddress = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
                setSelectedAddress(coordinateAddress);
                setMarkerCoordinate(coords);
                mapInitialCoordinates.current = coords;
                console.log('✅ Location loaded (coordinates only):', coordinateAddress);
            }
        } catch (error: any) {
            console.error('Error getting current location:', error);
            let errorMessage = 'Unable to get current location.';

            // Handle expo-location errors
            if (error.code === 'E_LOCATION_UNAVAILABLE') {
                errorMessage = 'Location services are not available or disabled. Please enable location services on your device and try again.';
            } else if (error.code === 'E_PERMISSION_DENIED') {
                errorMessage = 'Location permission was denied. Please grant permission in your device settings.';
            } else if (error.message?.includes('timeout')) {
                errorMessage = 'Location request timed out. This usually happens in areas with weak GPS signal. Please:\n\n• Move outdoors with clear sky view\n• Wait a few moments and try again\n• Or search for your location manually';
            }
            // Handle GeolocationPositionError (web platform)
            else if (error.code === 1) {
                errorMessage = 'Location permission was denied. Please allow location access in your browser settings.';
            } else if (error.code === 2) {
                errorMessage = 'Location is temporarily unavailable. Please ensure location services are enabled and try again.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. This usually happens in areas with weak GPS signal. Please:\n\n• Move outdoors with clear sky view\n• Wait a few moments and try again\n• Or search for your location manually';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const searchLocation = async () => {
        if (!searchQuery.trim()) {
            Alert.alert('Enter Location', 'Please enter a location to search for.');
            return;
        }

        try {
            setLoading(true);
            console.log('Searching for:', searchQuery);

            // Get backend URL from environment or use detected one
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            // Route through backend to avoid CORS issues with Nominatim
            const response = await fetch(
                `${backendUrl}/api/location/search?q=${encodeURIComponent(searchQuery)}`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('Location search results:', data);

                if (data.results && data.results.length > 0) {
                    // Convert results to our SearchResult format
                    const results: SearchResult[] = data.results.slice(0, 8).map((item: any) => {
                        let formattedAddress = item.display_name || item.address;

                        // If it's a specific place/business, prioritize the name
                        if (item.name && item.name !== item.city) {
                            const addressParts = formattedAddress.split(', ');
                            if (addressParts.length > 3) {
                                // Show: Name, Road/Area, City, Region for landmarks/businesses
                                formattedAddress = `${item.name}, ${addressParts.slice(1, 3).join(', ')}, ${item.city || 'Philippines'}`;
                            }
                        }

                        return {
                            address: formattedAddress,
                            latitude: parseFloat(item.lat),
                            longitude: parseFloat(item.lon),
                        };
                    });

                    console.log('Formatted search results:', results);
                    setSearchResults(results);
                    setShowSearchResults(true);

                    // Update map to show the first result
                    if (results.length > 0) {
                        const firstResult = results[0];
                        // Update the ref AND call updateMapLocation to re-render map
                        mapInitialCoordinates.current = {
                            latitude: firstResult.latitude,
                            longitude: firstResult.longitude
                        };
                        setMarkerCoordinate({
                            latitude: firstResult.latitude,
                            longitude: firstResult.longitude
                        });
                        updateMapLocation(firstResult.latitude, firstResult.longitude, firstResult.address);
                    }
                } else {
                    Alert.alert('Not Found', `No results found for "${searchQuery}". Try searching for:\n\n• Cities: "Davao City", "Manila", "Cebu"\n• Landmarks: "SM City Davao", "Ateneo de Davao"\n• Addresses: "Roxas Avenue Davao"\n• Barangays: "Poblacion Davao City"`);
                }
            } else {
                const errorText = await response.text();
                console.error('Search API error:', response.status, errorText);
                throw new Error(`Search failed with status: ${response.status}`);
            }
        } catch (error: any) {
            console.error('Error searching location:', error);
            if (error.name === 'AbortError') {
                Alert.alert('Request Timeout', 'The search request took too long. Please check your internet connection and try again.');
            } else {
                Alert.alert('Search Error', `Unable to search for "${searchQuery}". Please check your internet connection and try again.\n\nError: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const selectSearchResult = (result: SearchResult) => {
        // Update the ref AND state to re-render map
        mapInitialCoordinates.current = { latitude: result.latitude, longitude: result.longitude };
        setMarkerCoordinate({ latitude: result.latitude, longitude: result.longitude });
        setSelectedAddress(result.address);
        setSearchQuery('');
        setShowSearchResults(false);

        // Update map location on all platforms
        updateMapLocation(result.latitude, result.longitude, result.address);
    };

    const reverseGeocodeNominatim = async (latitude: number, longitude: number, showConsole: boolean = false) => {
        try {
            if (showConsole) console.log('Reverse geocoding:', latitude, longitude);

            // Get backend URL from environment or use detected one
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            // Route through backend to avoid CORS issues
            const response = await fetch(
                `${backendUrl}/api/location/reverse?lat=${latitude}&lon=${longitude}`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data && data.address) {
                    // Address is already formatted by backend
                    const formattedAddress = data.address;
                    console.log('✅ Reverse geocoded address:', formattedAddress);
                    // IMPORTANT: Update both the address AND the marker coordinate
                    setSelectedAddress(formattedAddress);
                    setMarkerCoordinate({ latitude, longitude });
                    mapInitialCoordinates.current = { latitude, longitude };
                    setSearchQuery('');
                    return formattedAddress;
                }
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }

        // Fallback to coordinates
        const coordinateAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        console.log('⚠️ Using fallback coordinates:', coordinateAddress);
        setSelectedAddress(coordinateAddress);
        // IMPORTANT: Also update marker coordinate in fallback
        setMarkerCoordinate({ latitude, longitude });
        mapInitialCoordinates.current = { latitude, longitude };
        setSearchQuery('');
        return coordinateAddress;
    };

    const reverseGeocode = async (latitude: number, longitude: number, shouldUpdateMap: boolean = true) => {
        try {
            console.log('Reverse geocoding:', latitude, longitude);
            const address = await reverseGeocodeNominatim(latitude, longitude, false);

            // Update the map display only if shouldUpdateMap is true (not when just dragging marker)
            if (shouldUpdateMap && webViewRef.current && Platform.OS !== 'web') {
                const escapedAddress = address.replace(/"/g, '\\"');
                const script = `
          if (window.updateLocation) {
            window.updateLocation(${latitude}, ${longitude}, "${escapedAddress}");
          }
        `;
                webViewRef.current.injectJavaScript(script);
            }
        } catch (error) {
            console.error('Error in reverseGeocode:', error);
            // Fallback to coordinates on error
            const coordinateAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setSelectedAddress(coordinateAddress);
            setSearchQuery('');
        }
    };

    const updateMapLocation = (latitude: number, longitude: number, address?: string) => {
         console.log('Updating map location:', latitude, longitude, address);
         // Update the marker coordinate state to reflect map position
         setMarkerCoordinate({ latitude, longitude });
         if (webViewRef.current && Platform.OS !== 'web') {
             const escapedAddress = (address || '').replace(/"/g, '\\"');
             const script = `
         if (window.updateLocation) {
           window.updateLocation(${latitude}, ${longitude}, "${escapedAddress}");
         }
       `;
             webViewRef.current.injectJavaScript(script);
         }
     };

    const generateMapHTML = () => {
        const lat = mapInitialCoordinates.current.latitude || 7.0731;
        const lng = mapInitialCoordinates.current.longitude || 125.6128;

        return `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Location Picker</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    #map { height: 100vh; width: 100%; }
    .location-info {
     position: fixed; bottom: 10px; left: 10px; right: 10px;
     background: white; padding: 12px; border-radius: 8px;
     box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000;
    }
    .controls {
     position: fixed; top: 10px; right: 10px; z-index: 1001;
    }
    .btn {
     background: white; border: none; padding: 8px; margin: 2px;
     border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    .geofence-info {
     position: fixed; top: 50px; right: 10px; background: #fff3cd;
     border: 1px solid #ffc107; padding: 8px 12px; border-radius: 4px;
     font-size: 12px; color: #856404; z-index: 1000; max-width: 200px;
    }
    </style>
    </head>
    <body>
    <div id="map"></div>
    
    <div class="controls">
    <button class="btn" onclick="centerOnMarker()" title="Center">🎯</button>
    </div>

    <div class="geofence-info">
    📍 Map limited to Davao City
    </div>
    
    <div class="location-info">
    <div><strong>📍 Location Picker</strong></div>
    <div id="location-address">Click on map to select location</div>
    </div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
    let map, marker;
    
    // Davao City boundaries (approximate coordinates)
    const DAVAO_BOUNDS = [
     [6.8, 125.2],    // Southwest corner
     [7.4, 125.9]     // Northeast corner
    ];
    
    // Maximum bounds to prevent zooming out beyond Davao City
    const MAX_BOUNDS_PADDING = 0.05;
    const PADDED_BOUNDS = [
     [6.8 - MAX_BOUNDS_PADDING, 125.2 - MAX_BOUNDS_PADDING],
     [7.4 + MAX_BOUNDS_PADDING, 125.9 + MAX_BOUNDS_PADDING]
    ];
    
    function initMap() {
     try {
       console.log('Initializing map at:', ${lat}, ${lng});
       
       // Detect platform first
       const isWebPlatform = !window.ReactNativeWebView;
       
       // Configure map with platform-specific options and geofencing
       const mapOptions = {
         zoomControl: true,
         dragging: true,
         touchZoom: true,
         doubleClickZoom: true,
         scrollWheelZoom: isWebPlatform,
         boxZoom: isWebPlatform,
         keyboard: isWebPlatform,
         tap: true,
         maxBounds: PADDED_BOUNDS,
         maxBoundsViscosity: 1.0
       };
       
       map = L.map('map', mapOptions).setView([${lat}, ${lng}], 13);
       
       // Set min/max zoom levels for additional control
       map.setMinZoom(11);
       map.setMaxZoom(18);
       
       L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '© OpenStreetMap contributors'
       }).addTo(map);
       
       marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
       
       // Draw Davao City boundary rectangle
       const boundaryRectangle = L.rectangle(DAVAO_BOUNDS, {
         color: '#FF6B6B',
         weight: 2,
         opacity: 0.5,
         fill: true,
         fillColor: '#FF6B6B',
         fillOpacity: 0.05,
         dashArray: '5, 5'
       }).addTo(map);
       
       // Platform-specific interactions
       if (isWebPlatform) {
         // Web: Right-click to select location
         map.on('contextmenu', function(e) {
           e.originalEvent.preventDefault();
           let lat = e.latlng.lat;
           let lng = e.latlng.lng;
           
           // Constrain to Davao City bounds
           lat = Math.max(DAVAO_BOUNDS[0][0], Math.min(DAVAO_BOUNDS[1][0], lat));
           lng = Math.max(DAVAO_BOUNDS[0][1], Math.min(DAVAO_BOUNDS[1][1], lng));
           
           marker.setLatLng([lat, lng]);
           sendLocationToApp(lat, lng);
           document.getElementById('location-address').innerHTML = 
             'Selected: ' + lat.toFixed(6) + ', ' + lng.toFixed(6);
         });
         
         // Update instructions for web
         document.getElementById('location-address').innerHTML = 
           'Right-click on map to select location. Left-click and drag to move map.';
       } else {
         // Mobile: Single tap to select location (two-finger drag is automatic)
         map.on('click', function(e) {
           let lat = e.latlng.lat;
           let lng = e.latlng.lng;
           
           // Constrain to Davao City bounds
           lat = Math.max(DAVAO_BOUNDS[0][0], Math.min(DAVAO_BOUNDS[1][0], lat));
           lng = Math.max(DAVAO_BOUNDS[0][1], Math.min(DAVAO_BOUNDS[1][1], lng));
           
           marker.setLatLng([lat, lng]);
           sendLocationToApp(lat, lng);
           document.getElementById('location-address').innerHTML = 
             'Selected: ' + lat.toFixed(6) + ', ' + lng.toFixed(6);
         });
         
         // Update instructions for mobile
         document.getElementById('location-address').innerHTML = 
           'Tap on map to select location. Use two fingers to drag and zoom.';
         }
         
         // Drag marker with geofence constraint
         marker.on('dragend', function(e) {
         let pos = e.target.getLatLng();
         
         // Constrain marker to Davao City bounds
         const lat = Math.max(DAVAO_BOUNDS[0][0], Math.min(DAVAO_BOUNDS[1][0], pos.lat));
         const lng = Math.max(DAVAO_BOUNDS[0][1], Math.min(DAVAO_BOUNDS[1][1], pos.lng));
         
         pos = L.latLng(lat, lng);
         marker.setLatLng(pos);
         
         sendLocationToApp(pos.lat, pos.lng);
         document.getElementById('location-address').innerHTML = 
           'Selected: ' + pos.lat.toFixed(6) + ', ' + pos.lng.toFixed(6);
         });
         
         console.log('Map initialized successfully');
         } catch (error) {
         console.error('Map error:', error);
         document.getElementById('location-address').innerHTML = 'Error: ' + error.message;
         }
         }
    
    function centerOnMarker() {
      if (map && marker) {
        // Preserve current zoom level instead of resetting to 13
        const currentZoom = map.getZoom();
        map.setView(marker.getLatLng(), currentZoom);
      }
    }
    
    function sendLocationToApp(lat, lng) {
      const data = { type: 'locationSelected', latitude: lat, longitude: lng };
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else if (window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
      
      console.log('Sent location:', lat, lng);
    }
    
    window.updateLocation = function(lat, lng, address) {
      if (map && marker) {
        marker.setLatLng([lat, lng]);
        // Preserve current zoom level instead of resetting to 13
        const currentZoom = map.getZoom();
        map.setView([lat, lng], currentZoom);
        if (address) {
          document.getElementById('location-address').innerHTML = address;
        }
      }
    };
    
    // Initialize when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMap);
    } else {
      initMap();
    }
  </script>
</body>
</html>`;
    };

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'locationSelected') {
                const { latitude, longitude } = data;
                setMarkerCoordinate({ latitude, longitude });
                reverseGeocode(latitude, longitude);
            }
        } catch (error) {
            console.log('Error parsing WebView message:', error);
        }
    };

    const handleConfirmLocation = () => {
        console.log('handleConfirmLocation called with:', {
            selectedAddress,
            markerCoordinate,
            hasCoordinates: !!markerCoordinate,
            lat: markerCoordinate?.latitude,
            lng: markerCoordinate?.longitude
        });
        
        if (selectedAddress && markerCoordinate) {
            console.log('✅ Confirming location:', {
                address: selectedAddress,
                coordinates: markerCoordinate,
                latitude: markerCoordinate.latitude,
                longitude: markerCoordinate.longitude
            });
            onLocationSelect(selectedAddress, markerCoordinate);
            onClose();
        } else {
            const missingItems = [];
            if (!selectedAddress) missingItems.push('address');
            if (!markerCoordinate) missingItems.push('coordinates');
            Alert.alert('No Location Selected', `Please select a location by searching, using current location, or tapping on the map. Missing: ${missingItems.join(', ')}`);
        }
    };

    const centerOnCurrentLocation = () => {
        getCurrentLocation();
    };


    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#1D3557" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Location</Text>
                    <TouchableOpacity onPress={handleConfirmLocation}>
                        <Text style={styles.confirmText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search places (e.g., Davao City, SM Mall, Roxas Ave)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={searchLocation}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
                        <Ionicons name="search" size={20} color="#1D3557" />
                    </TouchableOpacity>
                </View>

                {/* Interactive Map */}
                <View style={styles.mapContainer}>
                    {Platform.OS === 'web' ? (
                        <iframe
                            src={`data:text/html;charset=utf-8,${encodeURIComponent(generateMapHTML())}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                borderRadius: 8,
                            }}
                            onLoad={() => console.log('Map loaded')}
                        />
                    ) : WebView ? (
                        <WebView
                            ref={webViewRef}
                            source={{ html: generateMapHTML() }}
                            style={styles.webView}
                            onMessage={handleWebViewMessage}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.webViewLoading}>
                                    <ActivityIndicator size="large" color="#1D3557" />
                                    <Text style={styles.loadingText}>Loading map...</Text>
                                </View>
                            )}
                        />
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <Ionicons name="alert-circle-outline" size={48} color="#999" />
                            <Text style={styles.mapPlaceholderText}>Map not available</Text>
                            <Text style={styles.mapPlaceholderSubtext}>
                                WebView component could not be loaded. Search for your location manually.
                            </Text>
                        </View>
                    )}

                    {/* Loading overlay */}
                    {loading && (
                        <View style={styles.mapLoadingOverlay}>
                            <ActivityIndicator size="large" color="#1D3557" />
                            <Text style={styles.loadingText}>Searching location...</Text>
                        </View>
                    )}
                </View>

                {/* Search Results Overlay */}
                {showSearchResults && (
                    <View style={styles.searchResultsOverlay}>
                        <ScrollView style={styles.searchResultsContainer}>
                            <View style={styles.searchHeader}>
                                <Text style={styles.searchResultsTitle}>Select Location</Text>
                                <TouchableOpacity
                                    onPress={() => setShowSearchResults(false)}
                                    style={styles.closeIcon}
                                >
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {searchResults.map((result, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.searchResultItem}
                                    onPress={() => selectSearchResult(result)}
                                >
                                    <View style={styles.locationIcon}>
                                        <Ionicons name="location" size={18} color="#1D3557" />
                                    </View>
                                    <View style={styles.addressInfo}>
                                        <Text style={styles.addressTitle}>
                                            {result.address.split(',')[0] || result.address}
                                        </Text>
                                        <Text style={styles.addressSubtitle}>
                                            {result.address.includes(',') ? result.address.split(',').slice(1).join(',').trim() : 'Philippines'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <Text style={styles.selectedLocationLabel}>Selected Location:</Text>
                    <Text style={styles.selectedLocationText}>
                        {selectedAddress || 'Search for an address above or tap on the map'}
                    </Text>

                    {selectedAddress && (
                        <TouchableOpacity
                            style={styles.confirmLocationBtn}
                            onPress={() => {
                                onLocationSelect(selectedAddress, markerCoordinate);
                                onClose();
                            }}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.confirmLocationText}>Confirm This Location</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.getCurrentLocationBtn}
                        onPress={getCurrentLocation}
                        disabled={loading}
                    >
                        <Ionicons name="locate" size={20} color="#fff" />
                        <Text style={styles.getCurrentLocationText}>
                            {loading ? 'Getting location...' : 'Use Current Location'}
                        </Text>
                    </TouchableOpacity>

                    {loading && (
                        <View style={styles.loadingIndicator}>
                            <ActivityIndicator size="small" color="#1D3557" />
                            <Text style={styles.loadingText}>Getting location...</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Search Loading Overlay */}
            <SearchLoading
                visible={loading}
                message="Searching locations..."
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D3557',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapSection: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    webView: {
        flex: 1,
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    searchResultsOverlay: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        maxHeight: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
    },
    bottomControls: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    searchResultsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        maxHeight: 180,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    closeSearchButton: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    closeSearchText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    searchResultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginVertical: 2,
    },
    searchResultText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    loadingIndicator: {
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    addressContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    coordinateDisplay: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    coordinateLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    coordinateText: {
        fontSize: 16,
        color: '#1D3557',
        fontWeight: '500',
    },
    manualCoordinateInput: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    coordinateInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    coordinateInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
    },
    getCurrentLocationBtn: {
        backgroundColor: '#1D3557',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        opacity: 1,
    },
    getCurrentLocationText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    confirmLocationBtn: {
        backgroundColor: '#27AE60',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        marginBottom: 12,
    },
    confirmLocationText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // New styles for address-focused interface
    searchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    closeIcon: {
        padding: 4,
    },
    locationIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addressInfo: {
        flex: 1,
    },
    addressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    addressSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    selectedLocationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    selectedLocationText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
        lineHeight: 22,
    },
    mapContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mapLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    // Web fallback styles
    webMapContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f0f4f8',
        margin: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    mapPlaceholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    mapPlaceholderSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    selectedLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    selectedLocationCardText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    // New functional interface styles
    contentArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    currentLocationCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#1D3557',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D3557',
        marginLeft: 8,
    },
    selectedLocationAddress: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    instructionsCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    instructionsText: {
        marginLeft: 12,
        flex: 1,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    instructionsItem: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 4,
    },
    sampleSearches: {
        margin: 16,
    },
    sampleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    sampleButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sampleButton: {
        backgroundColor: '#e8f4f8',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1D3557',
    },
    sampleButtonText: {
        color: '#1D3557',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
});

export default LocationPickerModal;