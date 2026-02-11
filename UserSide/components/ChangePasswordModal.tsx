import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { BACKEND_URL, getOptimalBackendUrl } from '../config/backend';

interface ChangePasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
    const { user } = useUser();
    const [step, setStep] = useState<'password' | 'otp'>('password');
    const [loading, setLoading] = useState(false);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP State
    const [otp, setOtp] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (visible) {
            setStep('password');
            setNewPassword('');
            setConfirmPassword('');
            setOtp('');
            setLoading(false);
        }
    }, [visible]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (step === 'otp' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    const handleSendOtp = async () => {
        console.log('handleSendOtp START');
        console.log('State:', { newPassword, confirmPassword, user });

        if (!newPassword || !confirmPassword) {
            console.log('Validation failed: Empty fields');
            if (Platform.OS === 'web') window.alert('Error: Please fill in all fields');
            else Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            console.log('Validation failed: Passwords do not match');
            if (Platform.OS === 'web') window.alert('Error: Passwords do not match');
            else Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            console.log('Validation failed: Password too short');
            if (Platform.OS === 'web') window.alert('Error: Password must be at least 8 characters');
            else Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        if (!user || !user.phone) {
            console.log('Validation failed: No user phone', user);
            if (Platform.OS === 'web') window.alert('Error: No phone number linked to this account.');
            else Alert.alert('Error', 'No phone number linked to this account.');
            return;
        }

        console.log('Validation passed. Setting loading...');
        setLoading(true);
        try {
            console.log('Getting optimal backend URL...');
            const backend = await getOptimalBackendUrl();
            console.log('Backend URL:', backend);
            console.log('Sending OTP to:', user.phone);

            // Send OTP via backend
            const response = await fetch(`${backend}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: user.phone,
                    purpose: 'change_password'
                })
            });

            console.log('Fetch response status:', response.status);
            const data = await response.json();
            console.log('Response body:', data);

            if (data.success) {
                setStep('otp');
                setResendTimer(60);
                setCanResend(false);
                if (Platform.OS === 'web') window.alert(`OTP Sent: A verification code has been sent to ${user.phone}`);
                else Alert.alert('OTP Sent', `A verification code has been sent to ${user.phone}`);
            } else {
                console.log('Backend returned error:', data.message);
                if (Platform.OS === 'web') window.alert(`Error: ${data.message || 'Failed to send OTP'}`);
                else Alert.alert('Error', data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Send OTP Exception:', error);
            if (Platform.OS === 'web') window.alert('Error: Network error. Please try again.');
            else Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            console.log('Finally block - stopping loading');
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        if (!user || !user.phone) {
            Alert.alert('Error', 'No phone number available.');
            return;
        }

        setLoading(true);
        try {
            const backend = await getOptimalBackendUrl();
            console.log('Resending OTP to:', user.phone);

            const response = await fetch(`${backend}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: user.phone,
                    purpose: 'change_password'
                })
            });

            const data = await response.json();
            if (data.success) {
                setResendTimer(60);
                setCanResend(false);
                Alert.alert('Code Resent', 'A new code has been sent.');
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) {
            console.error('Resend OTP Error:', error);
            Alert.alert('Error', 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitChange = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const backend = await getOptimalBackendUrl();
            const response = await fetch(`${backend}/api/users/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    newPassword: newPassword,
                    otp: otp
                })
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert('Success', 'Your password has been changed successfully.', [
                    { text: 'OK', onPress: onClose }
                ]);
            } else {
                if (data.message && data.message.toLowerCase().includes('expired')) {
                    Alert.alert(
                        'OTP Expired',
                        'The verification code has expired. Would you like to request a new one?',
                        [
                            { text: 'No', style: 'cancel' },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    // Verify we have user info
                                    if (user && user.phone) {
                                        // Allow resend immediately
                                        setCanResend(true);
                                        // Trigger resend
                                        // We need to bypass the canResend check in handleResendOtp or duplicate logic
                                        // easiest is to set state then call, but since state update is async, 
                                        // we'll explicitly call the API here to be safe

                                        // Call API directly for "Yes" action
                                        (async () => {
                                            setLoading(true);
                                            try {
                                                const backend = await getOptimalBackendUrl();
                                                console.log('Resending expired OTP to:', user.phone);

                                                const response = await fetch(`${backend}/api/send-otp`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        phone: user.phone,
                                                        purpose: 'change_password'
                                                    })
                                                });

                                                const resData = await response.json();
                                                if (resData.success) {
                                                    setResendTimer(60);
                                                    setCanResend(false);
                                                    Alert.alert('Code Resent', 'A new code has been sent.');
                                                } else {
                                                    Alert.alert('Error', resData.message);
                                                }
                                            } catch (error) {
                                                console.error('Resend OTP Error:', error);
                                                Alert.alert('Error', 'Failed to resend OTP');
                                            } finally {
                                                setLoading(false);
                                            }
                                        })();
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert('Error', data.message || 'Failed to change password');
                }
            }
        } catch (error) {
            console.error('Change Password Error:', error);
            Alert.alert('Error', 'Failed to change password. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Change Password</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.body}>
                        {step === 'password' ? (
                            <>
                                <Text style={styles.subtitle}>Create a new strong password.</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            placeholder="Enter new password"
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="Confirm new password"
                                            secureTextEntry={!showPassword}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.disabledButton]}
                                    onPress={handleSendOtp}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Next</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.subtitle}>Enter the code sent to {user?.phone}</Text>

                                <TextInput
                                    style={styles.otpInput}
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="000000"
                                    keyboardType="numeric"
                                    maxLength={6}
                                    autoFocus
                                />

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.disabledButton]}
                                    onPress={handleSubmitChange}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Change</Text>}
                                </TouchableOpacity>

                                <View style={styles.resendContainer}>
                                    <Text style={styles.resendText}>Didn't receive code? </Text>
                                    <TouchableOpacity
                                        onPress={handleResendOtp}
                                        disabled={!canResend || loading}
                                    >
                                        <Text style={[styles.resendLink, !canResend && styles.disabledLink]}>
                                            {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={() => setStep('password')} style={styles.backLink}>
                                    <Text style={{ color: '#666' }}>Back to Password</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1D3557'
    },
    closeButton: {
        padding: 5
    },
    body: {
        paddingBottom: 20
    },
    subtitle: {
        color: '#666',
        marginBottom: 20,
        fontSize: 14
    },
    inputGroup: {
        marginBottom: 15
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333'
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f9f9f9'
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16
    },
    otpInput: {
        borderWidth: 1,
        borderColor: '#1D3557',
        borderRadius: 8,
        padding: 15,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
        marginBottom: 20,
        backgroundColor: '#f9f9f9'
    },
    button: {
        backgroundColor: '#1D3557',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    disabledButton: {
        opacity: 0.7
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20
    },
    resendText: {
        color: '#666'
    },
    resendLink: {
        color: '#1D3557',
        fontWeight: 'bold'
    },
    disabledLink: {
        color: '#999'
    },
    backLink: {
        alignItems: 'center',
        marginTop: 20
    }
});
