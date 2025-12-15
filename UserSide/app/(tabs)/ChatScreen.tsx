import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import styles from "./styles";
import { useUser } from '../../contexts/UserContext';
import { messageService, Message } from '../../services/messageService';
import { userService } from '../../services/userService';
import { BACKEND_URL } from '../../config/backend';

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const ChatMessage = React.memo(({ item, userId }: { item: Message, userId: string | undefined }) => {
    const isUserMessage = item.sender_id.toString() === userId;

    return (
        <View style={[
            styles.messageContainer,
            isUserMessage ? styles.userMsg : styles.officerMsg
        ]}>
            <Text style={[styles.messageText, isUserMessage && { color: '#fff' }]}>
                {item.message}
            </Text>
            <Text style={[styles.timeText, isUserMessage && { color: '#e0e0e0' }]}>
                {formatTime(item.sent_at)}
            </Text>
        </View>
    );
});

const ChatScreen = () => {
    const { user } = useUser();
    const params = useLocalSearchParams();
    const otherUserId = params.otherUserId as string;
    const otherUserName = params.otherUserName as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [showEnforcerModal, setShowEnforcerModal] = useState(false);
    const [enforcerDetails, setEnforcerDetails] = useState<any>(null);
    const [loadingEnforcerDetails, setLoadingEnforcerDetails] = useState(false);
    const [messageError, setMessageError] = useState('');
    const MAX_MESSAGE_LENGTH = 10000; // Safe limit for TEXT column (65,535 bytes)
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let typingCheckInterval: ReturnType<typeof setInterval> | null = null;

    const fetchMessages = async () => {
        if (!user || !user.id || !otherUserId) return;

        try {
            const response = await messageService.getMessages(parseInt(user.id), parseInt(otherUserId));

            if (response.success) {
                setMessages(response.data);
                // Mark conversation as read
                await messageService.markConversationAsRead(parseInt(user.id), parseInt(otherUserId));
            } else {
                console.error('Failed to fetch messages:', response);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            // Don't alert on background fetch errors, just log
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch immediately
        fetchMessages();

        // Poll for new messages every 2 seconds for better real-time feel
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing messages from', otherUserName);
            fetchMessages();
        }, 2000);

        // Check typing status every 800ms
        typingCheckInterval = setInterval(() => {
            checkTypingStatus();
        }, 800);

        return () => {
            clearInterval(interval);
            if (typingCheckInterval) clearInterval(typingCheckInterval);
        };
    }, [user, otherUserId]);

    const sendMessage = async () => {
        if (newMessage.trim() === '' || !user || !user.id) {
            console.log('❌ Cannot send message - validation failed:', {
                messageEmpty: newMessage.trim() === '',
                userExists: !!user,
                userId: user?.id
            });
            return;
        }

        // Validate message length
        if (newMessage.trim().length > MAX_MESSAGE_LENGTH) {
            Alert.alert(
                'Message Too Long',
                `Your message is too long (${newMessage.trim().length} characters). Maximum allowed is ${MAX_MESSAGE_LENGTH} characters.`,
                [{ text: 'OK' }]
            );
            return;
        }

        setSending(true);
        setMessageError('');

        try {
            console.log('📨 Attempting to send message:', {
                senderId: user.id,
                receiverId: otherUserId,
                messageLength: newMessage.trim().length
            });

            const response = await messageService.sendMessage(
                parseInt(user.id),
                parseInt(otherUserId),
                newMessage.trim()
            );

            console.log('📨 Send message response:', response);

            if (response.success) {
                console.log('✅ Message sent, clearing input and refreshing...');
                setNewMessage('');
                setMessageError('');
                // Refresh messages
                await fetchMessages();
            } else {
                console.error('❌ Message send failed:', response);
                Alert.alert(
                    'Failed to Send',
                    'Could not send your message. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            Alert.alert(
                'Network Error',
                'Could not send your message. Please check your connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setSending(false);
        }
    };



    const sendTypingStatus = async (isTyping: boolean) => {
        if (!user || !user.id || !otherUserId) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender_id: user.id,
                    receiver_id: parseInt(otherUserId),
                    is_typing: isTyping
                })
            });
        } catch (error) {
            // Silent fail
        }
    };

    const checkTypingStatus = async () => {
        if (!user || !user.id || !otherUserId) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/typing-status/${otherUserId}/${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                console.error('Failed to check typing status:', response.status);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setIsOtherUserTyping(data.is_typing);
            }
        } catch (error) {
            // Silent fail
        }
    };

    const fetchEnforcerDetails = async () => {
        if (!otherUserId) {
            console.log('❌ No otherUserId available');
            return;
        }

        console.log('🔍 Fetching enforcer details for userId:', otherUserId);
        setLoadingEnforcerDetails(true);
        try {
            const details = await userService.getUserWithStation(otherUserId);
            console.log('✅ Enforcer details received:', details);
            setEnforcerDetails(details);
            setShowEnforcerModal(true);
            console.log('✅ Modal should now be visible');
        } catch (error) {
            console.error('❌ Error fetching enforcer details:', error);
            Alert.alert('Error', 'Unable to load officer details. Please try again.');
        } finally {
            setLoadingEnforcerDetails(false);
        }
    };

    const renderMessage = React.useCallback(({ item }: { item: Message }) => (
        <ChatMessage item={item} userId={user?.id} />
    ), [user?.id]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1D3557" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.container}>
                {/* Header with Back Button and Title */}
                <View style={styles.headerHistory}>
                    <TouchableOpacity onPress={() => router.push('/chatlist')}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.textTitle}>
                            <Text style={styles.alertWelcome}>Alert</Text>
                            <Text style={styles.davao}>Davao</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={fetchEnforcerDetails}
                            disabled={loadingEnforcerDetails}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                            <Text style={[styles.subheadingCenter, { color: '#1D3557', textDecorationLine: 'underline' }]}>
                                {otherUserName || 'Chat'}
                            </Text>
                            <Ionicons name="information-circle" size={20} color="#1D3557" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                {/* Chat Messages */}
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.message_id.toString()}
                    renderItem={renderMessage}
                    style={styles.chatArea}
                    contentContainerStyle={{ paddingBottom: 10, flexGrow: 1, justifyContent: 'flex-end' }}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                    inverted={true}
                />

                {/* Typing Indicator */}
                {isOtherUserTyping && (
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#999',
                                opacity: 0.3
                            }} />
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#999',
                                opacity: 0.6
                            }} />
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#999'
                            }} />
                            <Text style={{ fontSize: 12, color: '#999', marginLeft: 4, fontStyle: 'italic' }}>typing...</Text>
                        </View>
                    </View>
                )}

                {/* Input Area */}
                <View>
                    {newMessage.length > MAX_MESSAGE_LENGTH * 0.8 && (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Text style={{
                                fontSize: 12,
                                color: newMessage.length > MAX_MESSAGE_LENGTH ? '#ef4444' : '#f59e0b',
                                fontWeight: '500'
                            }}>
                                {newMessage.length > MAX_MESSAGE_LENGTH
                                    ? `⚠️ Message too long! (${newMessage.length - MAX_MESSAGE_LENGTH} over limit)`
                                    : `${MAX_MESSAGE_LENGTH - newMessage.length} characters remaining`}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.inputContainer, { marginBottom: Platform.OS === 'android' ? 80 : 10 }]}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Write a message"
                            value={newMessage}
                            onChangeText={(text) => {
                                setNewMessage(text);
                                if (text.length <= MAX_MESSAGE_LENGTH) {
                                    setMessageError('');
                                }
                                // Send typing status
                                sendTypingStatus(true);

                                // Clear previous timeout
                                if (typingTimeout) clearTimeout(typingTimeout);

                                // Set timeout to clear typing status after 3 seconds
                                typingTimeout = setTimeout(() => {
                                    sendTypingStatus(false);
                                }, 3000);
                            }}
                            multiline
                            editable={!sending}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, sending && { opacity: 0.5 }]}
                            onPress={sendMessage}
                            disabled={sending || newMessage.trim() === ''}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Enforcer Details Modal */}
                <Modal
                    visible={showEnforcerModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowEnforcerModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.enforcerModalContainer}>
                            {loadingEnforcerDetails ? (
                                <View style={styles.enforcerLoadingContainer}>
                                    <ActivityIndicator size="large" color="#1D3557" />
                                    <Text style={styles.enforcerLoadingText}>Loading details...</Text>
                                </View>
                            ) : enforcerDetails ? (
                                <View style={styles.enforcerModalContent}>
                                    {/* Header */}
                                    <View style={styles.enforcerModalHeader}>
                                        <View style={styles.enforcerHeaderTitleContainer}>
                                            <Ionicons name="person-circle" size={28} color="#1D3557" />
                                            <Text style={styles.enforcerModalTitle}>Officer Profile</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setShowEnforcerModal(false)}
                                            style={styles.enforcerCloseButton}
                                        >
                                            <Ionicons name="close" size={26} color="#1D3557" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Divider */}
                                    <View style={styles.enforcerDivider} />

                                    {/* Content */}
                                    <View style={styles.enforcerDetailsContent}>
                                        {/* Name Section */}
                                        <View style={styles.enforcerDetailSection}>
                                            <View style={styles.enforcerIconLabelContainer}>
                                                <Ionicons name="person" size={20} color="#1D3557" />
                                                <Text style={styles.enforcerDetailLabel}>Full Name</Text>
                                            </View>
                                            <Text style={styles.enforcerDetailValue}>
                                                {enforcerDetails.firstname} {enforcerDetails.lastname}
                                            </Text>
                                        </View>

                                        {/* Contact Section */}
                                        <View style={styles.enforcerDetailSection}>
                                            <View style={styles.enforcerIconLabelContainer}>
                                                <Ionicons name="call" size={20} color="#1D3557" />
                                                <Text style={styles.enforcerDetailLabel}>Contact Number</Text>
                                            </View>
                                            <Text style={styles.enforcerDetailValue}>
                                                {enforcerDetails.contact !== 'N/A' ? enforcerDetails.contact : 'Not provided'}
                                            </Text>
                                        </View>

                                        {/* Station Section */}
                                        <View style={styles.enforcerDetailSection}>
                                            <View style={styles.enforcerIconLabelContainer}>
                                                <Ionicons name="location" size={20} color="#1D3557" />
                                                <Text style={styles.enforcerDetailLabel}>Assigned Station</Text>
                                            </View>
                                            <Text style={styles.enforcerDetailValue}>
                                                {enforcerDetails.stationName}
                                            </Text>
                                        </View>

                                        {/* Station Address Section */}
                                        <View style={[styles.enforcerDetailSection, styles.enforcerLastSection]}>
                                            <View style={styles.enforcerIconLabelContainer}>
                                                <Ionicons name="map" size={20} color="#1D3557" />
                                                <Text style={styles.enforcerDetailLabel}>Station Address</Text>
                                            </View>
                                            <Text style={[styles.enforcerDetailValue, { lineHeight: 22 }]}>
                                                {enforcerDetails.stationAddress}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Close Button */}
                                    <TouchableOpacity
                                        style={styles.enforcerCloseActionButton}
                                        onPress={() => setShowEnforcerModal(false)}
                                    >
                                        <Text style={styles.enforcerCloseActionButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.enforcerErrorContainer}>
                                    <Ionicons name="alert-circle" size={48} color="#E63946" />
                                    <Text style={styles.enforcerErrorText}>Unable to load officer details</Text>
                                    <TouchableOpacity
                                        style={styles.enforcerCloseActionButton}
                                        onPress={() => setShowEnforcerModal(false)}
                                    >
                                        <Text style={styles.enforcerCloseActionButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatScreen;