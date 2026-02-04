import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, containerPadding, borderRadius, isTablet } from '../../utils/responsive';
import { API_URL } from '../../config/backend';

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
    info: '#3b82f6',
};

interface DispatchHistory {
    dispatch_id: number;
    report_id: number;
    crime_type: string;
    barangay: string;
    status: string;
    dispatched_at: string;
    responded_at: string | null;
    arrived_at: string | null;
    completed_at: string | null;
    verification_status: string;
    verification_notes: string | null;
}

export default function PatrolHistory() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState<DispatchHistory[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                loadHistory();
            }
        }, [userId])
    );

    const loadUserData = async () => {
        try {
            const stored = await AsyncStorage.getItem('userData');
            if (stored) {
                const user = JSON.parse(stored);
                const id = user?.id?.toString() || user?.userId?.toString();
                setUserId(id);
                if (id) {
                    loadHistory(id);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadHistory = async (id?: string) => {
        const uid = id || userId;
        if (!uid) return;

        try {
            const response = await fetch(
                `${API_URL}/patrol/history?userId=${uid}`,
                { headers: { 'X-User-Id': uid } }
            );
            const data = await response.json();
            
            if (data.success) {
                setHistory(data.data || []);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return COLORS.success;
            case 'cancelled':
            case 'declined':
                return COLORS.accent;
            case 'verified':
                return COLORS.info;
            default:
                return COLORS.warning;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'checkmark-circle';
            case 'cancelled':
            case 'declined':
                return 'close-circle';
            case 'verified':
                return 'shield-checkmark';
            default:
                return 'time';
        }
    };

    const getVerificationBadge = (verificationStatus: string) => {
        if (!verificationStatus) return null;
        
        const isVerified = verificationStatus === 'verified';
        const isFalseReport = verificationStatus === 'false_report';
        
        return (
            <View style={[
                styles.verificationBadge,
                { backgroundColor: isFalseReport ? '#FEE2E2' : (isVerified ? '#D1FAE5' : '#FEF3C7') }
            ]}>
                <Ionicons 
                    name={isFalseReport ? 'close-circle' : (isVerified ? 'checkmark-circle' : 'help-circle')} 
                    size={12} 
                    color={isFalseReport ? COLORS.accent : (isVerified ? COLORS.success : COLORS.warning)} 
                />
                <Text style={[
                    styles.verificationBadgeText,
                    { color: isFalseReport ? COLORS.accent : (isVerified ? COLORS.success : COLORS.warning) }
                ]}>
                    {isFalseReport ? 'False Report' : (isVerified ? 'Verified' : 'Unverified')}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dispatch History</Text>
                <View style={{ width: 40 }} />
            </View>

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
                {history.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="time-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>No History Yet</Text>
                        <Text style={styles.emptyText}>
                            Your completed dispatches will appear here
                        </Text>
                    </View>
                ) : (
                    history.map((item) => (
                        <TouchableOpacity
                            key={item.dispatch_id}
                            style={styles.historyCard}
                            onPress={() => router.push(`/(patrol)/dispatch-details?id=${item.dispatch_id}`)}
                        >
                            <View style={styles.historyHeader}>
                                <View style={[
                                    styles.statusIcon,
                                    { backgroundColor: `${getStatusColor(item.status)}20` }
                                ]}>
                                    <Ionicons 
                                        name={getStatusIcon(item.status)} 
                                        size={24} 
                                        color={getStatusColor(item.status)} 
                                    />
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyType}>{item.crime_type || 'Dispatch'}</Text>
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                                        <Text style={styles.historyLocation}>{item.barangay || 'Unknown'}</Text>
                                    </View>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: `${getStatusColor(item.status)}20` }
                                ]}>
                                    <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.historyTimeline}>
                                <View style={styles.timelineItem}>
                                    <Text style={styles.timelineLabel}>Dispatched</Text>
                                    <Text style={styles.timelineValue}>{formatDateTime(item.dispatched_at)}</Text>
                                </View>
                                {item.responded_at && (
                                    <View style={styles.timelineItem}>
                                        <Text style={styles.timelineLabel}>Responded</Text>
                                        <Text style={styles.timelineValue}>{formatDateTime(item.responded_at)}</Text>
                                    </View>
                                )}
                                {item.completed_at && (
                                    <View style={styles.timelineItem}>
                                        <Text style={styles.timelineLabel}>Completed</Text>
                                        <Text style={styles.timelineValue}>{formatDateTime(item.completed_at)}</Text>
                                    </View>
                                )}
                            </View>

                            {item.verification_status && (
                                <View style={styles.historyFooter}>
                                    {getVerificationBadge(item.verification_status)}
                                    {item.verification_notes && (
                                        <Text style={styles.verificationNotes} numberOfLines={1}>
                                            {item.verification_notes}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        padding: containerPadding.horizontal,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: spacing.lg,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: COLORS.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    historyCard: {
        backgroundColor: COLORS.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginTop: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    historyType: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    historyLocation: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    statusBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    historyTimeline: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    timelineItem: {
        minWidth: '30%',
    },
    timelineLabel: {
        fontSize: fontSize.xs,
        color: COLORS.textMuted,
    },
    timelineValue: {
        fontSize: fontSize.sm,
        color: COLORS.textPrimary,
        fontWeight: '500',
        marginTop: 2,
    },
    historyFooter: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    verificationBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: '500',
    },
    verificationNotes: {
        flex: 1,
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
});
