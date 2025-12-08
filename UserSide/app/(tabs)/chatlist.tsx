import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import styles from "./styles";
import { Link } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { messageService, ChatConversation } from '../../services/messageService';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Today - show time
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

const FAQProfileItem = React.memo(() => (
    <Link href="/FAQScreen" asChild>
        <Pressable
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                backgroundColor: '#F5F5F5',
            }}
        >
            {/* Avatar */}
            <View style={{ marginRight: 12 }}>
                <View
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: '#FF6B6B',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="help-circle" size={24} color="#fff" />
                </View>
            </View>

            {/* Chat Info */}
            <View style={{ flex: 1 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D3557' }}>FAQ</Text>
                    <View
                        style={{
                            backgroundColor: '#FF6B6B',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>PINNED</Text>
                    </View>
                </View>
                <Text
                    style={{ fontSize: 14, color: '#666' }}
                    numberOfLines={1}
                >
                    Get instant answers to common questions
                </Text>
            </View>
        </Pressable>
    </Link>
));

const ChatListItem = React.memo(({ item }: { item: ChatConversation }) => (
    <Link
        href={{
            pathname: "/ChatScreen",
            params: {
                otherUserId: item.user_id,
                otherUserName: item.user_name
            }
        }}
        asChild
    >
        <Pressable style={styles.chatItem}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: '#1D3557' }]}>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                        {item.user_firstname.charAt(0)}{item.user_lastname.charAt(0)}
                    </Text>
                </View>
            </View>

            {/* Chat Info */}
            <View style={styles.chatInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.name}>{item.user_name}</Text>
                    <Text style={styles.date}>{formatDate(item.last_message_time)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.message, item.unread_count > 0 && { fontWeight: '600' }]} numberOfLines={1}>
                        {item.last_message}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    </Link>
));

export default function ChatList({ navigation }: any) {
    const { user } = useUser();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = async () => {
        if (!user || !user.id) {
            setError('Please log in to view messages');
            setLoading(false);
            return;
        }

        try {
            setError(null);
            console.log('Fetching conversations for user:', user.id);
            const response = await messageService.getUserConversations(parseInt(user.id));

            if (response.success) {
                setConversations(response.data);
                console.log('Fetched', response.data.length, 'conversations');
            } else {
                setError('Failed to load conversations');
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // Fetch immediately when component mounts
        fetchConversations();

        // Set up auto-refresh every 3 seconds
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing conversations...');
            fetchConversations();
        }, 3000); // Refresh every 3 seconds

        return () => clearInterval(interval);
    }, [user]);

    // Refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('Chat list screen focused, refreshing conversations...');
            fetchConversations();
        }, [user])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };



    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1D3557" />
                <Text style={{ marginTop: 12, color: '#666' }}>Loading conversations...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header with Back Button and Title */}
            <View style={styles.headerHistory}>
                <TouchableOpacity onPress={() => router.push('/')}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.textTitle}>
                        <Text style={styles.alertWelcome}>Alert</Text>
                        <Text style={styles.davao}>Davao</Text>
                    </Text>
                    <Text style={styles.subheadingCenter}>Messages</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {/* Error Message */}
            {error && (
                <View style={{ padding: 15, backgroundColor: '#ffebee', marginHorizontal: 15, marginTop: 10, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#c62828' }}>
                    <Text style={{ color: '#c62828', textAlign: 'left', fontWeight: '500' }}>{error}</Text>
                </View>
            )}

            {/* Chat List */}
            {conversations.length > 0 && (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.user_id.toString()}
                    renderItem={({ item }) => <ChatListItem item={item} />}
                    contentContainerStyle={{ paddingVertical: 15, paddingHorizontal: 10, paddingBottom: 50 }}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    bounces={true}
                    ListHeaderComponent={<FAQProfileItem />}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1D3557']} />
                    }
                />
            )}

            {/* FAQ Profile when no conversations */}
            {!loading && !error && conversations.length === 0 && (
                <View style={{ flex: 1 }}>
                    <FAQProfileItem />
                </View>
            )}

            {/* Empty State with Helpful Message */}
            {!loading && !error && conversations.length === 0 && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
                    <View style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        backgroundColor: '#E3F2FD',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20
                    }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={50} color="#1D3557" />
                    </View>

                    <Text style={{ marginBottom: 12, fontSize: 22, fontWeight: '700', color: '#1D3557', textAlign: 'center' }}>
                        No Active Conversations
                    </Text>

                    <Text style={{ marginBottom: 8, fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 }}>
                        Police officers will contact you here regarding your reports or concerns.
                    </Text>

                    <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12, width: '100%', borderLeftWidth: 4, borderLeftColor: '#1D3557' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <Ionicons name="shield-checkmark" size={18} color="#1D3557" style={{ marginRight: 10, marginTop: 2 }} />
                            <Text style={{ fontSize: 12, color: '#555', flex: 1, lineHeight: 18, fontWeight: '500' }}>
                                Only verified officers can contact you. Keep your reports updated for faster response.
                            </Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0', width: '100%' }}>
                        <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 }}>
                            🔄 Messages sync automatically. Check back for updates from officers about your reports.
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}