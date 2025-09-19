import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

interface PrivacyScreenProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ 
  onAccept, 
  onDecline, 
  showActions = false 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.text}>
          Cupido ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our reflection-based dating service.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        
        <Text style={styles.subsectionTitle}>Personal Information</Text>
        <Text style={styles.text}>
          We collect information you provide directly to us, including:
        </Text>
        <Text style={styles.bulletPoint}>• Name, age, and contact information</Text>
        <Text style={styles.bulletPoint}>• Profile photos and descriptions</Text>
        <Text style={styles.bulletPoint}>• Dating preferences and relationship goals</Text>
        <Text style={styles.bulletPoint}>• Reflection responses and personal insights</Text>
        <Text style={styles.bulletPoint}>• Messages and communications with other users</Text>

        <Text style={styles.subsectionTitle}>Automatically Collected Information</Text>
        <Text style={styles.text}>
          We automatically collect certain information when you use our Service:
        </Text>
        <Text style={styles.bulletPoint}>• Device information (type, operating system, browser)</Text>
        <Text style={styles.bulletPoint}>• Usage patterns and app interactions</Text>
        <Text style={styles.bulletPoint}>• Location data (with your permission)</Text>
        <Text style={styles.bulletPoint}>• IP address and connection information</Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use your information to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide and improve our matching services</Text>
        <Text style={styles.bulletPoint}>• Generate personalized reflection questions</Text>
        <Text style={styles.bulletPoint}>• Facilitate connections between users</Text>
        <Text style={styles.bulletPoint}>• Ensure safety and prevent misuse</Text>
        <Text style={styles.bulletPoint}>• Send important updates and notifications</Text>
        <Text style={styles.bulletPoint}>• Analyze usage patterns to improve our service</Text>

        <Text style={styles.sectionTitle}>4. AI and Matching Technology</Text>
        <Text style={styles.text}>
          Cupido uses artificial intelligence to analyze your reflections and responses to:
        </Text>
        <Text style={styles.bulletPoint}>• Calculate compatibility with other users</Text>
        <Text style={styles.bulletPoint}>• Generate personalized question recommendations</Text>
        <Text style={styles.bulletPoint}>• Assess authenticity and engagement levels</Text>
        <Text style={styles.bulletPoint}>• Improve our matching algorithms</Text>
        <Text style={styles.text}>
          Your reflection content is processed to understand personality traits, values, and interests, but individual responses are never shared directly with other users without your consent.
        </Text>

        <Text style={styles.sectionTitle}>5. Information Sharing</Text>
        <Text style={styles.text}>
          We do not sell your personal information. We may share your information in these limited circumstances:
        </Text>
        <Text style={styles.bulletPoint}>• With other users as part of our matching service</Text>
        <Text style={styles.bulletPoint}>• With service providers who assist our operations</Text>
        <Text style={styles.bulletPoint}>• When required by law or to protect safety</Text>
        <Text style={styles.bulletPoint}>• In connection with a business transfer or merger</Text>

        <Text style={styles.sectionTitle}>6. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate security measures to protect your information:
        </Text>
        <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and monitoring</Text>
        <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
        <Text style={styles.bulletPoint}>• Secure data centers and infrastructure</Text>

        <Text style={styles.sectionTitle}>7. Your Privacy Rights</Text>
        <Text style={styles.text}>
          You have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information</Text>
        <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
        <Text style={styles.bulletPoint}>• Delete your account and data</Text>
        <Text style={styles.bulletPoint}>• Control who can see your profile</Text>
        <Text style={styles.bulletPoint}>• Opt out of certain communications</Text>
        <Text style={styles.bulletPoint}>• Download your data (data portability)</Text>

        <Text style={styles.sectionTitle}>8. Location Information</Text>
        <Text style={styles.text}>
          We may collect location information to show you potential matches in your area. You can control location sharing through your device settings. We do not share your exact location with other users without your consent.
        </Text>

        <Text style={styles.sectionTitle}>9. Cookies and Tracking</Text>
        <Text style={styles.text}>
          We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser preferences.
        </Text>

        <Text style={styles.sectionTitle}>10. Third-Party Services</Text>
        <Text style={styles.text}>
          Our service may integrate with third-party services (social media, authentication providers). These services have their own privacy policies, and we encourage you to review them.
        </Text>

        <Text style={styles.sectionTitle}>11. Data Retention</Text>
        <Text style={styles.text}>
          We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we delete your personal information, though some data may be retained for legal or safety purposes.
        </Text>

        <Text style={styles.sectionTitle}>12. International Data Transfers</Text>
        <Text style={styles.text}>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during international transfers.
        </Text>

        <Text style={styles.sectionTitle}>13. Children's Privacy</Text>
        <Text style={styles.text}>
          Our service is not intended for users under 18. We do not knowingly collect personal information from children under 18. If we become aware of such collection, we will delete the information promptly.
        </Text>

        <Text style={styles.sectionTitle}>14. Changes to Privacy Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. Your continued use of the service constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Us</Text>
        <Text style={styles.text}>
          If you have questions about this Privacy Policy or our privacy practices, contact us at:
        </Text>
        <Text style={styles.text}>
          Email: privacy@cupido.app{'\n'}
          Data Protection Officer: dpo@cupido.app{'\n'}
          Website: https://cupido.app/privacy
        </Text>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.acceptButtonText}>I Understand</Text>
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
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

export default PrivacyScreen;