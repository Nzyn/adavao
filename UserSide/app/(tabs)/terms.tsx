import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import styles from "./styles"; // import your global styles
import Checkbox from 'expo-checkbox';

const Terms = () => {
  const handlePress = () => {
    console.log("Agreed to Terms pressed!");
  };
  const [isChecked, setChecked] = useState(false);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={true}
    >
      <View>
        {/* Title */}
        <Text style={styles.textTitle}>
          <Text style={styles.alertWelcome}>Alert</Text>
          <Text style={styles.davao}>Davao</Text>
        </Text>
        <Text style={styles.subheadingCenter}>Terms and Conditions</Text>

        {/* Welcome */}
        <Text style={styles.normalTxtJustify}>Welcome to AlertDavao. By using our platform, you agree to the following Terms and Conditions.
          Please read them carefully before submitting any report or using our services.</Text>

        <Text style={styles.sectionHeading}>1. Purpose of the Platform</Text>
        <Text style={styles.normalTxtJustify}>AlertDavao is a community safety platform designed to allow users to report crimes, emergencies, and safety-related incidents to DCPO.
          The system facilitates communication between the public and local law enforcement for faster and more efficient response.</Text>

        <Text style={styles.sectionHeading}>2. User Responsibilities</Text>
        <Text style={styles.normalTxt}>By using AlertDavao, you agree to: {'\n'}
          • Submit only truthful, accurate, and relevant information.{'\n'}
          • Avoid submitting false, misleading, or malicious reports.{'\n'}
          • Use the platform only for legitimate safety and security concerns.{'\n'}
          • Respect applicable laws and regulations in the Philippines.</Text>

        <Text style={styles.sectionHeading}>3. Data Collection and Privacy</Text>
        <Text style={styles.normalTxtJustify}>In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173),
          AlertDavao collects and processes personal data for security and operational purposes, which may include:</Text>
        <Text style={styles.normalTxt}>
          • IP Address {'\n'}
          • GPS Location {'\n'}
          • User-provided details (text, images, videos) {'\n'}
          {'\n'}This information is:

        </Text>
        <Text style={styles.normalTxtJustify}>
          • Used solely for verification, accountability, and law enforcement coordination. {'\n'}
          • Shared only with authorized government agencies when necessary. {'\n'}
          • Stored securely in compliance with applicable data protection standards. {'\n'}
          • Anonymized and aggregated when used for predictive analytics through the Seasonal Autoregressive Integrated Moving Average (SARIMA) model,
          which helps identify and forecast seasonal crime patterns (e.g., monthly or weekly trends) to assist authorities in resource allocation and proactive crime prevention
        </Text>

        <Text style={styles.sectionHeading}>4. Accountability & Transparency</Text>
        <Text style={styles.normalTxtJustify}>For every submitted report: {'\n'}
          • Your IP address and GPS location will be recorded.
          • You will receive an automatic confirmation that this data has been logged.
          • This ensures traceability and prevents abuse of the reporting system.
        </Text>

        <Text style={styles.sectionHeading}>5. Limitations of Service</Text>
        <Text style={styles.normalTxtJustify}>AlertDavao is a reporting and coordination platform and does not directly dispatch emergency response teams.
          While we aim for fast processing, response time depends on the relevant authorities and not solely on the platform.</Text>

        <Text style={styles.sectionHeading}>6. Misuse and Penalties</Text>
        <Text style={styles.normalTxtJustify}>Users who submit false or prank reports may face legal action under: {'\n'}
          • Revised Penal Code (False Information / Perjury) {'\n'}
          • Cybercrime Prevention Act of 2012 (RA 10175){'\n'}
          • Other applicable laws upon investigation</Text>

        <Text style={styles.sectionHeading}>7. Modifications to Terms</Text>
        <Text style={styles.normalTxtJustify}>We may update these Terms and Conditions from time to time.
          Continued use of AlertDavao after updates means you accept the revised terms.
        </Text>

        <Text style={styles.sectionHeading}>8. Contact Information</Text>
        <Text style={styles.normalTxtJustify}>For questions, concerns, or requests regarding your personal data or these Terms, please contact:</Text>
        <Text style={styles.normalTxt}>AlertDavao Support Team {'\n'}
          Email: [Insert Support Email] {'\n'}
          Phone: [Insert Support Number] {'\n'}</Text>

        {/* Checkbox + Agree */}
        <View style={styles.checkboxRow}>
          <Checkbox value={isChecked} onValueChange={setChecked} color={isChecked ? "#1D3557" : undefined} />
          <Text style={styles.termsCheckboxText}>I have read and agree to the Terms & Conditions</Text>
        </View>

        {/* Button (disabled until checked) */}
        <Button
          title="I Agree"
          onPress={() => alert("You accepted the Terms & Conditions!")}
          disabled={!isChecked}
          color="#1D3557"
        />
        <Text>{'\n'}</Text>
      </View>
    </ScrollView>

  );
};

export default Terms;
