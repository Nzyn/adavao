import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from './styles';
import { useUser } from '../../contexts/UserContext';

interface FAQItem {
    id: number;
    question: string;
    answer: string;
}

interface Message {
    id: string;
    type: 'question' | 'answer';
    content: string;
    timestamp: string;
    isTyping?: boolean;
    displayedText?: string;
}

const FAQScreen = () => {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [faqList, setFaqList] = useState<FAQItem[]>([]);
    const [showQuestionBubbles, setShowQuestionBubbles] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState<number | null>(null);
    const [displayedAnswer, setDisplayedAnswer] = useState('');
    const [isTypingAnswer, setIsTypingAnswer] = useState(false);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadFAQ();
        const welcomeMessage: Message = {
            id: 'welcome-' + Date.now(),
            type: 'answer',
            content: 'Welcome to FAQ! Select a question from below to get instant answers.',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        };
        setMessages([welcomeMessage]);
    }, []);

    const loadFAQ = () => {
        try {
            const faqData = require('../../assets/faq.json');
            setFaqList(faqData.faq);
        } catch (error) {
            console.error('Error loading FAQ:', error);
        }
    };

    const typeAnswer = async (answer: string, questionId: number) => {
        setDisplayedAnswer('');
        setIsTypingAnswer(true);
        const words = answer.split(' ');
        let currentText = '';

        for (let i = 0; i < words.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 60));
            currentText += (i === 0 ? '' : ' ') + words[i];
            setDisplayedAnswer(currentText);
        }

        setIsTypingAnswer(false);

        // Add the complete answer to messages after typing is done
         setMessages(prev => [...prev, {
             id: 'a-' + questionId,
             type: 'answer',
             content: answer,
             timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
         }]);

         // Scroll to end on web and mobile
         setTimeout(() => {
             flatListRef.current?.scrollToEnd({ animated: true });
         }, 100);
        };

    const handleSelectQuestion = async (question: FAQItem) => {
        setSending(true);
        setShowQuestionBubbles(false);

        const questionMessage: Message = {
            id: 'q-' + question.id,
            type: 'question',
            content: question.question,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        };

        setMessages(prev => [...prev, questionMessage]);
        setCurrentQuestion(question.id);

        setTimeout(async () => {
            await typeAnswer(question.answer, question.id);
            setSending(false);
        }, 500);
    };

    const handleAskAnotherQuestion = () => {
        setShowQuestionBubbles(true);
        setDisplayedAnswer('');
        setCurrentQuestion(null);
        setIsTypingAnswer(false);
    };

    const scrollToQuestion = (direction: 'prev' | 'next') => {
        if (!currentQuestion) return;
        let nextIndex = faqList.findIndex(item => item.id === currentQuestion);

        if (direction === 'next') {
            nextIndex = (nextIndex + 1) % faqList.length;
        } else {
            nextIndex = (nextIndex - 1 + faqList.length) % faqList.length;
        }

        handleSelectQuestion(faqList[nextIndex]);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isAnswer = item.type === 'answer';

        return (
            <View
                style={{
                    padding: 12,
                    borderRadius: 12,
                    marginVertical: 4,
                    maxWidth: '75%',
                    ...(isAnswer
                        ? {
                            backgroundColor: '#f0f0f0',
                            alignSelf: 'flex-start' as const,
                            marginRight: '25%',
                        }
                        : {
                            backgroundColor: '#1D3557',
                            alignSelf: 'flex-end' as const,
                            marginLeft: '25%',
                        }),
                }}
            >
                {item.type === 'question' ? (
                    <View>
                        <Text style={{ fontSize: 14, color: '#fff' }}>
                            {item.content}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#e0e0e0', marginTop: 5 }}>
                            {item.timestamp}
                        </Text>
                    </View>
                ) : (
                    <View>
                        <Text style={{ fontSize: 14, color: '#333' }}>
                            {item.content}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#888', marginTop: 5 }}>
                            {item.timestamp}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderAnswerWithTyping = () => {
        // Only show typing animation while actively typing
        if (!currentQuestion || !isTypingAnswer) return null;

        return (
            <View
                style={{
                    padding: 12,
                    borderRadius: 12,
                    marginVertical: 4,
                    maxWidth: '75%',
                    backgroundColor: '#f0f0f0',
                    alignSelf: 'flex-start' as const,
                    marginRight: '25%',
                }}
            >
                <Text style={{ fontSize: 14, color: '#333' }}>
                    {displayedAnswer}
                    <Text style={{ color: '#999' }}>▎</Text>
                </Text>
                <Text style={{ fontSize: 10, color: '#888', marginTop: 5 }}>
                    {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#fff' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                {/* Header */}
                <View style={styles.headerHistory}>
                    <TouchableOpacity onPress={() => router.push('/chatlist')}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.textTitle}>
                            <Text style={styles.alertWelcome}>Alert</Text>
                            <Text style={styles.davao}>Davao</Text>
                        </Text>
                        <Text style={styles.subheadingCenter}>FAQs</Text>
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                {/* Chat Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    style={styles.chatArea}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 50 }}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    ListFooterComponent={renderAnswerWithTyping}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    onEndReachedThreshold={0.1}
                    removeClippedSubviews={false}
                />

                {/* Question Bubbles */}
                {showQuestionBubbles && !sending && (
                    <View
                        style={{
                            paddingVertical: 12,
                            backgroundColor: '#F5F5F5',
                            borderTopWidth: 1,
                            borderTopColor: '#E0E0E0',
                        }}
                    >
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 12 }}
                        >
                            {faqList.map((faq) => (
                                <TouchableOpacity
                                    key={faq.id}
                                    onPress={() => handleSelectQuestion(faq)}
                                    style={{
                                        backgroundColor: '#1D3557',
                                        borderRadius: 16,
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                        minHeight: 50,
                                        justifyContent: 'center',
                                        marginRight: 8,
                                        maxWidth: 200,
                                    }}
                                >
                                    <Text
                                        numberOfLines={3}
                                        style={{
                                            color: '#fff',
                                            fontSize: 13,
                                            fontWeight: '500',
                                            lineHeight: 18,
                                        }}
                                    >
                                        {faq.question}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Answer Navigation & Ask Another */}
                {!showQuestionBubbles && currentQuestion && !sending && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            backgroundColor: '#F5F5F5',
                            borderTopWidth: 1,
                            borderTopColor: '#E0E0E0',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => scrollToQuestion('prev')}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: '#fff',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: '#1D3557',
                                marginHorizontal: 5,
                            }}
                        >
                            <Ionicons name="chevron-back" size={20} color="#1D3557" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleAskAnotherQuestion}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                backgroundColor: '#1D3557',
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 22,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginHorizontal: 5,
                            }}
                        >
                            <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text
                                style={{
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: '600',
                                }}
                            >
                                Ask Another
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => scrollToQuestion('next')}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: '#fff',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: '#1D3557',
                                marginHorizontal: 5,
                            }}
                        >
                            <Ionicons name="chevron-forward" size={20} color="#1D3557" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

export default FAQScreen;
