import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/backend';
import { spacing, fontSize, containerPadding, borderRadius, isTablet } from '../../utils/responsive';

export default function PatrolDashboard() {
    const router = useRouter();
    const [isOnDuty, setIsOnDuty] = useState(false);
    const [activeDispatches, setActiveDispatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadUserData();
        loadDispatches();
    }, []);

    const loadUserData = async () => {
        const name = await AsyncStorage.getItem('userName');
        setUserName(name || 'Officer');
    };

    const loadDispatches = async () => {
        // TODO: Implement dispatch loading from backend
        setLoading(false);
    };

    const toggleDutyStatus = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const response = await fetch(`${API_URL}/api/user/duty-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    is_on_duty: !isOnDuty,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setIsOnDuty(!isOnDuty);
                Alert.alert('Success', `You are now ${!isOnDuty ? 'ON' : 'OFF'} duty`);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update duty status');
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/(tabs)/login');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.name}>{userName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Duty Status Card */}
            <View style={[styles.card, isOnDuty ? styles.onDutyCard : styles.offDutyCard]}>
                <View style={styles.dutyHeader}>
                    <View style={styles.dutyInfo}>
                        <Ionicons
                            name={isOnDuty ? "radio-button-on" : "radio-button-off"}
                            size={32}
                            color={isOnDuty ? "#10b981" : "#6b7280"}
                        />
                        <View style={{ marginLeft: spacing.md }}>
                            <Text style={styles.dutyLabel}>Duty Status</Text>
                            <Text style={[styles.dutyStatus, isOnDuty && styles.onDutyText]}>
                                {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleBtn, isOnDuty && styles.toggleBtnActive]}
                        onPress={toggleDutyStatus}
                    >
                        <Text style={styles.toggleBtnText}>
                            {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadDispatches} />
                }
            >
                {/* Active Dispatches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Active Dispatches</Text>
                    {activeDispatches.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="car-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>No active dispatches</Text>
                            <Text style={styles.emptySubtext}>
                                {isOnDuty ? 'You will be notified when dispatched' : 'Go on duty to receive dispatches'}
                            </Text>
                        </View>
                    ) : (
                        activeDispatches.map((dispatch: any) => (
                            <TouchableOpacity key={dispatch.id} style={styles.dispatchCard}>
                                <Text style={styles.dispatchTitle}>{dispatch.crime_type}</Text>
                                <Text style={styles.dispatchLocation}>{dispatch.location}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionCard}>
                            <Ionicons name="list-outline" size={32} color="#3b82f6" />
                            <Text style={styles.actionText}>Dispatch History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard}>
                            <Ionicons name="map-outline" size={32} color="#10b981" />
                            <Text style={styles.actionText}>View Map</Text>
                        </TouchableOpacity>
                    </View>
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
    greeting: {
        fontSize: fontSize.sm,
        color: '#6b7280',
    },
    name: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: '#111827',
    },
    logoutBtn: {
        padding: spacing.sm,
    },
    card: {
        margin: containerPadding.horizontal,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    onDutyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    offDutyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#6b7280',
    },
    dutyHeader: {
        flexDirection: isTablet ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: isTablet ? 'center' : 'flex-start',
        gap: spacing.md,
    },
    dutyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dutyLabel: {
        fontSize: fontSize.sm,
        color: '#6b7280',
    },
    dutyStatus: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    onDutyText: {
        color: '#10b981',
    },
    toggleBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: '#3b82f6',
    },
    toggleBtnActive: {
        backgroundColor: '#6b7280',
    },
    toggleBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: fontSize.md,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: containerPadding.horizontal,
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        backgroundColor: '#fff',
        borderRadius: borderRadius.lg,
    },
    emptyText: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: spacing.md,
    },
    emptySubtext: {
        fontSize: fontSize.sm,
        color: '#9ca3af',
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    dispatchCard: {
        padding: spacing.lg,
        backgroundColor: '#fff',
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    dispatchTitle: {
        fontSize: fontSize.md,
        fontWeight: 'bold',
        color: '#111827',
    },
    dispatchLocation: {
        fontSize: fontSize.sm,
        color: '#6b7280',
        marginTop: spacing.xs,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionCard: {
        flex: 1,
        padding: spacing.lg,
        backgroundColor: '#fff',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionText: {
        fontSize: fontSize.sm,
        color: '#374151',
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});
