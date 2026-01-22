import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Text } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BACKEND_URL } from '../config/backend';

interface Barangay {
  name: string;
  latitude: number;
  longitude: number;
  crime_rate: number;
  incidents: number;
  population: number;
}

interface HotspotCard {
  barangay: Barangay;
  level: 'high' | 'medium' | 'low';
}

const { width, height } = Dimensions.get('window');

const WeatherForecastHotspot: React.FC = () => {
  const [hotspots, setHotspots] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Barangay | null>(null);
  const [mapView, setMapView] = useState<'map' | 'cards'>('cards');

  const colors = {
    high: { main: '#dc2626', light: '#fee2e2', text: '#991b1b' },
    medium: { main: '#f59e0b', light: '#fef3c7', text: '#92400e' },
    low: { main: '#10b981', light: '#dcfce7', text: '#166534' },
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
        <ThemedText style={styles.loadingText}>Loading hotspots...</ThemedText>
      </ThemedView>
    );
  }

  // Sorted by crime rate
  const sortedHotspots = [...hotspots].sort((a, b) => b.crime_rate - a.crime_rate);
  const highCount = hotspots.filter(h => getCrimeLevel(h.crime_rate) === 'high').length;
  const mediumCount = hotspots.filter(h => getCrimeLevel(h.crime_rate) === 'medium').length;
  const lowCount = hotspots.filter(h => getCrimeLevel(h.crime_rate) === 'low').length;
  const avgRate = hotspots.reduce((sum, h) => sum + h.crime_rate, 0) / hotspots.length;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Crime Hotspots</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Real-time crime rate visualization
        </ThemedText>
      </View>

      {/* Stats Cards - Weather Forecast Style */}
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

      {/* Weather Forecast Style Hotspot Cards */}
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
                    📍 Area
                  </ThemedText>
                  <ThemedText style={[styles.statItemValue, { color: colorScheme.text }]}>
                    View
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
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  statsScroll: {
    marginVertical: 15,
  },
  statsContainer: {
    paddingHorizontal: 15,
    gap: 12,
  },
  statCard: {
    minWidth: 140,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderLeftWidth: 4,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cardsTitle: {
    marginTop: 15,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  barangayName: {
    fontSize: 16,
    fontWeight: '700',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  rateDisplay: {
    borderTopWidth: 2,
    paddingTop: 12,
    marginBottom: 12,
  },
  largeRateBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  largeRate: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  rateUnit: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: '#d1d5db',
    opacity: 0.5,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default WeatherForecastHotspot;
