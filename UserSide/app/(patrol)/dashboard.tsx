import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
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
};

export default function PatrolDashboard() {
    const router = useRouter();
    const [userName, setUserName] = useState('Officer');
    const [loading, setLoading] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock data for UI

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const stored = await AsyncStorage.getItem('userData');
            if (!stored) {
                setUserName('Officer');
                return;
            }
            const user = JSON.parse(stored);
            const first = user?.firstname || user?.firstName || '';
            const last = user?.lastname || user?.lastName || '';
            const full = `${first} ${last}`.trim();
            setUserName(full || user?.email || 'Officer');
        } catch {
            setUserName('Officer');
        }
    };

    const onRefresh = () => {
        setLoading(true);
        // Simulate refresh - will connect to backend later
        setTimeout(() => setLoading(false), 1000);
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Mock data for recent reports (UI only)
    const recentReports = [
        { id: 1, type: 'Theft', location: 'Brgy. Talomo', time: '2 hours ago', status: 'pending' },
        { id: 2, type: 'Assault', location: 'Brgy. Poblacion', time: '5 hours ago', status: 'responding' },
    ];

    // Mock data for announcements (UI only)
    const announcements = [
        { id: 1, title: 'Patrol Schedule Update', message: 'New patrol schedules have been posted for next week.', date: 'Today' },
        { id: 2, title: 'Equipment Check', message: 'All officers must complete equipment check by Friday.', date: 'Yesterday' },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                        </View>
                        <View style={styles.onlineIndicator} />
                    </View>
                    <View style={styles.welcomeText}>
                        <Text style={styles.welcomeLabel}>Welcome back,</Text>
                        <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={26} color={COLORS.primary} />
                    {unreadNotifications > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Banner */}
                <View style={styles.bannerContainer}>
                    <View style={styles.banner}>
                        <View style={styles.bannerContent}>
                            <View style={styles.bannerTextContainer}>
                                <Text style={styles.bannerTitle}>Patrol Dashboard</Text>
                                <Text style={styles.bannerSubtitle}>
                                    Stay safe and serve the community
                                </Text>
                            </View>
                            <View style={styles.bannerIconContainer}>
                                <Ionicons name="shield-checkmark" size={48} color="rgba(255,255,255,0.3)" />
                            </View>
                        </View>
                        <View style={styles.bannerStats}>
                            <View style={styles.bannerStatItem}>
                                <Text style={styles.bannerStatValue}>12</Text>
                                <Text style={styles.bannerStatLabel}>Dispatches Today</Text>
                            </View>
                            <View style={styles.bannerStatDivider} />
                            <View style={styles.bannerStatItem}>
                                <Text style={styles.bannerStatValue}>8h</Text>
                                <Text style={styles.bannerStatLabel}>On Duty</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <View style={[styles.quickActionIconBg, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="chatbubbles-outline" size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.quickActionText}>Messages</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionButtonCenter}>
                        <View style={[styles.quickActionIconBgLarge, { backgroundColor: COLORS.primary }]}>
                            <Ionicons name="time-outline" size={28} color={COLORS.white} />
                        </View>
                        <Text style={styles.quickActionText}>History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionButton}>
                        <View style={[styles.quickActionIconBg, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="list-outline" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.quickActionText}>Task List</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Reports Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Reports</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {recentReports.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No recent reports</Text>
                        </View>
                    ) : (
                        recentReports.map((report) => (
                            <TouchableOpacity key={report.id} style={styles.reportCard}>
                                <View style={styles.reportCardLeft}>
                                    <View style={[
                                        styles.reportStatusIndicator,
                                        { backgroundColor: report.status === 'responding' ? COLORS.success : COLORS.warning }
                                    ]} />
                                    <View style={styles.reportInfo}>
                                        <Text style={styles.reportType}>{report.type}</Text>
                                        <View style={styles.reportLocationRow}>
                                            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.reportLocation}>{report.location}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.reportCardRight}>
                                    <Text style={styles.reportTime}>{report.time}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: report.status === 'responding' ? '#D1FAE5' : '#FEF3C7' }
                                    ]}>
                                        <Text style={[
                                            styles.statusBadgeText,
                                            { color: report.status === 'responding' ? '#059669' : '#D97706' }
                                        ]}>
                                            {report.status === 'responding' ? 'Responding' : 'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Announcements Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Announcements</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {announcements.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="megaphone-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No announcements</Text>
                        </View>
                    ) : (
                        announcements.map((announcement) => (
                            <TouchableOpacity key={announcement.id} style={styles.announcementCard}>
                                <View style={styles.announcementIconContainer}>
                                    <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.announcementContent}>
                                    <View style={styles.announcementHeader}>
                                        <Text style={styles.announcementTitle}>{announcement.title}</Text>
                                        <Text style={styles.announcementDate}>{announcement.date}</Text>
                                    </View>
                                    <Text style={styles.announcementMessage} numberOfLines={2}>
                                        {announcement.message}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home" size={24} color={COLORS.primary} />
                    <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="map-outline" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navText}>Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItemCenter}>
                    <View style={styles.navCenterButton}>
                        <Ionicons name="radio" size={28} color={COLORS.white} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navText}>Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="person-outline" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    
    // Header Styles
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: isTablet ? 56 : 48,
        height: isTablet ? 56 : 48,
        borderRadius: isTablet ? 28 : 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: fontSize.lg,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    welcomeText: {
        marginLeft: spacing.md,
        flex: 1,
    },
    welcomeLabel: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
    },
    userName: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    notificationButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Content
    content: {
        flex: 1,
    },

    // Banner Styles
    bannerContainer: {
        paddingHorizontal: containerPadding.horizontal,
        paddingTop: spacing.lg,
    },
    banner: {
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        overflow: 'hidden',
        backgroundColor: COLORS.primary,
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bannerTextContainer: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: spacing.xs,
    },
    bannerSubtitle: {
        fontSize: fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    bannerIconContainer: {
        marginLeft: spacing.md,
    },
    bannerStats: {
        flexDirection: 'row',
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    bannerStatItem: {
        flex: 1,
    },
    bannerStatDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: spacing.md,
    },
    bannerStatValue: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    bannerStatLabel: {
        fontSize: fontSize.xs,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },

    // Quick Actions Styles
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: containerPadding.horizontal,
        paddingVertical: spacing.xl,
        gap: spacing.lg,
    },
    quickActionButton: {
        alignItems: 'center',
        flex: 1,
    },
    quickActionButtonCenter: {
        alignItems: 'center',
        flex: 1,
        marginTop: -spacing.md,
    },
    quickActionIconBg: {
        width: isTablet ? 64 : 56,
        height: isTablet ? 64 : 56,
        borderRadius: isTablet ? 32 : 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionIconBgLarge: {
        width: isTablet ? 80 : 70,
        height: isTablet ? 80 : 70,
        borderRadius: isTablet ? 40 : 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    quickActionText: {
        fontSize: fontSize.sm,
        color: COLORS.textPrimary,
        marginTop: spacing.sm,
        fontWeight: '600',
    },

    // Section Styles
    section: {
        paddingHorizontal: containerPadding.horizontal,
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    seeAllText: {
        fontSize: fontSize.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },

    // Empty State
    emptyCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: COLORS.textMuted,
        marginTop: spacing.md,
    },

    // Report Card Styles
    reportCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reportCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    reportStatusIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: spacing.md,
    },
    reportInfo: {
        flex: 1,
    },
    reportType: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    reportLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reportLocation: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    reportCardRight: {
        alignItems: 'flex-end',
    },
    reportTime: {
        fontSize: fontSize.xs,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    statusBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: '600',
    },

    // Announcement Card Styles
    announcementCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    announcementIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    announcementContent: {
        flex: 1,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    announcementTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
    },
    announcementDate: {
        fontSize: fontSize.xs,
        color: COLORS.textMuted,
        marginLeft: spacing.sm,
    },
    announcementMessage: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        lineHeight: fontSize.sm * 1.4,
    },

    // Bottom Navigation Styles
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingVertical: spacing.sm,
        paddingBottom: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
    },
    navItemCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -spacing.xl,
    },
    navCenterButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    navText: {
        fontSize: fontSize.xs,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    navTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
