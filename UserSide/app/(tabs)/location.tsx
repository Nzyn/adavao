import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from '../../contexts/UserContext';
import * as Location from 'expo-location';
import styles from './styles';
import { BACKEND_URL } from '../../config/backend';

const LocationScreen = () => {
  const router = useRouter();
  const { user } = useUser(); 
  const [userAddress, setUserAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [sortedStations, setSortedStations] = useState<any[]>([]);
  const [currentLocationName, setCurrentLocationName] = useState(""); // Track which location is being used for sorting

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

  // Sort stations by distance when coordinates are available
  useEffect(() => {
    if (userCoordinates) {
      // Fetch nearest stations using the backend API
      fetchNearestStations(userCoordinates.latitude, userCoordinates.longitude);
    } else {
      // If no coordinates, show all stations in original order
      setSortedStations(stations);
    }
  }, [userCoordinates]);

  // Handle search address input
  const handleSearchAddress = async () => {
    if (searchAddress.trim()) {
      console.log('🔍 User searching for address:', searchAddress);
      await geocodeAddress(searchAddress, searchAddress, true);
    } else {
      Alert.alert('Please enter an address to search.');
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = async () => {
    try {
      setIsGeocoding(true);
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
      <View style={styles.headerHistory}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.textTitle}>
            <Text style={styles.alertWelcome}>Alert</Text>
            <Text style={styles.davao}>Davao</Text>
          </Text>
          <Text style={styles.subheadingCenter}>Police Stations</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Display User Address or Search Input */}
      {userAddress && (
        <View style={localStyles.userAddressContainer}>
          <Ionicons name="location" size={20} color="#1d3557" style={{ marginRight: 8 }} />
          <Text style={localStyles.userAddressText}>Saved Address: {userAddress}</Text>
        </View>
      )}
      
      {/* Search Address Input - Always visible */}
      <View style={localStyles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={localStyles.searchInput}
          placeholder="Enter address to find nearest stations"
          placeholderTextColor="#999"
          value={searchAddress}
          onChangeText={setSearchAddress}
          onSubmitEditing={handleSearchAddress}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearchAddress} disabled={!searchAddress.trim()}>
          <Ionicons 
            name="search-circle" 
            size={32} 
            color={searchAddress.trim() ? "#1d3557" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>

      {/* Use Current Location Button */}
      <TouchableOpacity 
        style={localStyles.useLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={isGeocoding}
      >
        <Ionicons 
          name="locate" 
          size={20} 
          color="#fff" 
          style={{ marginRight: 8 }}
        />
        <Text style={localStyles.useLocationButtonText}>
          {isGeocoding ? 'Getting location...' : 'Use My Current Location'}
        </Text>
      </TouchableOpacity>

      {/* Loading Indicator */}
      {isGeocoding && (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#1d3557" />
          <Text style={localStyles.loadingText}>Finding nearest stations...</Text>
        </View>
      )}

      {/* Current Location Indicator */}
      {currentLocationName && userCoordinates && (
        <View style={localStyles.currentLocationContainer}>
          <Ionicons name="navigate" size={18} color="#28a745" style={{ marginRight: 6 }} />
          <Text style={localStyles.currentLocationText}>
            Showing nearest stations from: <Text style={{ fontWeight: '600' }}>{currentLocationName}</Text>
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={localStyles.sectionTitle}>
          {userCoordinates ? "Police Stations (Nearest First)" : "Police Stations"}
        </Text>

        {sortedStations.map((station, index) => (
          <View key={index} style={localStyles.card}>
            <View style={localStyles.cardHeader}>
              <Text style={localStyles.cardTitle}>{station.name}</Text>
              {station.distance && (
                <Text style={localStyles.distanceText}>{station.distance.toFixed(2)} km</Text>
              )}
            </View>
            <Text style={localStyles.phone}>{station.phone}</Text>
            <Text style={localStyles.address}>{station.address}</Text>
            <Text style={localStyles.coordinates}>📍 {station.coordinates}</Text>
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
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  headerHistory: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  userAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f4f8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  userAddressText: {
    flex: 1,
    fontSize: 14,
    color: "#1d3557",
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#1d3557",
  },
  currentLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#28a745",
  },
  currentLocationText: {
    flex: 1,
    fontSize: 13,
    color: "#155724",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a2a66",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1d3557",
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#457b9d",
    backgroundColor: "#e8f4f8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phone: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: "#555",
    lineHeight: 16,
  },
  coordinates: {
    fontSize: 12,
    color: "#333",
    marginTop: 4,
  },
  useLocationButton: {
    backgroundColor: "#1d3557",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  useLocationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
