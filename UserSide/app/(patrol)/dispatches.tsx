import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/backend';
import { spacing, fontSize, containerPadding, borderRadius, isTablet } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// App color palette - matching AlertDavao theme
const COLORS = {
    primary: '#1D3557',
    primaryDark: '#152741',
    primaryLight: '#2a4a7a',
    accent: '#E63946',
    white: '#ffffff',
    background: '#f5f7fa',
    cardBg: '#ffffff',
    textPrimary: '#1D3557',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    urgent: '#dc2626',
};

interface Dispatch {
    dispatch_id: number;
    report_id: number;
    station_id: number;
    status: string;
    dispatched_at: string;
    notes: string | null;
    title: string;
    report_type: string | string[];
    description: string;
    report_created_at: string;
    latitude: number | null;
    longitude: number | null;
    barangay: string | null;
    reporters_address: string | null;
    closest_station_name: string | null;
}

export default function PatrolDispatchesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dispatches, setDispatches] = useState<Dispatch[]>([]);
    const [myDispatches, setMyDispatches] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [stationId, setStationId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'mine'>('pending');

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (userId && stationId) {
            loadDispatches();
        }
    }, [userId, stationId, activeTab]);

    // Auto-refresh dispatches every 2 seconds (silent)
    useEffect(() => {
        if (!userId || !stationId) return;
        
        const interval = setInterval(() => {
            loadDispatches(false);
        }, 2000);
        
        return () => clearInterval(interval);
    }, [userId, stationId, activeTab]);

    const loadUserData = async () => {
        try {
            const stored = await AsyncStorage.getItem('userData');
            if (!stored) {
                router.replace('/');
                return;
            }
            const user = JSON.parse(stored);
            const id = user?.id?.toString() || user?.userId?.toString();
            setUserId(id);
            setStationId(user?.assigned_station_id || user?.stationId || null);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadDispatches = async (isInitialLoad = true) => {
        if (!userId || !stationId) return;

        try {
            if (activeTab === 'pending') {
                // Load pending dispatches for the station
                const response = await fetch(
                    `${API_URL}/dispatch/station/${stationId}/pending?userId=${userId}`,
                    {
                        headers: { 'X-User-Id': userId },
                    }
                );
                const data = await response.json();
                if (data.success) {
                    // Only update if data changed to prevent flickering
                    setDispatches(prev => {
                        const newIds = (data.data || []).map((d: any) => `${d.dispatch_id}-${d.status}`);
                        const oldIds = prev.map(d => `${d.dispatch_id}-${d.status}`);
                        if (JSON.stringify(newIds) === JSON.stringify(oldIds)) return prev;
                        return data.data || [];
                    });
                }
            } else {
                // Load my accepted dispatches
                const response = await fetch(
                    `${API_URL}/patrol/dispatches?userId=${userId}`,
                    {
                        headers: { 'X-User-Id': userId },
                    }
                );
                const data = await response.json();
                if (data.success) {
                    // Only update if data changed to prevent flickering
                    setMyDispatches(prev => {
                        const newIds = (data.data || []).map((d: any) => `${d.dispatch_id}-${d.status}`);
                        const oldIds = prev.map((d: any) => `${d.dispatch_id}-${d.status}`);
                        if (JSON.stringify(newIds) === JSON.stringify(oldIds)) return prev;
                        return data.data || [];
                    });
                }
            }
        } catch (error) {
            // Silent fail for background polling
        } finally {
            if (isInitialLoad) setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDispatches();
    }, [userId, stationId, activeTab]);

    const handleRespondToDispatch = async (dispatchId: number) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/dispatch/${dispatchId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId || '',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'You have accepted this dispatch!', [
                    {
                        text: 'View Details',
                        onPress: () => router.push(`/(patrol)/dispatch-details?id=${dispatchId}`),
                    },
                ]);
                loadDispatches();
            } else {
                Alert.alert('Error', data.message || 'Failed to respond to dispatch');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to respond to dispatch');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const getTimeRemaining = (dispatchedAt: string) => {
        const dispatched = new Date(dispatchedAt);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - dispatched.getTime()) / 1000);
        const remaining = 180 - elapsed; // 3 minutes = 180 seconds
        return remaining;
    };

    const formatCrimeType = (reportType: string | string[]) => {
        if (Array.isArray(reportType)) {
            return reportType.join(', ');
        }
        try {
            const parsed = JSON.parse(reportType);
            if (Array.isArray(parsed)) return parsed.join(', ');
        } catch {}
        return reportType || 'Unknown';
    };

    const renderPendingDispatch = (dispatch: Dispatch) => {
        const timeRemaining = getTimeRemaining(dispatch.dispatched_at);
        const isUrgent = timeRemaining < 60 && timeRemaining > 0;
        const isOverdue = timeRemaining <= 0;

        return (
            <TouchableOpacity
                key={dispatch.dispatch_id}
                style={[
                    styles.dispatchCard,
                    isOverdue && styles.dispatchCardOverdue,
                    isUrgent && !isOverdue && styles.dispatchCardUrgent,
                ]}
                onPress={() => handleRespondToDispatch(dispatch.dispatch_id)}
            >
                <View style={styles.dispatchHeader}>
                    <View style={styles.dispatchTitleRow}>
                        <Ionicons
                            name="alert-circle"
                            size={24}
                            color={isOverdue ? COLORS.accent : isUrgent ? COLORS.warning : COLORS.primary}
                        />
                        <Text style={styles.dispatchTitle}>
                            {formatCrimeType(dispatch.report_type)}
                        </Text>
                    </View>
                    {timeRemaining > 0 ? (
                        <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
                            <Ionicons name="time-outline" size={14} color={isUrgent ? COLORS.white : COLORS.textPrimary} />
                            <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
                                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.overdueBadge}>
                            <Text style={styles.overdueText}>OVERDUE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.dispatchLocation}>
                    <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.locationText}>
                        {dispatch.barangay || dispatch.reporters_address || 'Location unavailable'}
                    </Text>
                </View>

                <View style={styles.dispatchStation}>
                    <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
                    <Text style={styles.stationText}>
                        {dispatch.closest_station_name || `Station #${dispatch.station_id}`}
                    </Text>
                </View>

                <View style={styles.dispatchFooter}>
                    <Text style={styles.dispatchTime}>
                        Dispatched {formatTimeAgo(dispatch.dispatched_at)}
                    </Text>
                    <TouchableOpacity
                        style={styles.respondButton}
                        onPress={() => handleRespondToDispatch(dispatch.dispatch_id)}
                    >
                        <Text style={styles.respondButtonText}>RESPOND</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderMyDispatch = (dispatch: any) => {
        const statusColors: Record<string, string> = {
            accepted: COLORS.primary,
            en_route: COLORS.warning,
            arrived: COLORS.success,
        };

        return (
            <TouchableOpacity
                key={dispatch.dispatch_id}
                style={styles.dispatchCard}
                onPress={() => router.push(`/(patrol)/dispatch-details?id=${dispatch.dispatch_id}`)}
            >
                <View style={styles.dispatchHeader}>
                    <View style={styles.dispatchTitleRow}>
                        <Ionicons name="document-text" size={24} color={COLORS.primary} />
                        <Text style={styles.dispatchTitle}>
                            {formatCrimeType(dispatch.report?.report_type)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[dispatch.status] || COLORS.textMuted }]}>
                        <Text style={styles.statusText}>
                            {dispatch.status?.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.dispatchLocation}>
                    <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.locationText}>
                        {dispatch.report?.location?.barangay || 'Location unavailable'}
                    </Text>
                </View>

                <View style={styles.dispatchFooter}>
                    <Text style={styles.dispatchTime}>
                        Accepted {formatTimeAgo(dispatch.accepted_at || dispatch.dispatched_at)}
                    </Text>
                    <View style={styles.viewDetailsRow}>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dispatches</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                        Pending ({dispatches.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
                    onPress={() => setActiveTab('mine')}
                >
                    <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
                        My Dispatches ({myDispatches.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading dispatches...</Text>
                    </View>
                ) : activeTab === 'pending' ? (
                    dispatches.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyTitle}>No Pending Dispatches</Text>
                            <Text style={styles.emptyText}>
                                All caught up! Pull down to refresh.
                            </Text>
                        </View>
                    ) : (
                        dispatches.map(renderPendingDispatch)
                    )
                ) : myDispatches.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>No Active Dispatches</Text>
                        <Text style={styles.emptyText}>
                            Check pending dispatches to respond to one.
                        </Text>
                    </View>
                ) : (
                    myDispatches.map(renderMyDispatch)
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: containerPadding.horizontal,
        paddingTop: containerPadding.vertical + 40,
        paddingBottom: spacing.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    refreshButton: {
        padding: spacing.sm,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingHorizontal: containerPadding.horizontal,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: fontSize.md,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: containerPadding.horizontal,
        paddingTop: spacing.md,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: fontSize.md,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: spacing.md,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: COLORS.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    dispatchCard: {
        backgroundColor: COLORS.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dispatchCardUrgent: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
    },
    dispatchCardOverdue: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
        backgroundColor: '#FEF2F2',
    },
    dispatchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    dispatchTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dispatchTitle: {
        fontSize: fontSize.md,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    timerBadgeUrgent: {
        backgroundColor: COLORS.warning,
    },
    timerText: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 4,
    },
    timerTextUrgent: {
        color: COLORS.white,
    },
    overdueBadge: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    overdueText: {
        fontSize: fontSize.xs,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    dispatchLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    locationText: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        marginLeft: spacing.xs,
        flex: 1,
    },
    dispatchStation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    stationText: {
        fontSize: fontSize.sm,
        color: COLORS.primary,
        fontWeight: '500',
        marginLeft: spacing.xs,
    },
    dispatchFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    dispatchTime: {
        fontSize: fontSize.xs,
        color: COLORS.textMuted,
    },
    respondButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    respondButtonText: {
        fontSize: fontSize.sm,
        fontWeight: 'bold',
        color: COLORS.white,
        marginRight: spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    statusText: {
        fontSize: fontSize.xs,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    viewDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetailsText: {
        fontSize: fontSize.sm,
        color: COLORS.primary,
        fontWeight: '500',
    },
});
