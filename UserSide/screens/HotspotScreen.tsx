import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import GradientContainer from '@/components/GradientContainer';
import { BACKEND_URL } from '@/config/backend';

interface Barangay {
  name: string;
  latitude: number;
  longitude: number;
  crime_rate: number;
  incidents: number;
  population: number;
}

const { width, height } = Dimensions.get('window');

const HotspotScreen: React.FC = () => {
  const [hotspots, setHotspots] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [selectedHotspot, setSelectedHotspot] = useState<Barangay | null>(null);

  const colors = {
    high: { main: '#dc2626', light: '#fee2e2', text: '#991b1b', rgb: 'rgba(220, 38, 38, 0.3)' },
    medium: { main: '#f59e0b', light: '#fef3c7', text: '#92400e', rgb: 'rgba(245, 158, 11, 0.3)' },
    low: { main: '#10b981', light: '#dcfce7', text: '#166534', rgb: 'rgba(16, 185, 129, 0.3)' },
  };

  useEffect(() => {
    fetchHotspotData();
  }, []);

  const fetchHotspotData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/hotspot-data`);
      const data = await response.json();
      setHotspots(data.barangays || []);
    } catch (error) {
      console.error('Error fetching hotspot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCrimeLevel = (rate: number): 'high' | 'medium' | 'low' => {
    if (rate > 8) return 'high';
    if (rate >= 4) return 'medium';
    return 'low';
  };

  const getCircleRadius = (rate: number): number => {
    return 1500 + (rate / 15) * 3000;
  };

  const getLevelLabel = (level: 'high' | 'medium' | 'low'): string => {
    switch (level) {
      case 'high':
        return '🔴 CRITICAL';
      case 'medium':
        return '🟠 HIGH';
      case 'low':
        return '🟢 LOW';
    }
  };

  const sortedHotspots = [...hotspots].sort((a, b) => b.crime_rate - a.crime_rate);
  const highCount = hotspots.filter(h => getCrimeLevel(h.crime_rate) === 'high').length;
  const mediumCount = hotspots.filter(h => getCrimeLevel(h.crime_rate) === 'medium').length;
  const lowCount = hotspots.filter(h => getCrimeLevel(h.crime_rate) === 'low').length;
  const avgRate = hotspots.length > 0 ? hotspots.reduce((sum, h) => sum + h.crime_rate, 0) / hotspots.length : 0;

  // Calculate map center and bounds
  const mapCenter = hotspots.length > 0 ? {
    latitude: (hotspots.reduce((sum, h) => sum + h.latitude, 0) / hotspots.length),
    longitude: (hotspots.reduce((sum, h) => sum + h.longitude, 0) / hotspots.length),
  } : { latitude: 7.1907, longitude: 125.4553 };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <GradientContainer style={styles.header}>
          <ThemedText style={styles.headerTitle}>Crime Hotspots</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Loading...</ThemedText>
        </GradientContainer>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <GradientContainer style={styles.header}>
        <ThemedText style={styles.headerTitle}>Crime Hotspots</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Real-time crime rate visualization
        </ThemedText>
      </GradientContainer>

      {/* View Mode Selector */}
      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'cards' && styles.viewModeActive]}
          onPress={() => setViewMode('cards')}
        >
          <ThemedText
            style={[
              styles.viewModeText,
              viewMode === 'cards' && styles.viewModeTextActive,
            ]}
          >
            Cards
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'map' && styles.viewModeActive]}
          onPress={() => setViewMode('map')}
        >
          <ThemedText
            style={[
              styles.viewModeText,
              viewMode === 'map' && styles.viewModeTextActive,
            ]}
          >
            Map
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Stats Cards - Always visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={[styles.statCard, { borderLeftColor: colors.high.main }]}>
          <ThemedText style={styles.statLabel}>High Risk</ThemedText>
          <ThemedText style={styles.statValue}>{highCount}</ThemedText>
          <ThemedText style={styles.statSubtext}>&gt; 8 per 1K</ThemedText>
        </View>

        <View style={[styles.statCard, { borderLeftColor: colors.medium.main }]}>
          <ThemedText style={styles.statLabel}>Medium Risk</ThemedText>
          <ThemedText style={styles.statValue}>{mediumCount}</ThemedText>
          <ThemedText style={styles.statSubtext}>4-7 per 1K</ThemedText>
        </View>

        <View style={[styles.statCard, { borderLeftColor: colors.low.main }]}>
          <ThemedText style={styles.statLabel}>Low Risk</ThemedText>
          <ThemedText style={styles.statValue}>{lowCount}</ThemedText>
          <ThemedText style={styles.statSubtext}>&lt; 4 per 1K</ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Avg Rate</ThemedText>
          <ThemedText style={styles.statValue}>{avgRate.toFixed(1)}</ThemedText>
          <ThemedText style={styles.statSubtext}>per 1K people</ThemedText>
        </View>
      </ScrollView>

      {/* Content Based on View Mode */}
      {viewMode === 'cards' ? (
        // Weather Forecast Style Cards
        <ScrollView style={styles.cardsContainer}>
          <View style={styles.cardsTitle}>
            <ThemedText style={styles.cardsTitleText}>Crime Hotspots Ranking</ThemedText>
          </View>

          {sortedHotspots.map((hotspot, index) => {
            const level = getCrimeLevel(hotspot.crime_rate);
            const colorScheme = colors[level];

            return (
              <View
                key={hotspot.name}
                style={[
                  styles.weatherCard,
                  {
                    borderLeftColor: colorScheme.main,
                    backgroundColor: colorScheme.light,
                  },
                ]}
              >
                {/* Card Header with Rank */}
                <View style={styles.cardHeader}>
                  <View style={styles.rankBadge}>
                    <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.barangayName, { color: colorScheme.text }]}>
                      {hotspot.name}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: colorScheme.main },
                    ]}
                  >
                    <ThemedText style={styles.riskBadgeText}>
                      {getLevelLabel(level)}
                    </ThemedText>
                  </View>
                </View>

                {/* Crime Rate Display - Prominent Weather Forecast Style */}
                <View style={[styles.rateDisplay, { borderTopColor: colorScheme.main }]}>
                  <View style={styles.largeRateBox}>
                    <ThemedText
                      style={[
                        styles.largeRate,
                        { color: colorScheme.main },
                      ]}
                    >
                      {hotspot.crime_rate.toFixed(2)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.rateUnit,
                        { color: colorScheme.text },
                      ]}
                    >
                      crimes per 1K
                    </ThemedText>
                  </View>
                </View>

                {/* Stats Row - Horizontal layout like weather forecast */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statItemLabel, { color: colorScheme.text }]}>
                      📊 Incidents
                    </ThemedText>
                    <ThemedText style={[styles.statItemValue, { color: colorScheme.text }]}>
                      {hotspot.incidents}
                    </ThemedText>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statItemLabel, { color: colorScheme.text }]}>
                      👥 Population
                    </ThemedText>
                    <ThemedText style={[styles.statItemValue, { color: colorScheme.text }]}>
                      {(hotspot.population / 1000).toFixed(1)}K
                    </ThemedText>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statItemLabel, { color: colorScheme.text }]}>
                      📈 Risk
                    </ThemedText>
                    <ThemedText style={[styles.statItemValue, { color: colorScheme.text }]}>
                      {level === 'high' ? '●●●' : level === 'medium' ? '●●○' : '●○○'}
                    </ThemedText>
                  </View>
                </View>

                {/* Progress Bar - Like weather intensity */}
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: colorScheme.main,
                        width: `${(hotspot.crime_rate / 12) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        // Map View with Weather-forecast style circles
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: mapCenter.latitude,
              longitude: mapCenter.longitude,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
          >
            {/* Render hotspot circles and markers */}
            {hotspots.map((hotspot) => {
              const level = getCrimeLevel(hotspot.crime_rate);
              const colorScheme = colors[level];
              const radius = getCircleRadius(hotspot.crime_rate);

              return (
                <React.Fragment key={hotspot.name}>
                  {/* Circle overlay */}
                  <Circle
                    center={{
                      latitude: hotspot.latitude,
                      longitude: hotspot.longitude,
                    }}
                    radius={radius}
                    strokeColor={colorScheme.main}
                    fillColor={colorScheme.rgb}
                    strokeWidth={2}
                  />

                  {/* Marker with crime rate */}
                  <Marker
                    coordinate={{
                      latitude: hotspot.latitude,
                      longitude: hotspot.longitude,
                    }}
                    title={hotspot.name}
                    description={`${hotspot.crime_rate.toFixed(2)} per 1K`}
                    pinColor={colorScheme.main}
                  />
                </React.Fragment>
              );
            })}
          </MapView>

          {/* Map Legend */}
          <View style={styles.mapLegend}>
            <ThemedText style={styles.mapLegendTitle}>Crime Intensity</ThemedText>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.high.main }]}
              />
              <ThemedText style={styles.legendText}>High (8+)</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.medium.main }]}
              />
              <ThemedText style={styles.legendText}>Medium (4-7)</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.low.main }]}
              />
              <ThemedText style={styles.legendText}>Low (&lt;4)</ThemedText>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  viewModeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  viewModeActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  viewModeText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewModeTextActive: {
    color: 'white',
  },
  statsScroll: {
    marginVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  statCard: {
    minWidth: 130,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderLeftWidth: 4,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statSubtext: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 3,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cardsTitle: {
    marginBottom: 12,
  },
  cardsTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  weatherCard: {
    borderRadius: 16,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  barangayName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  rateDisplay: {
    borderTopWidth: 2,
    paddingTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  largeRateBox: {
    alignItems: 'center',
  },
  largeRate: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  rateUnit: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statItemValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: '#d1d5db',
    opacity: 0.4,
    marginHorizontal: 8,
  },
  progressContainer: {
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 140,
  },
  mapLegendTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#374151',
  },
});

export default HotspotScreen;
