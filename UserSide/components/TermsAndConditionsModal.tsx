import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsAndConditionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1D3557" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>AlertDavao Terms & Conditions</Text>
            <Text style={styles.lastUpdated}>Last Updated: December 4, 2025</Text>
            
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using AlertDavao, you acknowledge that you are at least 18 years old and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.
            </Text>
            
            <Text style={styles.sectionTitle}>2. Service Description</Text>
            <Text style={styles.paragraph}>
              AlertDavao is a crime reporting and community safety platform exclusively for Davao City residents. The application allows users to:
            </Text>
            <Text style={styles.bulletPoint}>• Report crimes and incidents within Davao City</Text>
            <Text style={styles.bulletPoint}>• Communicate with local police authorities</Text>
            <Text style={styles.bulletPoint}>• Access crime statistics and safety information</Text>
            <Text style={styles.bulletPoint}>• Submit anonymous or identified reports</Text>
            
            <Text style={styles.sectionTitle}>3. Eligibility and Restrictions</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Age Requirement:</Text> You must be at least 18 years old to use this service.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Geographic Restriction:</Text> This service is exclusively for residents and incidents within Davao City, Philippines. Reports outside Davao City boundaries will not be accepted.
            </Text>
            
            <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
            <Text style={styles.paragraph}>You agree to:</Text>
            <Text style={styles.bulletPoint}>• Provide accurate and truthful information</Text>
            <Text style={styles.bulletPoint}>• Report only genuine crimes and incidents</Text>
            <Text style={styles.bulletPoint}>• Use the service responsibly and lawfully</Text>
            <Text style={styles.bulletPoint}>• Not submit false, misleading, or malicious reports</Text>
            <Text style={styles.bulletPoint}>• Respect the privacy and rights of others</Text>
            <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>
            
            <Text style={styles.sectionTitle}>5. Reporting Policies</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>False Reports:</Text> Submitting false reports is strictly prohibited and may result in account suspension, permanent ban, and potential legal action.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Anonymous Reporting:</Text> You may submit anonymous reports, but we reserve the right to investigate the source if necessary for law enforcement purposes.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Evidence:</Text> You may attach photos or videos to support your report. By uploading media, you confirm you have the right to share it.
            </Text>
            
            <Text style={styles.sectionTitle}>6. Account Restrictions</Text>
            <Text style={styles.paragraph}>
              Your account may be flagged, restricted, or banned if you:
            </Text>
            <Text style={styles.bulletPoint}>• Submit multiple false reports</Text>
            <Text style={styles.bulletPoint}>• Abuse the reporting system</Text>
            <Text style={styles.bulletPoint}>• Harass other users or authorities</Text>
            <Text style={styles.bulletPoint}>• Violate these Terms and Conditions</Text>
            
            <Text style={styles.sectionTitle}>7. Security Measures</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Login Attempts:</Text> After 5 consecutive failed login attempts, your account will be temporarily locked for 5 minutes. Each subsequent set of 5 failed attempts adds an additional 5 minutes. On the 15th failed attempt, a security alert will be sent to your registered email.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Inactivity:</Text> You will be automatically logged out after 5 minutes of inactivity for security purposes.
            </Text>
            
            <Text style={styles.sectionTitle}>8. Privacy and Data Protection</Text>
            <Text style={styles.paragraph}>
              We are committed to protecting your privacy. Location data and sensitive information are encrypted. Personal information is only shared with law enforcement when necessary for investigation purposes.
            </Text>
            
            <Text style={styles.sectionTitle}>9. Anonymous Messaging</Text>
            <Text style={styles.paragraph}>
              When communicating with police authorities, you may be identified by an ID number instead of your name/email to protect your privacy. However, authorities may access your full details if required for investigation.
            </Text>
            
            <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              AlertDavao is a reporting tool and does not guarantee:
            </Text>
            <Text style={styles.bulletPoint}>• Immediate response from authorities</Text>
            <Text style={styles.bulletPoint}>• Resolution of reported incidents</Text>
            <Text style={styles.bulletPoint}>• Protection from crimes or incidents</Text>
            <Text style={styles.bulletPoint}>• Accuracy of information provided by other users</Text>
            
            <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify these Terms and Conditions at any time. Continued use of the application after changes constitutes acceptance of the updated terms.
            </Text>
            
            <Text style={styles.sectionTitle}>12. Contact Information</Text>
            <Text style={styles.paragraph}>
              For questions about these Terms and Conditions, please contact the Davao City Police Office or the AlertDavao support team.
            </Text>
            
            <Text style={styles.sectionTitle}>13. Governing Law</Text>
            <Text style={styles.paragraph}>
              These Terms and Conditions are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the courts of Davao City.
            </Text>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D3557',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3557',
    marginTop: 16,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 12,
  },
  bold: {
    fontWeight: '600',
    color: '#1D3557',
  },
});

export default TermsAndConditionsModal;
