import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

interface TermsScreenProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ 
  onAccept, 
  onDecline, 
  showActions = false 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing and using Cupido ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.text}>
          Cupido is a reflection-based dating platform that connects people through thoughtful daily questions and authentic responses. Our service facilitates meaningful connections based on personality, values, and personal growth rather than superficial attributes.
        </Text>

        <Text style={styles.sectionTitle}>3. Age Requirements</Text>
        <Text style={styles.text}>
          You must be at least 18 years old to use this service. By using Cupido, you represent and warrant that you are 18 years of age or older.
        </Text>

        <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
        <Text style={styles.text}>
          You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>5. Prohibited Content and Conduct</Text>
        <Text style={styles.text}>
          You may not use the Service to:
        </Text>
        <Text style={styles.bulletPoint}>• Share false, misleading, or deceptive information</Text>
        <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
        <Text style={styles.bulletPoint}>• Share inappropriate, offensive, or illegal content</Text>
        <Text style={styles.bulletPoint}>• Attempt to circumvent our matching algorithms</Text>
        <Text style={styles.bulletPoint}>• Use automated systems to access the Service</Text>

        <Text style={styles.sectionTitle}>6. Privacy and Data Protection</Text>
        <Text style={styles.text}>
          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using Cupido, you consent to the collection and use of information in accordance with our Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>7. Matching and Connections</Text>
        <Text style={styles.text}>
          Cupido uses AI-powered algorithms to suggest potential matches based on your reflections, responses, and preferences. While we strive to provide meaningful connections, we do not guarantee the accuracy of our matching system or the success of any relationship.
        </Text>

        <Text style={styles.sectionTitle}>8. Content Ownership</Text>
        <Text style={styles.text}>
          You retain ownership of the content you create and share on Cupido. However, by posting content, you grant us a non-exclusive, worldwide license to use, display, and distribute your content for the purpose of operating and improving our Service.
        </Text>

        <Text style={styles.sectionTitle}>9. Safety and Reporting</Text>
        <Text style={styles.text}>
          We are committed to maintaining a safe environment. You can report inappropriate behavior or content through our reporting system. We reserve the right to investigate reports and take appropriate action, including suspending or terminating accounts.
        </Text>

        <Text style={styles.sectionTitle}>10. Disclaimers</Text>
        <Text style={styles.text}>
          Cupido is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure. You use the Service at your own risk.
        </Text>

        <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
        <Text style={styles.text}>
          In no event shall Cupido be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
        </Text>

        <Text style={styles.sectionTitle}>12. Termination</Text>
        <Text style={styles.text}>
          Either party may terminate this agreement at any time. Upon termination, your right to use the Service ceases immediately. We may retain certain information as required by law or for legitimate business purposes.
        </Text>

        <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
        <Text style={styles.text}>
          We reserve the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Information</Text>
        <Text style={styles.text}>
          If you have any questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={styles.text}>
          Email: legal@cupido.app{'\n'}
          Website: https://cupido.app/contact
        </Text>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.acceptButtonText}>I Agree</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C1C1E',
    marginBottom: 6,
    paddingLeft: 16,
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#C6C6C8',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  spacer: {
    height: 40,
  },
});

export default TermsScreen;