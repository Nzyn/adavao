import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/backend';
import { spacing, fontSize, containerPadding, borderRadius } from '../../utils/responsive';

export default function DispatchDetails() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const dispatchId = useMemo(() => String((params as any)?.id || ''), [params]);
    const [loading, setLoading] = useState(false);
    const [dispatch, setDispatch] = useState<any>(null);

    const loadDetails = async () => {
        if (!dispatchId) return;
        setLoading(true);
        try {
            const stored = await AsyncStorage.getItem('userData');
            const user = stored ? JSON.parse(stored) : null;
            const userId = user?.id?.toString() || user?.userId?.toString();
            if (!userId) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/patrol/dispatches/${encodeURIComponent(dispatchId)}?userId=${encodeURIComponent(userId)}`);
            const data = await response.json();
            if (response.ok && data?.success) {
                setDispatch(data.data);
            } else {
                Alert.alert('Error', data?.message || 'Failed to load dispatch details');
            }
        } catch {
            Alert.alert('Error', 'Failed to load dispatch details');
        } finally {
            setLoading(false);
        }
    };

    const postAction = async (action: 'accept' | 'decline') => {
        if (!dispatchId) return;
        setLoading(true);
        try {
            const stored = await AsyncStorage.getItem('userData');
            const user = stored ? JSON.parse(stored) : null;
            const userId = user?.id?.toString() || user?.userId?.toString();
            if (!userId) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/patrol/dispatches/${encodeURIComponent(dispatchId)}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, reason: action === 'decline' ? 'Declined in app' : undefined }),
            });
            const data = await response.json();
            if (response.ok && data?.success) {
                Alert.alert('Success', data?.message || 'Updated');
                await loadDetails();
            } else {
                Alert.alert('Error', data?.message || 'Failed');
            }
        } catch {
            Alert.alert('Error', 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatchId]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dispatch Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Dispatch #{dispatchId}</Text>
                    {loading && !dispatch ? (
                        <View style={{ marginTop: spacing.md }}>
                            <ActivityIndicator />
                        </View>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>
                                {Array.isArray(dispatch?.report?.report_type) ? dispatch.report.report_type.join(', ') : (dispatch?.report?.report_type || 'Crime details')}
                            </Text>
                            <Text style={[styles.subtitle, { marginTop: spacing.xs }]}>
                                {dispatch?.report?.location?.barangay || 'Location unavailable'}
                            </Text>
                        </>
                    )}
                </View>

                <View style={styles.actionsCard}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        disabled={loading}
                        onPress={() => postAction('accept')}
                    >
                        <Text style={styles.actionBtnText}>Accept Dispatch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.declineBtn]}
                        disabled={loading}
                        onPress={() => {
                            Alert.alert('Decline dispatch?', 'Are you sure you want to decline this dispatch?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Decline', style: 'destructive', onPress: () => postAction('decline') }
                            ]);
                        }}
                    >
                        <Text style={styles.actionBtnText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: containerPadding.horizontal,
        paddingTop: containerPadding.vertical + 40,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: {
        padding: spacing.sm,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: containerPadding.horizontal,
    },
    card: {
        backgroundColor: '#fff',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: '#6b7280',
        marginTop: spacing.xs,
    },
    actionsCard: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    actionBtn: {
        backgroundColor: '#3b82f6',
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    declineBtn: {
        backgroundColor: '#ef4444',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: fontSize.md,
        fontWeight: '600',
    },
});
