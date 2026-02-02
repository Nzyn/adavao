import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, FlatList, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from '../../contexts/UserContext';
import * as Location from 'expo-location';
import styles from './styles';
import { BACKEND_URL } from '../../config/backend';
import { searchBarangay } from '../../services/policeStationService';

// Dashboard-matching color palette
const COLORS = {
  primary: '#1D3557',
  accent: '#E63946',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  cardBg: '#FFFFFF',
};

interface Barangay {
  barangay_id: number;
  barangay_name: string;
  latitude: number | null;
  longitude: number | null;
  station_id: number;
}

const LocationScreen = () => {
  // 📊 Performance Timing - Start
  const pageStartTime = React.useRef(Date.now());
  React.useEffect(() => {
    const loadTime = Date.now() - pageStartTime.current;
    console.log(`📊 [Station] Page Load Time: ${loadTime}ms`);
  }, []);
  // 📊 Performance Timing - End

  const router = useRouter();
  const { user } = useUser();
  const [userAddress, setUserAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [sortedStations, setSortedStations] = useState<any[]>([]);
  const [currentLocationName, setCurrentLocationName] = useState(""); // Track which location is being used for sorting

  // Barangay Search State
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Fetch Barangays on Mount
  useEffect(() => {
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
    try {
      setLoadingBarangays(true);
      const response = await fetch(`${BACKEND_URL}/api/barangays`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data)) {
          setBarangays(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching barangays:', error);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const filteredBarangays = barangays.filter(b =>
    b.barangay_name.toLowerCase().includes(searchAddress.toLowerCase())
  ).slice(0, 5); // Limit to top 5

  const handleBarangaySelect = async (barangay: Barangay) => {
    setSearchAddress(barangay.barangay_name);
    setShowBarangayDropdown(false);
    setCurrentLocationName(barangay.barangay_name);

    // 1. Try to find ASSIGNED station first (Barangay-Based)
    try {
      const assignedStation = await searchBarangay(barangay.barangay_name);
      if (assignedStation) {
        console.log('✅ Found assigned station via service:', assignedStation.station_name);
        const formattedStation = {
          name: assignedStation.station_name,
          phone: assignedStation.contact_number || 'N/A',
          address: assignedStation.address || 'N/A',
          coordinates: `${assignedStation.latitude}, ${assignedStation.longitude}`,
          distance: 0 // Not distance-based
        };
        setSortedStations([formattedStation]);

        // Center map on Barangay coords if available, otherwise Station coords
        if (barangay.latitude && barangay.longitude) {
          setUserCoordinates({ latitude: barangay.latitude, longitude: barangay.longitude });
        } else if (assignedStation.latitude && assignedStation.longitude) {
          setUserCoordinates({ latitude: assignedStation.latitude, longitude: assignedStation.longitude });
        }
        return; // Skip nearest search
      }
    } catch (e) {
      console.error('Error in barangay lookup:', e);
    }

    if (barangay.latitude && barangay.longitude) {
      const coords = { latitude: barangay.latitude, longitude: barangay.longitude };
      setUserCoordinates(coords);
      fetchNearestStations(coords.latitude, coords.longitude);
    } else {
      // Fallback to geocoding if lat/lon missing in DB
      geocodeAddress(barangay.barangay_name + ", Davao City", barangay.barangay_name, true);
    }
  };


  // Geocode address to get coordinates using backend proxy
  const geocodeAddress = async (address: string, locationName?: string, isUserSearch: boolean = false) => {
    // Don't geocode if address is empty or invalid
    if (!address || address.trim().length === 0) {
      console.log('⚠️ Skipping geocode - empty address');
      return null;
    }

    try {
      setIsGeocoding(true);
      console.log('🌍 Geocoding address:', address);

      // Use backend location search API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${BACKEND_URL}/api/location/search?q=${encodeURIComponent(address)}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const coords = {
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon)
        };
        setUserCoordinates(coords);
        setCurrentLocationName(locationName || address);
        console.log('✅ Geocoded successfully:', coords);

        // Fetch nearest stations using the new endpoint
        await fetchNearestStations(coords.latitude, coords.longitude);

        return coords;
      } else {
        console.log('⚠️ Address not found');
        if (isUserSearch) {
          alert('Address not found. Please try a different address.');
        }
        return null;
      }
    } catch (error: any) {
      console.error('💥 Geocoding error:', error);

      // Show alert only if user explicitly searched for an address
      if (isUserSearch) {
        if (error.name === 'AbortError') {
          alert('Request timed out. Please check your internet connection and try again.');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          alert('Unable to connect to geocoding service. Please check your internet connection.');
        } else {
          alert(`Error finding address: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.warn('⚠️ Geocoding failed silently on initial load:', error.message);
      }
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  // Fetch nearest police stations from backend
  const fetchNearestStations = async (latitude: number, longitude: number) => {
    try {
      console.log('🚓 Fetching nearest stations for:', { latitude, longitude });

      const response = await fetch(
        `${BACKEND_URL}/api/police-stations/nearest?latitude=${latitude}&longitude=${longitude}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const formattedStations = data.data.map((station: any) => ({
            name: station.station_name,
            phone: station.contact || 'N/A',
            address: station.address || 'N/A',
            coordinates: `${station.latitude}, ${station.longitude}`,
            distance: station.distance
          }));
          setSortedStations(formattedStations);
          console.log(`✅ Loaded ${formattedStations.length} nearest stations`);
        }
      } else {
        console.error('Failed to fetch nearest stations:', response.status);
        // Fallback to manual calculation
        sortStationsManually({ latitude, longitude });
      }
    } catch (error) {
      console.error('Error fetching nearest stations:', error);
      // Fallback to manual calculation
      sortStationsManually({ latitude, longitude });
    }
  };

  // Fallback: manually sort stations by distance
  const sortStationsManually = (coords: { latitude: number; longitude: number }) => {
    const stationsWithDistance = stations
      .filter(station => station.coordinates !== "—")
      .map(station => {
        const [lat, lon] = station.coordinates.split(", ").map(parseFloat);
        const distance = calculateDistance(
          coords.latitude,
          coords.longitude,
          lat,
          lon
        );
        return { ...station, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    setSortedStations(stationsWithDistance);
  };

  // Load user address from context and set it as initial search value
  useEffect(() => {
    if (user?.address && user.address.trim().length > 0) {
      console.log('👤 User address found:', user.address);
      setUserAddress(user.address);
      setSearchAddress(user.address); // Set as default search value

      // Geocode user's saved address (silently fail if it doesn't work)
      geocodeAddress(user.address, user.address, false).catch(err => {
        console.warn('⚠️ Failed to geocode user address on mount:', err);
      });
    } else {
      console.log('ℹ️ No user address available');
    }
  }, [user]);

  // useEffect removed to prevent overwriting manual station selection
  // fetchNearestStations is now called explicitly where needed

  // Handle search address input
  const handleSearchAddress = async () => {
    if (searchAddress.trim()) {
      setShowBarangayDropdown(false);
      console.log('🔍 User searching for address:', searchAddress);

      // Try Barangay Lookup First
      try {
        const assignedStation = await searchBarangay(searchAddress);
        if (assignedStation) {
          console.log('✅ Found assigned station via text search:', assignedStation.station_name);
          const formattedStation = {
            name: assignedStation.station_name,
            phone: assignedStation.contact_number || 'N/A',
            address: assignedStation.address || 'N/A',
            coordinates: `${assignedStation.latitude}, ${assignedStation.longitude}`,
            distance: 0
          };
          setSortedStations([formattedStation]);
          setCurrentLocationName(assignedStation.barangay_name);

          if (assignedStation.latitude && assignedStation.longitude) {
            setUserCoordinates({ latitude: assignedStation.latitude, longitude: assignedStation.longitude });
          } else {
            // If no coords in station data, try geocoding just to center map? 
            // Or just leave it. Geocode callback would fetch nearest, which we want to avoid if we found the station.
            // We'll proceed to geocode ONLY for map centering if needed? 
            // Actually, if we have the station, we are good.
          }
          return;
        }
      } catch (e) {
        // Continue to geocode
      }

      await geocodeAddress(searchAddress, searchAddress, true);
    } else {
      Alert.alert('Please enter an address or barangay to search.');
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = async () => {
    try {
      setIsGeocoding(true);
      setShowBarangayDropdown(false);
      console.log('📍 Getting current location...');

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'AlertDavao needs location permission to use the current location feature. Please grant permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handleUseCurrentLocation }
          ]
        );
        setIsGeocoding(false);
        return;
      }

      console.log('✅ Location permission granted, fetching position...');

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
        console.warn('⚠️ Timeout with Balanced accuracy, trying with Low accuracy...');
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

      console.log('✅ Got current location:', location.coords);

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserCoordinates(coords);
      // Explicitly fetch station for current location
      fetchNearestStations(coords.latitude, coords.longitude);

      // Reverse geocode to get address and auto-fill the search bar
      console.log('🔄 Reverse geocoding coordinates...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `${BACKEND_URL}/api/location/reverse?lat=${coords.latitude}&lon=${coords.longitude}`,
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
            const address = data.address;
            setSearchAddress(address);
            setCurrentLocationName(address);
            console.log('✅ Address auto-filled:', address);
          }
        } else {
          // Fallback: use coordinates
          const coordinateAddress = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
          setSearchAddress(coordinateAddress);
          setCurrentLocationName(coordinateAddress);
          console.log('✅ Address auto-filled (coordinates):', coordinateAddress);
        }
      } catch (geocodeError) {
        // Fallback: use coordinates if geocoding fails
        console.warn('⚠️ Reverse geocoding failed, using coordinates:', geocodeError);
        const coordinateAddress = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        setSearchAddress(coordinateAddress);
        setCurrentLocationName(coordinateAddress);
        console.log('✅ Address auto-filled (coordinates):', coordinateAddress);
      }
    } catch (error: any) {
      console.error('💥 Error getting current location:', error);
      let errorMessage = 'Unable to get current location.';

      // Handle expo-location errors
      if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location services are not available or disabled. Please enable location services on your device and try again.';
      } else if (error.code === 'E_PERMISSION_DENIED') {
        errorMessage = 'Location permission was denied. Please grant permission in your device settings.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. This usually happens in areas with weak GPS signal. Please:\n\n• Move outdoors with clear sky view\n• Wait a few moments and try again\n• Or search for your location manually';
      } else if (error.code === 1) {
        errorMessage = 'Location permission was denied. Please allow location access in your browser settings.';
      } else if (error.code === 2) {
        errorMessage = 'Location is temporarily unavailable. Please ensure location services are enabled and try again.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. This usually happens in areas with weak GPS signal. Please:\n\n• Move outdoors with clear sky view\n• Wait a few moments and try again\n• Or search for your location manually';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsGeocoding(false);
    }
  };

  const stations = [
    {
      name: "PS1 Sta. Ana",
      phone: "09985987055 / 233-4884",
      address: "2 M L Quezon Blvd, Poblacion District, Davao City, 8000 Davao del Sur",
      coordinates: "7.073926884947963, 125.62460794233071",
    },
    {
      name: "PS2 San Pedro",
      phone: "09985987057 / 226-4835",
      address: "Purok 6, 107 San Pedro St, Poblacion District, Davao City, Davao del Sur",
      coordinates: "7.06363513645959, 125.60983772750019",
    },
    {
      name: "PS3 Talomo",
      phone: "09194439634 / 297-1598",
      address: "3G4W+2FM, McArthur Highway, Talomo, Davao City, Davao del Sur",
      coordinates: "7.055262956996804, 125.5463240055573",
    },
    {
      name: "PS4 Sasa",
      phone: "09194439634 / 297-1598",
      address: "Km 9, Paradise Island Road, Davao City-Panabo City Rd, Buhangin, Davao City, 8000 Davao del Sur",
      coordinates: "7.1145752788215075, 125.6574542290678",
    },
    {
      name: "PS5 Buhangin",
      phone: "09985987063",
      address: "4J77+C7J, Buhangin-Cabantian-Indangan Rd, Buhangin, Lungsod ng Dabaw, 8000 Lalawigan ng Davao del Sur",
      coordinates: "7.11375476140385, 125.61321898470506",
    },
    {
      name: "PS6 Bunawan",
      phone: "09985987065 / 236-0284",
      address: "6JPV+74W, Bunawan, Davao City, Davao del Sur",
      coordinates: "7.235684819195078, 125.64280068118306",
    },
    {
      name: "PS7 Paquibato",
      phone: "09985987067",
      address: "8FF6+6CJ, Barangay Lacson Rd, Davao City, 8000 Davao del Sur",
      coordinates: "7.323117846058702, 125.4610349916833",
    },
    {
      name: "PS8 Toril",
      phone: "09985987069 / 291-1633",
      address: "2F9X+F96, General Lao St, Toril, Davao City, Davao del Sur",
      coordinates: "7.018794722669158, 125.49848119837901",
    },
    {
      name: "PS9 Tugbok",
      phone: "09985987072 / 09082277648 / 293-1177",
      address: "3GP5+444, Tugbok, Davao City, 8000 Davao del Sur",
      coordinates: "7.085446402287649, 125.50790122883605",
    },
    {
      name: "PS10 Calinan",
      phone: "09985987074 / 295-0119",
      address: "5FQ2+QW8, H Quiambao St, Calinan District, Davao City, 8000 Davao del Sur",
      coordinates: "7.189501489500771, 125.452646461377",
    },
    {
      name: "PS11 Baguio",
      phone: "09985987076",
      address: "5CC3+V73, Baguio Road, Davao City, Davao del Sur",
      coordinates: "7.172208918163278, 125.40315983742406",
    },
    {
      name: "PS12 Marilog",
      phone: "09985987079",
      address: "C733+JMJ, Davao - Bukidnon Hwy, Marilog District, Davao City, 8000 Davao del Sur",
      coordinates: "7.406313963628985, 125.25868719472082",
    },
    {
      name: "PS13 Mandug",
      phone: "09639749831",
      address: "5H5H+FQJ, Mandug Rd, Buhangin, Davao City, Davao del Sur",
      coordinates: "7.158712265897077, 125.57938030393281",
    },
    {
      name: "PS15 Ecoland",
      phone: "09190932408",
      address: "76-A Candelaria, Talomo, Davao City, Davao del Sur",
      coordinates: "7.054131712097039, 125.60214948303488",
    },
    {
      name: "PS16 Maa",
      phone: "09094015088",
      address: "3HXQ+XVW, Bypass Road, Talomo, Lungsod ng Dabaw, Lalawigan ng Davao del Sur",
      coordinates: "7.100157191380795, 125.5899695885922",
    },
    {
      name: "PS17 Baliok",
      phone: "09079908630",
      address: "Barangay, Purok 2 Libby Road, Talomo, Davao City, 8000 Davao del Sur",
      coordinates: "7.04669076212661, 125.5010750653133",
    },
    {
      name: "PS18 Bajada",
      phone: "09691914296 / 282-0302",
      address: "3JW8+25M, Daang Maharlika Highway, Dacudao Ave, Poblacion District, Davao City, Davao del Sur",
      coordinates: "7.0953094237019725, 125.61549817857369",
    },
    {
      name: "PS19 Eden",
      phone: "09171309130",
      address: "—",
      coordinates: "—",
    },
    {
      name: "PS20 Los Amigos",
      phone: "09207444000 / 282-8769",
      address: "4FRH+MVQ, Tugbok, Davao City, 8000 Davao del Sur",
      coordinates: "7.141641470017805, 125.48006096137699",
    },
  ];

  return (
    <View style={localStyles.container}>
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity 
          onPress={() => router.push("/")}
          style={localStyles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={localStyles.headerCenter}>
          <Text style={localStyles.headerTitle}>
            <Text style={{ color: COLORS.primary }}>Alert</Text>
            <Text style={{ color: '#000' }}>Davao</Text>
          </Text>
          <Text style={localStyles.headerSubtitle}>Police Stations</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      <View style={localStyles.statsContainer}>
        <View style={[localStyles.statBox, { backgroundColor: '#e0f2fe' }]}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          <Text style={localStyles.statNumber}>{stations.length}</Text>
          <Text style={localStyles.statLabel}>Total Stations</Text>
        </View>
        <View style={[localStyles.statBox, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="location" size={20} color={COLORS.success} />
          <Text style={localStyles.statNumber}>{sortedStations.length}</Text>
          <Text style={localStyles.statLabel}>Results</Text>
        </View>
      </View>

      {/* Display User Address */}
      {userAddress && !searchAddress && (
        <View style={localStyles.userAddressContainer}>
          <Ionicons name="home" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={localStyles.userAddressLabel}>Your Saved Address</Text>
            <Text style={localStyles.userAddressText}>{userAddress}</Text>
          </View>
        </View>
      )}

      {/* Search Input */}
      <View style={{ zIndex: 10 }}>
        <View style={localStyles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={localStyles.searchInput}
            placeholder="Search by Barangay or Address..."
            placeholderTextColor={COLORS.textMuted}
            value={searchAddress}
            onChangeText={(text) => {
              setSearchAddress(text);
              if (text.length > 1) {
                setShowBarangayDropdown(true);
              } else {
                setShowBarangayDropdown(false);
              }
            }}
            onSubmitEditing={handleSearchAddress}
            returnKeyType="search"
          />
          <TouchableOpacity 
            onPress={handleSearchAddress}
            style={localStyles.searchButton}
          >
            <Ionicons name="search" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Barangay Dropdown */}
        {showBarangayDropdown && searchAddress.length > 0 && filteredBarangays.length > 0 && (
          <View style={localStyles.dropdown}>
            {filteredBarangays.map((barangay) => (
              <TouchableOpacity
                key={barangay.barangay_id}
                style={localStyles.dropdownItem}
                onPress={() => handleBarangaySelect(barangay)}
              >
                <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={localStyles.dropdownText}>{barangay.barangay_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Use Current Location Button */}
      <TouchableOpacity
        style={[localStyles.useLocationButton, isGeocoding && localStyles.useLocationButtonDisabled]}
        onPress={handleUseCurrentLocation}
        disabled={isGeocoding}
      >
        <Ionicons
          name="navigate"
          size={20}
          color={COLORS.white}
          style={{ marginRight: 10 }}
        />
        <Text style={localStyles.useLocationButtonText}>
          {isGeocoding ? 'Getting location...' : 'Use My Current Location'}
        </Text>
        {isGeocoding && <ActivityIndicator size="small" color={COLORS.white} style={{ marginLeft: 10 }} />}
      </TouchableOpacity>

      {/* Loading Indicator */}
      {isGeocoding && (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={localStyles.loadingText}>Finding nearest stations...</Text>
        </View>
      )}

      {/* Current Location Indicator */}
      {currentLocationName && userCoordinates && (
        <View style={localStyles.currentLocationContainer}>
          <Ionicons name="navigate-circle" size={20} color={COLORS.success} style={{ marginRight: 8 }} />
          <Text style={localStyles.currentLocationText}>
            Showing nearest stations from: <Text style={{ fontWeight: '700' }}>{currentLocationName}</Text>
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {sortedStations.length > 0 && (
          <Text style={localStyles.sectionTitle}>
            {userCoordinates ? "Nearest Police Stations" : "Search Results"}
          </Text>
        )}

        {!userCoordinates && sortedStations.length === 0 && (
          <View style={localStyles.emptyState}>
            <View style={localStyles.emptyIconContainer}>
              <Ionicons name="shield-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={localStyles.emptyTitle}>Find Your Nearest Station</Text>
            <Text style={localStyles.emptyText}>
              Search for a Barangay or use your current location to find the nearest police station.
            </Text>
          </View>
        )}

        {sortedStations.map((station, index) => (
          <View key={index} style={localStyles.card}>
            <View style={localStyles.cardHeader}>
              <View style={localStyles.cardTitleRow}>
                <View style={localStyles.stationIcon}>
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
                </View>
                <Text style={localStyles.cardTitle}>{station.name}</Text>
              </View>
              {station.distance > 0 && (
                <View style={localStyles.distanceBadge}>
                  <Ionicons name="navigate" size={12} color={COLORS.primary} />
                  <Text style={localStyles.distanceText}>{station.distance.toFixed(2)} km</Text>
                </View>
              )}
            </View>
            
            <View style={localStyles.cardDivider} />
            
            <View style={localStyles.cardContent}>
              <View style={localStyles.cardRow}>
                <Ionicons name="call" size={16} color={COLORS.success} />
                <Text style={localStyles.cardPhone}>{station.phone}</Text>
              </View>
              <View style={localStyles.cardRow}>
                <Ionicons name="location" size={16} color={COLORS.accent} />
                <Text style={localStyles.cardAddress}>{station.address}</Text>
              </View>
              <View style={localStyles.cardRow}>
                <Ionicons name="map" size={16} color={COLORS.textMuted} />
                <Text style={localStyles.cardCoordinates}>{station.coordinates}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default LocationScreen;

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Stats Summary
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // User Address
  userAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  userAddressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  userAddressText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Current Location
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  currentLocationText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
  },
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 4,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Dropdown
  dropdown: {
    position: 'absolute',
    top: 62,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  // Use Location Button
  useLocationButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  useLocationButtonDisabled: {
    opacity: 0.7,
  },
  useLocationButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Station Cards
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stationIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  cardContent: {
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  cardAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  cardCoordinates: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
});
