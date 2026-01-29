import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Pressable, Modal, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Checkbox from 'expo-checkbox';
import UpdateSuccessDialog from '../../components/UpdateSuccessDialog';
import { spacing, fontSize, containerPadding, borderRadius } from '../../utils/responsive';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
    primary: '#1D3557',
    accent: '#E63946',
    white: '#ffffff',
    background: '#f5f7fa',
    cardBg: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
};

// Accordion Component
const AccordionItem = ({ 
    title, 
    children, 
    icon, 
    iconColor = COLORS.primary,
    isWarning = false,
    defaultExpanded = false 
}: { 
    title: string; 
    children: React.ReactNode; 
    icon?: string; 
    iconColor?: string;
    isWarning?: boolean;
    defaultExpanded?: boolean;
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: 12,
            marginBottom: 12,
            overflow: 'hidden',
            borderLeftWidth: isWarning ? 4 : 0,
            borderLeftColor: COLORS.danger,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        }}>
            <TouchableOpacity 
                onPress={toggleExpand}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: expanded ? '#f8fafc' : COLORS.cardBg,
                }}
            >
                {icon && (
                    <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isWarning ? '#fef2f2' : '#eff6ff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}>
                        <Ionicons name={icon as any} size={20} color={iconColor} />
                    </View>
                )}
                <Text style={{ 
                    flex: 1, 
                    fontSize: 15, 
                    fontWeight: '600', 
                    color: COLORS.textPrimary 
                }}>
                    {title}
                </Text>
                <Ionicons 
                    name={expanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={COLORS.textMuted} 
                />
            </TouchableOpacity>
            {expanded && (
                <View style={{ padding: 16, paddingTop: 0 }}>
                    {children}
                </View>
            )}
        </View>
    );
};

