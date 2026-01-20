import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Button, TouchableOpacity, Platform, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import styles from "./styles"; // import your global styles
import Checkbox from 'expo-checkbox';
import UpdateSuccessDialog from '../../components/UpdateSuccessDialog';

const Guidelines = () => {
    // 📊 Performance Timing
    const pageStartTime = useRef(Date.now());
    React.useEffect(() => {
        const loadTime = Date.now() - pageStartTime.current;
        console.log(`📊 [Guidelines] Page Load Time: ${loadTime}ms`);
    }, []);

    const scrollViewRef = useRef<ScrollView>(null);
    const crimeTypesSectionRef = useRef<View>(null);
    const { scrollToSection } = useLocalSearchParams<{ scrollToSection?: string }>();

    const [isChecked, setChecked] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Helper function to scroll to element on web
    const scrollToElementWeb = () => {
        try {
            console.log('🌐 Attempting web scroll...');
            const crimeTypesElement = Array.from(document.querySelectorAll('*')).find(el => {
                const text = el.textContent || '';
                return text.includes('3. Reporting Categories') && !text.includes('Prohibited Submissions');
            });

            if (crimeTypesElement) {
                console.log('✅ Found crime types element on web');
                let scrollContainer = crimeTypesElement.closest('[class*="ScrollView"]');
                if (!scrollContainer) {
                    let parent = crimeTypesElement.parentElement;
                    while (parent && parent !== document.body) {
                        const style = window.getComputedStyle(parent);
                        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                            scrollContainer = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }

                if (scrollContainer) {
                    const offset = crimeTypesElement.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop;
                    scrollContainer.scrollTo({ top: offset, behavior: 'smooth' });
                } else {
                    crimeTypesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return true;
            }
            return false;
        } catch (error) {
            console.warn('❌ Error in web scroll:', error);
            return false;
        }
    };

    // Helper function to scroll to element on native
    const scrollToElementNative = () => {
        try {
            console.log('📱 Attempting native scroll...');
            if (!crimeTypesSectionRef.current || !scrollViewRef.current) return false;

            crimeTypesSectionRef.current?.measureLayout(
                scrollViewRef.current?.getInnerViewNode?.(),
                (x, y) => {
                    const offset = y - 20;
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, offset), animated: true });
                },
                (error) => console.warn('⚠️ Failed to measure:', error)
            );
            return true;
        } catch (error) {
            console.warn('❌ Error in native scroll:', error);
            return false;
        }
    };

    // Effect for scroll
    useEffect(() => {
        if (scrollToSection === 'crime-types') {
            setTimeout(() => {
                if (Platform.OS === 'web') scrollToElementWeb();
                else scrollToElementNative();
            }, 300);
        }
    }, [scrollToSection]);

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={[styles.headerHistory, {
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
                backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
                height: Platform.OS === 'ios' ? 100 : 80, paddingTop: Platform.OS === 'ios' ? 40 : 20
            }]}>
                <TouchableOpacity onPress={() => router.push('/')} style={{ position: 'absolute', left: 20, bottom: 15, padding: 5 }}>
                    <Ionicons name="chevron-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 15 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>Community Guidelines</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Safety & Privacy Standards</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, marginTop: Platform.OS === 'ios' ? 100 : 80 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro Card */}
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>Responsible Reporting</Text>
                    </View>
                    <Text style={{ fontSize: 14, lineHeight: 22, color: '#475569' }}>
                        AlertDavao is designed to facilitate timely incident reporting. Your contributions help keep our community safe. Please report responsibly.
                    </Text>
                </View>

                {/* Acceptable Use */}
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 }}>1. What to Report</Text>
                    {[
                        { icon: 'alert-circle', color: '#f59e0b', text: 'Physical crimes or suspicious activities' },
                        { icon: 'medical', color: '#ef4444', text: 'Emergency or public safety concerns' },
                        { icon: 'people', color: '#8b5cf6', text: 'Community disturbances (theft, vandalism)' }
                    ].map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} style={{ marginRight: 12 }} />
                            <Text style={{ fontSize: 14, color: '#334155', flex: 1 }}>{item.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Prohibited Content */}
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ef4444', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 }}>2. Prohibited Submissions</Text>
                    <Text style={{ fontSize: 14, lineHeight: 22, color: '#475569', marginBottom: 12 }}>
                        Do NOT upload content involving minors, lewd material, or unauthorized private recordings.
                    </Text>
                    <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 13, color: '#b91c1c', fontWeight: '500' }}>
                            <Ionicons name="warning" size={14} color="#b91c1c" /> Violation may result in account suspension and legal action.
                        </Text>
                    </View>
                </View>

                {/* Privacy Policy Teaser (Item 9) */}
                <TouchableOpacity onPress={() => setShowPrivacyModal(true)} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>Data Privacy</Text>
                        <Text style={{ fontSize: 13, color: '#64748b' }}>Read how we protect your personal information.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Crime Types Section */}
                <View ref={crimeTypesSectionRef} collapsable={false} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 }}>3. Reporting Categories</Text>
                    {[
                        { title: 'Theft', desc: 'Unauthorized taking of property without force.' },
                        { title: 'Robbery', desc: 'Taking property with force or intimidation.' },
                        { title: 'Physical Injury', desc: 'Harm inflicted on an individual.' },
                        { title: 'Cybercrime', desc: 'Online scams, hacking, or harassment.' },
                        { title: 'Domestic Violence', desc: 'Abuse within a household.' },
                        { title: 'Missing Person', desc: 'Individual whose location is unknown.' },
                    ].map((crime, index) => (
                        <View key={index} style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>{crime.title}</Text>
                            <Text style={{ fontSize: 13, color: '#64748b' }}>{crime.desc}</Text>
                        </View>
                    ))}
                    <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>+ and other categories listed in report form.</Text>
                </View>

                {/* Checkbox */}
                <Pressable onPress={() => setChecked(!isChecked)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 10 }}>
                    <Checkbox value={isChecked} onValueChange={setChecked} color={isChecked ? "#3b82f6" : undefined} style={{ borderRadius: 6 }} />
                    <Text style={{ marginLeft: 12, fontSize: 14, color: '#334155', fontWeight: '500' }}>I have read and agree to these Guidelines</Text>
                </Pressable>

                {/* Button */}
                <TouchableOpacity
                    onPress={() => setShowSuccessDialog(true)}
                    disabled={!isChecked}
                    style={{
                        backgroundColor: isChecked ? "#3b82f6" : "#94a3b8",
                        paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                        shadowColor: isChecked ? "#3b82f6" : "transparent", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Accept & Continue</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Privacy Policy Modal (Item 9) */}
            <Modal visible={showPrivacyModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={{ padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>Privacy Policy</Text>
                        <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
                            <Ionicons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 20 }}>
                            This Privacy Policy explains how AlertDavao collects, uses, and protects your personal information in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).
                        </Text>

                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 }}>1. Data Collection</Text>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 20 }}>
                            We collect personal data (Name, Contact, Location) strictly for legitimate law enforcement and emergency response purposes.
                        </Text>

                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 }}>2. Data Usage</Text>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 20 }}>
                            Your data is used to verify reports, coordinate police response, and maintain community safety records. It is never sold to third parties.
                        </Text>

                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 }}>3. Security Measures</Text>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 20 }}>
                            All data transmission is encrypted. Access to sensitive information is restricted to authorized personnel only.
                        </Text>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Success Dialog */}
            <UpdateSuccessDialog
                visible={showSuccessDialog}
                title="Guidelines Accepted"
                message="Thank you for your commitment to keeping Davao City safe."
                okText="Go to Dashboard"
                onOk={() => {
                    setShowSuccessDialog(false);
                    router.push('/');
                }}
            />
        </View>
    );
};

export default Guidelines;
