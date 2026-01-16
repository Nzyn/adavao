import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Button, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import styles from "./styles"; // import your global styles
import Checkbox from 'expo-checkbox';
import UpdateSuccessDialog from '../../components/UpdateSuccessDialog';

const Guidelines = () => {
    // 📊 Performance Timing - Start
    const pageStartTime = useRef(Date.now());
    React.useEffect(() => {
        const loadTime = Date.now() - pageStartTime.current;
        console.log(`📊 [Guidelines] Page Load Time: ${loadTime}ms`);
    }, []);
    // 📊 Performance Timing - End

    const scrollViewRef = useRef<ScrollView>(null);
    const crimeTypesSectionRef = useRef<View>(null);
    const { scrollToSection } = useLocalSearchParams<{ scrollToSection?: string }>();

    const handlePress = () => {
        console.log("Agreed to Guidelines pressed!");
    };
    const [isChecked, setChecked] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Helper function to scroll to element on web
    const scrollToElementWeb = () => {
        try {
            console.log('🌐 Attempting web scroll...');

            // Get the actual DOM element
            const crimeTypesElement = Array.from(document.querySelectorAll('*')).find(el => {
                const text = el.textContent || '';
                return text.includes('6. Crime Types for Reporting') &&
                    !text.includes('Prohibited Submissions'); // Make sure it's the right section
            });

            if (crimeTypesElement) {
                console.log('✅ Found crime types element on web');

                // Find the scrollable container (ScrollView on web renders as a div)
                let scrollContainer = crimeTypesElement.closest('[class*="ScrollView"]');
                if (!scrollContainer) {
                    // Fallback: find any scrollable parent
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
                    console.log('📜 Found scroll container, scrolling to element');
                    const offset = crimeTypesElement.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop;
                    scrollContainer.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                } else {
                    console.log('📍 Using scrollIntoView fallback');
                    crimeTypesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return true;
            } else {
                console.warn('⚠️ Crime types element not found');
                return false;
            }
        } catch (error) {
            console.warn('❌ Error in web scroll:', error);
            return false;
        }
    };

    // Helper function to scroll to element on native
    const scrollToElementNative = () => {
        try {
            console.log('📱 Attempting native scroll...');

            if (!crimeTypesSectionRef.current || !scrollViewRef.current) {
                console.warn('❌ Refs not available');
                return false;
            }

            crimeTypesSectionRef.current?.measureLayout(
                scrollViewRef.current?.getInnerViewNode?.(),
                (x, y) => {
                    console.log('📍 Measured Y position:', y);
                    const offset = y - 20; // Small offset for better UX
                    scrollViewRef.current?.scrollTo({
                        y: Math.max(0, offset),
                        animated: true
                    });
                },
                (error) => {
                    console.warn('⚠️ Failed to measure crime types section:', error);
                    return false;
                }
            );
            return true;
        } catch (error) {
            console.warn('❌ Error in native scroll:', error);
            return false;
        }
    };

    // Scroll to Section 6 when the parameter is detected
    useEffect(() => {
        if (scrollToSection === 'crime-types') {
            console.log('🎯 Scroll parameter detected:', scrollToSection);
            console.log('📱 Platform:', Platform.OS);

            setTimeout(() => {
                if (Platform.OS === 'web') {
                    scrollToElementWeb();
                } else {
                    // Native: iOS, Android
                    scrollToElementNative();
                }
            }, 300);
        }
    }, [scrollToSection]);
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Fixed Header with Back Button and Title */}
            <View style={[styles.headerHistory, {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: '#fff',
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb'
            }]}>
                <TouchableOpacity onPress={() => router.push('/')}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.textTitle}>
                        <Text style={styles.alertWelcome}>Alert</Text>
                        <Text style={styles.davao}>Davao</Text>
                    </Text>
                    <Text style={styles.subheadingCenter}>Guidelines</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {/* Scrollable Content */}
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, marginTop: 80 }}
                contentContainerStyle={{ paddingBottom: 50 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                bounces={true}
            >
                <View>

                    {/* Welcome */}
                    <Text style={styles.normalTxtJustify}>User Guidelines for Incident Reporting
                        This mobile application is provided to facilitate the timely reporting of incidents and promote community safety.
                        Users are expected to submit reports responsibly and in accordance with the guidelines outlined below.</Text>

                    <Text>1. Acceptable Use of the Application The application is intended for reporting the following types of incidents:</Text>
                    <Text style={styles.normalTxtJustify}>
                        Physical crimes or suspicious activities
                        Emergency or urgent public safety concerns
                        Community disturbances (e.g., theft, vandalism)
                        Safety-related issues requiring police presence</Text>

                    <Text style={styles.normalTxtJustify}>Users are encouraged to provide clear, factual, and accurate information to assist authorities in responding appropriately.</Text>

                    <Text>Users are encouraged to provide clear, factual, and accurate information to assist authorities in responding appropriately.</Text>
                    <Text style={styles.normalTxt}>
                        Scandal-related or sensitive matters (e.g., private or explicit content, defamatory materials, cases involving minors) {'\n'}

                        These reports require confidential handling and official documentation, which must be conducted in person at the nearest police station or designated cybercrime unit.
                    </Text>

                    <Text>3. Prohibited Submissions </Text>
                    <Text style={styles.normalTxtJustify}>The following types of content must not be uploaded to the app as proof of an incident:</Text>
                    <Text style={styles.normalTxt}>
                        • Leaked or unauthorized recordings {'\n'}
                        • Content involving minors or individuals whose identity must be protected {'\n'}
                        • Uploading such materials through the app may violate data privacy and legal standards. {'\n'}
                    </Text>

                    <Text>4. Commitment to Data Privacy</Text>
                    <Text style={styles.normalTxtJustify}>All reports and user data submitted through this platform are handled with the highest standard of confidentiality and care. The system complies with Republic Act No. 10173, also known as the Data Privacy Act of 2012, ensuring the protection of personal data against unauthorized access, disclosure, and misuse. {'\n'}
                        Users can be assured that: {'\n'}
                        • Personal information is used only for legitimate law enforcement purposes. {'\n'}
                        • Reports are transmitted securely and encrypted. {'\n'}
                        • No sensitive content is stored without user consent or outside legal protocols {'\n'}
                    </Text>

                    <Text>5. Legal Notice on Misuse</Text>
                    <Text style={styles.normalTxtJustify}>Misuse of this application—including false reporting, uploading prohibited content, or malicious intent—may result in legal consequences, including criminal liability under existing Philippine laws. {'\n'}</Text>

                    <View ref={crimeTypesSectionRef} collapsable={false}>
                        <Text>6. Crime Types for Reporting</Text>
                        <Text style={styles.normalTxtJustify}>The following categories are accepted for incident reporting through this application. Please select the most appropriate category when submitting your report. {'\n'}</Text>

                        <Text style={styles.normalTxt}>
                            <Text style={{ fontWeight: 'bold' }}>1. Theft {'\n'}</Text>
                            <Text>Definition: Unauthorized taking of personal property without the use of force or intimidation. {'\n'}
                                Example: Stealing a mobile phone from a table or unattended bag. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>2. Robbery {'\n'}</Text>
                            <Text>Definition: Taking property from a person through the use of force, intimidation, or threats. {'\n'}
                                Example: A person forcibly grabbing your bag while threatening you. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>3. Burglary {'\n'}</Text>
                            <Text>Definition: Unlawful entry into a building or property with the intent to commit a crime. {'\n'}
                                Example: Entering a closed shop at night to steal items. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>4. Break-in {'\n'}</Text>
                            <Text>Definition: Forcibly entering a property without permission, regardless of intent to steal. {'\n'}
                                Example: Breaking a door or window to enter someone's home. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>5. Carnapping {'\n'}</Text>
                            <Text>Definition: Taking or stealing a motor vehicle without the owner's consent. {'\n'}
                                Example: A parked motorcycle taken from a parking area. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>6. Fraud {'\n'}</Text>
                            <Text>Definition: Obtaining money, property, or advantage through deception or misrepresentation. {'\n'}
                                Example: Paying for an online item that never arrives because the seller was fake. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>7. Cybercrime {'\n'}</Text>
                            <Text>Definition: Crimes committed through computers, digital devices, or the internet. {'\n'}
                                Example: Hacking, online scams, phishing, or unauthorized access to accounts. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>8. Physical Injury {'\n'}</Text>
                            <Text>Definition: Inflicting bodily harm on another individual. {'\n'}
                                Example: Punching someone, resulting in bruises or wounds. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>9. Homicide {'\n'}</Text>
                            <Text>Definition: Causing the death of another person, whether intentional or unintentional. {'\n'}
                                Example: Killing someone during a violent altercation. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>10. Threats {'\n'}</Text>
                            <Text>Definition: Expressing intent to inflict harm, violence, or damage to a person or property. {'\n'}
                                Example: Sending a message saying, "I will hurt you" or similar statements. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>11. Domestic Violence {'\n'}</Text>
                            <Text>Definition: Physical, emotional, or psychological abuse within a household or intimate relationship. {'\n'}
                                Example: A partner or family member causing harm or intimidation at home. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>12. Harassment {'\n'}</Text>
                            <Text>Definition: Repeated unwanted behavior that causes fear, distress, or emotional discomfort. {'\n'}
                                Example: Persistent unwanted messages or being followed by someone. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>13. Sexual Assault {'\n'}</Text>
                            <Text>Definition: Any non-consensual sexual act, contact, or behavior. {'\n'}
                                Example: Unwanted touching or forcing someone into sexual activity. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>14. Missing Person {'\n'}</Text>
                            <Text>Definition: An individual whose location is unknown and who cannot be contacted. {'\n'}
                                Example: A family member not returning home and unreachable by phone. {'\n\n'}</Text>

                            <Text style={{ fontWeight: 'bold' }}>15. Others {'\n'}</Text>
                            <Text>Definition: Any incident or crime not covered by the listed categories. {'\n'}
                                Example: Reporting specialized or unique situations that do not fall under standard crime types. {'\n'}</Text>
                        </Text>
                    </View>

                    {/* Checkbox + Agree */}
                    <View style={styles.checkboxRow}>
                        <Checkbox value={isChecked} onValueChange={setChecked} color={isChecked ? "#1D3557" : undefined} />
                        <Text style={styles.termsCheckboxText}>I have read and agreed to the Guidelines</Text>
                    </View>

                    {/* Button (disabled until checked) */}
                    <Button
                        title="I Understand"
                        onPress={() => {
                            setShowSuccessDialog(true);
                        }}
                        disabled={!isChecked}
                        color="#1D3557"
                    />
                    <Text>{'\n'}</Text>
                </View>

                {/* Success Dialog */}
                <UpdateSuccessDialog
                    visible={showSuccessDialog}
                    title="Guidelines Accepted!"
                    message="You have successfully accepted the guidelines. Thank you for helping us maintain a safe community."
                    okText="OK"
                    onOk={() => {
                        setShowSuccessDialog(false);
                        router.push('/');
                    }}
                />
            </ScrollView>
        </View>

    );
};

export default Guidelines;