// Crime Type Accordion
const CrimeTypeAccordion = ({ 
    title, 
    definition, 
    examples, 
    icon,
    iconColor 
}: { 
    title: string; 
    definition: string; 
    examples: string[];
    icon: string;
    iconColor: string;
}) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={{
            backgroundColor: '#f8fafc',
            borderRadius: 10,
            marginBottom: 10,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: expanded ? COLORS.primary : '#e2e8f0',
        }}>
            <TouchableOpacity 
                onPress={toggleExpand}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                }}
            >
                <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: iconColor + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    <Ionicons name={icon as any} size={16} color={iconColor} />
                </View>
                <Text style={{ 
                    flex: 1, 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: COLORS.textPrimary 
                }}>
                    {title}
                </Text>
                <Ionicons 
                    name={expanded ? 'chevron-up' : 'chevron-down'} 
                    size={18} 
                    color={COLORS.textMuted} 
                />
            </TouchableOpacity>
            {expanded && (
                <View style={{ 
                    padding: 14, 
                    paddingTop: 0,
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                }}>
                    <Text style={{ 
                        fontSize: 13, 
                        color: COLORS.textSecondary, 
                        lineHeight: 20,
                        marginBottom: 10,
                    }}>
                        <Text style={{ fontWeight: '600' }}>Definition: </Text>
                        {definition}
                    </Text>
                    <Text style={{ 
                        fontSize: 13, 
                        fontWeight: '600', 
                        color: COLORS.textPrimary,
                        marginBottom: 6,
                    }}>
                        Examples:
                    </Text>
                    {examples.map((example, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 8 }}>
                            <Text style={{ color: COLORS.textMuted, marginRight: 8 }}>•</Text>
                            <Text style={{ fontSize: 13, color: COLORS.textSecondary, flex: 1 }}>{example}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const Guidelines = () => {
    const pageStartTime = useRef(Date.now());
    const scrollViewRef = useRef<ScrollView>(null);
    const crimeTypesSectionRef = useRef<View>(null);
    const { scrollToSection } = useLocalSearchParams<{ scrollToSection?: string }>();

    const [isChecked, setChecked] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    useEffect(() => {
        const loadTime = Date.now() - pageStartTime.current;
        console.log(`📊 [Guidelines] Page Load Time: ${loadTime}ms`);
    }, []);

    // Crime types data with definitions
    const crimeTypes = [
        {
            title: 'Theft',
            icon: 'hand-left',
            iconColor: '#f59e0b',
            definition: 'The unlawful taking of someone else\'s property without their consent and with the intent to permanently deprive them of it. Unlike robbery, theft does not involve force or intimidation.',
            examples: [
                'Pickpocketing in public areas',
                'Shoplifting from stores',
                'Stealing unattended belongings',
                'Vehicle break-ins',
            ],
        },
        {
            title: 'Robbery',
            icon: 'skull',
            iconColor: '#ef4444',
            definition: 'The crime of taking or attempting to take property from a person by force, threat of force, or by putting the victim in fear. Robbery involves direct confrontation with the victim.',
            examples: [
                'Holdup at gunpoint or knifepoint',
                'Forcibly taking a bag or phone',
                'Carjacking',
                'Home invasion robbery',
            ],
        },
        {
            title: 'Physical Injury / Assault',
            icon: 'bandage',
            iconColor: '#dc2626',
            definition: 'The intentional act of causing physical harm to another person. This includes any unlawful touching or application of force that results in bodily injury.',
            examples: [
                'Punching, kicking, or hitting someone',
                'Causing injuries during a fight',
                'Physical attacks with weapons',
                'Injuries from road rage incidents',
            ],
        },
        {
            title: 'Cybercrime',
            icon: 'globe',
            iconColor: '#6366f1',
            definition: 'Criminal activities carried out using computers, networks, or the internet. This includes various forms of online fraud, hacking, and digital harassment.',
            examples: [
                'Online scams and phishing',
                'Hacking and unauthorized access',
                'Identity theft',
                'Cyberbullying and online harassment',
                'Online fraud and money schemes',
            ],
        },
        {
            title: 'Domestic Violence',
            icon: 'home',
            iconColor: '#8b5cf6',
            definition: 'A pattern of abusive behavior in any relationship used to gain or maintain power and control over an intimate partner or family member. Includes physical, emotional, sexual, or economic abuse.',
            examples: [
                'Physical abuse between partners',
                'Emotional or psychological abuse',
                'Child abuse within the family',
                'Elder abuse by family members',
            ],
        },
        {
            title: 'Missing Person',
            icon: 'search',
            iconColor: '#0ea5e9',
            definition: 'A person whose whereabouts are unknown and who may be at risk. This includes voluntary disappearances, runaways, abductions, and lost individuals.',
            examples: [
                'Missing children or minors',
                'Elderly with dementia who wandered off',
                'Persons who failed to return home',
                'Suspected kidnapping or abduction',
            ],
        },
        {
            title: 'Drug-Related Incidents',
            icon: 'medical',
            iconColor: '#14b8a6',
            definition: 'Activities related to illegal drugs including possession, use, sale, or distribution of controlled substances.',
            examples: [
                'Drug pushing or selling',
                'Drug dens or drug use areas',
                'Possession of illegal substances',
                'Drug-influenced behavior',
            ],
        },
        {
            title: 'Vandalism / Property Damage',
            icon: 'construct',
            iconColor: '#f97316',
            definition: 'The intentional destruction, defacement, or damage of public or private property without the owner\'s consent.',
            examples: [
                'Graffiti on public property',
                'Breaking windows or fixtures',
                'Destroying street signs',
                'Damage to vehicles',
            ],
        },
        {
            title: 'Disturbance / Public Disorder',
            icon: 'megaphone',
            iconColor: '#eab308',
            definition: 'Activities that disrupt public peace and order, causing annoyance or alarm to the community.',
            examples: [
                'Loud parties or excessive noise',
                'Street brawls or fights',
                'Public intoxication',
                'Disorderly conduct',
            ],
        },
        {
            title: 'Suspicious Activity',
            icon: 'eye',
            iconColor: '#64748b',
            definition: 'Behavior or circumstances that appear unusual and may indicate potential criminal activity or security threat.',
            examples: [
                'Unfamiliar persons loitering',
                'Suspicious vehicles casing an area',
                'Unusual activity at odd hours',
                'Unattended packages or bags',
            ],
        },
        {
            title: 'Other Incidents',
            icon: 'alert-circle',
            iconColor: '#94a3b8',
            definition: 'Any other incident not covered by the categories above that requires police attention or response.',
            examples: [
                'Traffic accidents',
                'Fire or emergency situations',
                'Animal-related incidents',
                'Community concerns',
            ],
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Header */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: COLORS.white,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
                height: Platform.OS === 'ios' ? 100 : 80,
                paddingTop: Platform.OS === 'ios' ? 50 : 30,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
            }}>
                <TouchableOpacity 
                    onPress={() => router.push('/')} 
                    style={{ padding: 8, marginRight: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}>
                        Reporting Guidelines
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                        Read before submitting a report
                    </Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, marginTop: Platform.OS === 'ios' ? 100 : 80 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Important Notice Banner */}
                <View style={{
                    backgroundColor: '#fef3c7',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    borderWidth: 1,
                    borderColor: '#fcd34d',
                }}>
                    <Ionicons name="information-circle" size={24} color="#d97706" style={{ marginRight: 12, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 }}>
                            Important Notice
                        </Text>
                        <Text style={{ fontSize: 13, color: '#a16207', lineHeight: 20 }}>
                            Please read all guidelines carefully before submitting a report. False reports may result in account suspension.
                        </Text>
                    </View>
                </View>

                {/* 1. General Guidelines */}
                <AccordionItem 
                    title="1. General Reporting Guidelines" 
                    icon="document-text" 
                    iconColor={COLORS.info}
                    defaultExpanded={true}
                >
                    <View style={{ marginTop: 8 }}>
                        {[
                            { icon: 'checkmark-circle', color: COLORS.success, text: 'Provide accurate and truthful information' },
                            { icon: 'location', color: COLORS.info, text: 'Include precise location details when possible' },
                            { icon: 'time', color: COLORS.warning, text: 'Report incidents as soon as possible' },
                            { icon: 'camera', color: COLORS.primary, text: 'Attach clear photos or evidence if available' },
                            { icon: 'call', color: COLORS.success, text: 'Ensure your contact details are correct' },
                        ].map((item, index) => (
                            <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <Ionicons name={item.icon as any} size={18} color={item.color} style={{ marginRight: 12, marginTop: 2 }} />
                                <Text style={{ fontSize: 14, color: COLORS.textSecondary, flex: 1, lineHeight: 20 }}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                </AccordionItem>

                {/* 2. Prohibited Content - SENSITIVE WARNING */}
                <AccordionItem 
                    title="2. Prohibited Content (IMPORTANT)" 
                    icon="warning" 
                    iconColor={COLORS.danger}
                    isWarning={true}
                    defaultExpanded={true}
                >
                    <View style={{ marginTop: 8 }}>
                        {/* Critical Warning Box */}
                        <View style={{
                            backgroundColor: '#fef2f2',
                            borderRadius: 10,
                            padding: 14,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: '#fecaca',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#b91c1c', marginLeft: 8 }}>
                                    STRICTLY PROHIBITED
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: '#991b1b', lineHeight: 20 }}>
                                The following content is strictly prohibited and will result in immediate account suspension and potential legal action:
                            </Text>
                        </View>

                        {/* Prohibited Items */}
                        {[
                            { 
                                icon: 'close-circle', 
                                title: 'Sexual or Nude Content',
                                desc: 'Any images, videos, or descriptions containing nudity, sexual content, or pornographic material of any kind.'
                            },
                            { 
                                icon: 'close-circle', 
                                title: 'Content Involving Minors',
                                desc: 'Any inappropriate content, images, or descriptions involving children or minors in harmful situations.'
                            },
                            { 
                                icon: 'close-circle', 
                                title: 'Voyeuristic Content',
                                desc: 'Secretly recorded videos/photos in private settings, upskirt photos, or any unauthorized intimate recordings.'
                            },
                            { 
                                icon: 'close-circle', 
                                title: 'Revenge Porn / Non-consensual Intimate Images',
                                desc: 'Sharing intimate images of someone without their consent, regardless of how the images were obtained.'
                            },
                            { 
                                icon: 'close-circle', 
                                title: 'False or Malicious Reports',
                                desc: 'Intentionally filing false reports to harass, defame, or cause harm to another person.'
                            },
                            { 
                                icon: 'close-circle', 
                                title: 'Hate Speech or Discrimination',
                                desc: 'Content promoting hatred or violence against any group based on race, religion, gender, or orientation.'
                            },
                        ].map((item, index) => (
                            <View key={index} style={{ 
                                flexDirection: 'row', 
                                alignItems: 'flex-start', 
                                marginBottom: 14,
                                paddingBottom: 14,
                                borderBottomWidth: index < 5 ? 1 : 0,
                                borderBottomColor: '#fee2e2',
                            }}>
                                <Ionicons name={item.icon as any} size={18} color={COLORS.danger} style={{ marginRight: 10, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#b91c1c', marginBottom: 2 }}>{item.title}</Text>
                                    <Text style={{ fontSize: 13, color: '#991b1b', lineHeight: 18 }}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}

                        {/* Legal Warning */}
                        <View style={{
                            backgroundColor: '#1e293b',
                            borderRadius: 10,
                            padding: 14,
                            marginTop: 8,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="shield" size={18} color="#fbbf24" />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fbbf24', marginLeft: 8 }}>
                                    LEGAL CONSEQUENCES
                                </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 18 }}>
                                Violators will face immediate account suspension and may be reported to the Philippine National Police (PNP) for prosecution under RA 9995 (Anti-Photo and Video Voyeurism Act), RA 10175 (Cybercrime Prevention Act), and other applicable laws.
                            </Text>
                        </View>
                    </View>
                </AccordionItem>

                {/* 3. What to Report */}
                <AccordionItem 
                    title="3. What You Should Report" 
                    icon="checkmark-done-circle" 
                    iconColor={COLORS.success}
                >
                    <View style={{ marginTop: 8 }}>
                        {[
                            { icon: 'alert-circle', color: '#f59e0b', text: 'Crimes in progress or recently occurred' },
                            { icon: 'medical', color: '#ef4444', text: 'Emergency situations requiring immediate response' },
                            { icon: 'people', color: '#8b5cf6', text: 'Suspicious activities in your community' },
                            { icon: 'car', color: '#0ea5e9', text: 'Traffic accidents or road hazards' },
                            { icon: 'flame', color: '#f97316', text: 'Fire incidents or safety hazards' },
                            { icon: 'search', color: '#6366f1', text: 'Missing persons in your area' },
                        ].map((item, index) => (
                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: item.color + '20',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                }}>
                                    <Ionicons name={item.icon as any} size={14} color={item.color} />
                                </View>
                                <Text style={{ fontSize: 14, color: COLORS.textSecondary, flex: 1 }}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                </AccordionItem>

                {/* 4. Crime Types / Categories */}
                <AccordionItem 
                    title="4. Crime Type Definitions" 
                    icon="list" 
                    iconColor={COLORS.primary}
                    defaultExpanded={false}
                >
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16, lineHeight: 18 }}>
                            Tap on each category to see its definition and examples. This will help you select the correct crime type when filing a report.
                        </Text>
                        {crimeTypes.map((crime, index) => (
                            <CrimeTypeAccordion
                                key={index}
                                title={crime.title}
                                definition={crime.definition}
                                examples={crime.examples}
                                icon={crime.icon}
                                iconColor={crime.iconColor}
                            />
                        ))}
                    </View>
                </AccordionItem>

                {/* 5. Media Guidelines */}
                <AccordionItem 
                    title="5. Photo & Video Guidelines" 
                    icon="camera" 
                    iconColor="#8b5cf6"
                >
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 20 }}>
                            When attaching photos or videos to your report:
                        </Text>
                        {[
                            { icon: 'checkmark', color: COLORS.success, text: 'Ensure images are clear and relevant to the incident' },
                            { icon: 'checkmark', color: COLORS.success, text: 'Capture location markers or landmarks if possible' },
                            { icon: 'checkmark', color: COLORS.success, text: 'Document damage, injuries, or evidence' },
                            { icon: 'close', color: COLORS.danger, text: 'Do NOT include faces of bystanders without consent' },
                            { icon: 'close', color: COLORS.danger, text: 'Do NOT include graphic violence or gore' },
                            { icon: 'close', color: COLORS.danger, text: 'Do NOT include any sensitive or intimate content' },
                        ].map((item, index) => (
                            <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                                <Ionicons name={item.icon as any} size={16} color={item.color} style={{ marginRight: 10, marginTop: 2 }} />
                                <Text style={{ fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 18 }}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                </AccordionItem>

                {/* 6. Privacy & Data */}
                <TouchableOpacity 
                    onPress={() => setShowPrivacyModal(true)} 
                    style={{
                        backgroundColor: COLORS.cardBg,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#eff6ff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}>
                        <Ionicons name="lock-closed" size={20} color={COLORS.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textPrimary }}>
                            6. Data Privacy Policy
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                            Tap to read how we protect your information
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                {/* Agreement Checkbox */}
                <View style={{ marginTop: 20, marginBottom: 16 }}>
                    <Pressable 
                        onPress={() => setChecked(!isChecked)} 
                        style={{ 
                            flexDirection: 'row', 
                            alignItems: 'flex-start',
                            backgroundColor: isChecked ? '#eff6ff' : COLORS.cardBg,
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isChecked ? COLORS.info : COLORS.border,
                        }}
                    >
                        <Checkbox 
                            value={isChecked} 
                            onValueChange={setChecked} 
                            color={isChecked ? COLORS.info : undefined} 
                            style={{ borderRadius: 4, marginTop: 2 }} 
                        />
                        <Text style={{ 
                            marginLeft: 12, 
                            fontSize: 14, 
                            color: COLORS.textPrimary, 
                            flex: 1,
                            lineHeight: 20,
                        }}>
                            I have read and understood the reporting guidelines. I agree to submit only truthful reports and will not upload prohibited content.
                        </Text>
                    </Pressable>
                </View>

                {/* Accept Button */}
                <TouchableOpacity
                    onPress={() => setShowSuccessDialog(true)}
                    disabled={!isChecked}
                    style={{
                        backgroundColor: isChecked ? COLORS.primary : '#94a3b8',
                        paddingVertical: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        shadowColor: isChecked ? COLORS.primary : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: isChecked ? 4 : 0,
                    }}
                >
                    <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>
                        Accept & Continue
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Privacy Policy Modal */}
            <Modal visible={showPrivacyModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: COLORS.white }}>
                    <View style={{ 
                        padding: 20, 
                        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
                        borderBottomWidth: 1, 
                        borderBottomColor: COLORS.border, 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textPrimary }}>Privacy Policy</Text>
                        <TouchableOpacity 
                            onPress={() => setShowPrivacyModal(false)} 
                            style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}
                        >
                            <Ionicons name="close" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 24 }}>
                            This Privacy Policy explains how AlertDavao collects, uses, and protects your personal information in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).
                        </Text>

                        {[
                            {
                                title: '1. Data Collection',
                                content: 'We collect personal data (Name, Contact, Location) strictly for legitimate law enforcement and emergency response purposes. Location data is collected only when you submit a report.',
                            },
                            {
                                title: '2. Data Usage',
                                content: 'Your data is used to verify reports, coordinate police response, and maintain community safety records. It is never sold to third parties or used for commercial purposes.',
                            },
                            {
                                title: '3. Data Retention',
                                content: 'Personal data is retained only for as long as necessary to fulfill the purposes for which it was collected. Report data may be kept for law enforcement records as required by law.',
                            },
                            {
                                title: '4. Security Measures',
                                content: 'All data transmission is encrypted using industry-standard protocols. Access to sensitive information is restricted to authorized personnel only.',
                            },
                            {
                                title: '5. Your Rights',
                                content: 'You have the right to access, correct, or request deletion of your personal data. Contact us through the app to exercise these rights.',
                            },
                        ].map((section, index) => (
                            <View key={index} style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 }}>
                                    {section.title}
                                </Text>
                                <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 }}>
                                    {section.content}
                                </Text>
                            </View>
                        ))}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Success Dialog */}
            <UpdateSuccessDialog
                visible={showSuccessDialog}
                title="Guidelines Accepted"
                message="Thank you for reading the guidelines. You may now proceed to submit reports responsibly."
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
