import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, containerPadding, borderRadius } from '../../utils/responsive';

export default function DispatchDetails() {
    const router = useRouter();
    const params = useLocalSearchParams();

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
                    <Text style={styles.title}>Dispatch #{params.id}</Text>
                    <Text style={styles.subtitle}>Crime details and location information</Text>
                </View>

                <View style={styles.actionsCard}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>Accept Dispatch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]}>
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
