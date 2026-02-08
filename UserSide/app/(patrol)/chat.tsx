import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/backend';
import { spacing, fontSize, containerPadding, borderRadius } from '../../utils/responsive';

const COLORS = {
    primary: '#1D3557',
    primaryLight: '#2a4a7a',
    accent: '#E63946',
    white: '#ffffff',
    background: '#f5f7fa',
    textPrimary: '#1D3557',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    success: '#10b981',
    messageSent: '#1D3557',
    messageReceived: '#ffffff',
};

interface Contact {
    id: number;
    name: string;
    role: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

interface Message {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    sent_at: string;
    is_read: boolean;
}

export default function PatrolChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const contactId = params?.contactId ? String(params.contactId) : null;
    const contactName = params?.contactName ? String(params.contactName) : null;
    const contactRole = params?.contactRole ? String(params.contactRole) : null;

    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [conversations, setConversations] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showContacts, setShowContacts] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (userId) {
            if (contactId) {
                loadMessages();
            } else {
                loadConversations();
            }
        }
    }, [userId, contactId]);

    // Auto-refresh messages every 3 seconds when in a conversation
    useEffect(() => {
        if (!userId || !contactId) return;
        const interval = setInterval(() => loadMessages(false), 3000);
        return () => clearInterval(interval);
    }, [userId, contactId]);

    // Auto-refresh conversations every 5 seconds
    useEffect(() => {
        if (!userId || contactId) return;
        const interval = setInterval(() => loadConversations(false), 5000);
        return () => clearInterval(interval);
    }, [userId, contactId]);

    const loadUserData = async () => {
        try {
            const stored = await AsyncStorage.getItem('userData');
            if (!stored) return;
            const user = JSON.parse(stored);
            setUserId(user?.id?.toString() || user?.userId?.toString());
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadConversations = async (showLoading = true) => {
        if (!userId) return;
        if (showLoading) setLoading(true);
        try {
            const response = await fetch(`${API_URL}/messages/conversations/${userId}`);
            const data = await response.json();
            if (data.success) {
                // Filter to only show admin/police conversations
                const filtered = (data.data || []).filter((c: any) =>
                    c.role === 'admin' || c.role === 'police'
                );
                setConversations(filtered.map((c: any) => ({
                    id: c.other_user_id || c.id,
                    name: c.name || `${c.firstname || ''} ${c.lastname || ''}`.trim() || 'Unknown',
                    role: c.role || 'admin',
                    lastMessage: c.last_message || c.lastMessage,
                    lastMessageTime: c.last_message_time || c.lastMessageTime,
                    unreadCount: c.unread_count || 0,
                })));
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const loadContacts = async () => {
        try {
            const response = await fetch(`${API_URL}/messages/contacts/admin-police`);
            const data = await response.json();
            if (data.success) {
                setContacts(data.data || []);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    const loadMessages = async (showLoading = true) => {
        if (!userId || !contactId) return;
        if (showLoading) setLoading(true);
        try {
            const response = await fetch(`${API_URL}/messages/${userId}/${contactId}`);
            const data = await response.json();
            if (data.success) {
                setMessages(prev => {
                    const newData = data.data || [];
                    if (prev.length === newData.length && prev.length > 0) {
                        const lastOld = prev[prev.length - 1]?.message_id;
                        const lastNew = newData[newData.length - 1]?.message_id;
                        if (lastOld === lastNew) return prev;
                    }
                    return newData;
                });

                // Mark messages as read
                await fetch(`${API_URL}/messages/conversation/read`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, otherUserId: contactId }),
                }).catch(() => {});
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const sendChatMessage = async () => {
        if (!newMessage.trim() || !userId || !contactId || sending) return;
        setSending(true);
        const messageText = newMessage.trim();
        setNewMessage('');

        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: parseInt(userId),
                    receiverId: parseInt(contactId),
                    message: messageText,
                }),
            });
            const data = await response.json();
            if (data.success) {
                loadMessages(false);
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText); // Restore message on failure
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeAgo = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const getRoleIcon = (role: string) => {
        return role === 'admin' ? 'shield' : 'people';
    };

    const getRoleColor = (role: string) => {
        return role === 'admin' ? '#7C3AED' : COLORS.primary;
    };

    // Conversation thread view
    if (contactId) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                    <TouchableOpacity
                        onPress={() => router.push('/(patrol)/chat')}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.chatHeaderInfo}>
                        <View style={[styles.chatHeaderAvatar, { backgroundColor: getRoleColor(contactRole || 'admin') }]}>
                            <Ionicons name={getRoleIcon(contactRole || 'admin') as any} size={20} color={COLORS.white} />
                        </View>
                        <View>
                            <Text style={styles.chatHeaderName} numberOfLines={1}>{contactName || 'Unknown'}</Text>
                            <Text style={styles.chatHeaderRole}>
                                {contactRole === 'admin' ? 'Central Admin' : 'Police Station'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Messages */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                    >
                        {messages.length === 0 ? (
                            <View style={styles.emptyMessages}>
                                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
                                <Text style={styles.emptyText}>No messages yet</Text>
                                <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
                            </View>
                        ) : (
                            messages.map((msg) => {
                                const isMine = String(msg.sender_id) === userId;
                                return (
                                    <View
                                        key={msg.message_id}
                                        style={[
                                            styles.messageBubble,
                                            isMine ? styles.messageSent : styles.messageReceived,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.messageText,
                                            isMine ? styles.messageTextSent : styles.messageTextReceived,
                                        ]}>
                                            {msg.message}
                                        </Text>
                                        <Text style={[
                                            styles.messageTime,
                                            isMine ? styles.messageTimeSent : styles.messageTimeReceived,
                                        ]}>
                                            {formatTime(msg.sent_at)}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                )}

                {/* Message Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={sendChatMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={COLORS.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Conversation list view
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity
                    onPress={() => { loadContacts(); setShowContacts(true); }}
                    style={styles.newChatBtn}
                >
                    <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
            ) : conversations.length === 0 && !showContacts ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>No Conversations</Text>
                    <Text style={styles.emptySubtext}>
                        Tap the compose button to start a new conversation with admin or police.
                    </Text>
                    <TouchableOpacity
                        style={styles.startChatButton}
                        onPress={() => { loadContacts(); setShowContacts(true); }}
                    >
                        <Ionicons name="add" size={20} color={COLORS.white} />
                        <Text style={styles.startChatButtonText}>New Conversation</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* New Chat Contacts */}
                    {showContacts && (
                        <View style={styles.contactsSection}>
                            <View style={styles.contactsHeader}>
                                <Text style={styles.contactsSectionTitle}>Start New Conversation</Text>
                                <TouchableOpacity onPress={() => setShowContacts(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {contacts.length === 0 ? (
                                <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                </View>
                            ) : (
                                contacts.map((contact) => (
                                    <TouchableOpacity
                                        key={contact.id}
                                        style={styles.contactItem}
                                        onPress={() => {
                                            setShowContacts(false);
                                            router.push(`/(patrol)/chat?contactId=${contact.id}&contactName=${encodeURIComponent(contact.name)}&contactRole=${contact.role}`);
                                        }}
                                    >
                                        <View style={[styles.contactAvatar, { backgroundColor: getRoleColor(contact.role) }]}>
                                            <Ionicons name={getRoleIcon(contact.role) as any} size={20} color={COLORS.white} />
                                        </View>
                                        <View style={styles.contactInfo}>
                                            <Text style={styles.contactName}>{contact.name}</Text>
                                            <Text style={styles.contactRole}>
                                                {contact.role === 'admin' ? 'Central Admin' : 'Police Station'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    {/* Existing Conversations */}
                    {conversations.length > 0 && (
                        <View style={styles.conversationsSection}>
                            <Text style={styles.sectionTitle}>Recent Conversations</Text>
                            {conversations.map((conv) => (
                                <TouchableOpacity
                                    key={conv.id}
                                    style={styles.conversationItem}
                                    onPress={() => router.push(`/(patrol)/chat?contactId=${conv.id}&contactName=${encodeURIComponent(conv.name)}&contactRole=${conv.role}`)}
                                >
                                    <View style={[styles.contactAvatar, { backgroundColor: getRoleColor(conv.role) }]}>
                                        <Ionicons name={getRoleIcon(conv.role) as any} size={20} color={COLORS.white} />
                                        {(conv.unreadCount ?? 0) > 0 && (
                                            <View style={styles.unreadBadge}>
                                                <Text style={styles.unreadBadgeText}>
                                                    {(conv.unreadCount ?? 0) > 9 ? '9+' : conv.unreadCount}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.conversationInfo}>
                                        <View style={styles.conversationHeader}>
                                            <Text style={styles.conversationName} numberOfLines={1}>{conv.name}</Text>
                                            {conv.lastMessageTime && (
                                                <Text style={styles.conversationTime}>
                                                    {formatTimeAgo(conv.lastMessageTime)}
                                                </Text>
                                            )}
                                        </View>
                                        {conv.lastMessage && (
                                            <Text style={styles.conversationLastMsg} numberOfLines={1}>
                                                {conv.lastMessage}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
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
        paddingTop: containerPadding.vertical + 10,
        paddingBottom: spacing.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        padding: spacing.sm,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    newChatBtn: {
        padding: spacing.sm,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: fontSize.md,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
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
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    emptySubtext: {
        fontSize: fontSize.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    startChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    startChatButtonText: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.white,
    },

    // Contacts
    contactsSection: {
        backgroundColor: COLORS.white,
        marginHorizontal: containerPadding.horizontal,
        marginTop: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contactsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactsSectionTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    contactName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    contactRole: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // Conversations
    conversationsSection: {
        paddingHorizontal: containerPadding.horizontal,
        paddingTop: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: spacing.sm,
        paddingLeft: spacing.xs,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    conversationInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    conversationName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
    },
    conversationTime: {
        fontSize: fontSize.xs,
        color: COLORS.textMuted,
        marginLeft: spacing.sm,
    },
    conversationLastMsg: {
        fontSize: fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    unreadBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Chat View
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: containerPadding.horizontal,
        paddingTop: containerPadding.vertical + 10,
        paddingBottom: spacing.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    chatHeaderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: spacing.sm,
    },
    chatHeaderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    chatHeaderName: {
        fontSize: fontSize.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    chatHeaderRole: {
        fontSize: fontSize.xs,
        color: COLORS.textSecondary,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: containerPadding.horizontal,
        paddingTop: spacing.md,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    emptyMessages: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    messageSent: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.messageSent,
        borderBottomRightRadius: 4,
    },
    messageReceived: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.messageReceived,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageText: {
        fontSize: fontSize.md,
        lineHeight: fontSize.md * 1.4,
    },
    messageTextSent: {
        color: COLORS.white,
    },
    messageTextReceived: {
        color: COLORS.textPrimary,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
    },
    messageTimeSent: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'right',
    },
    messageTimeReceived: {
        color: COLORS.textMuted,
    },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: COLORS.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: COLORS.textPrimary,
        marginRight: spacing.sm,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textMuted,
    },
});
