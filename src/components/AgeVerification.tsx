import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

interface AgeVerificationProps {
  onVerified: (isVerified: boolean) => void;
  onDeclined: () => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({ 
  onVerified, 
  onDeclined 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerifyAge = async () => {
    setIsProcessing(true);
    
    // Simulate verification process
    setTimeout(() => {
      setIsProcessing(false);
      onVerified(true);
    }, 1000);
  };

  const handleDecline = () => {
    Alert.alert(
      'Age Requirement',
      'You must be at least 18 years old to use Cupido. If you are 18 or older, please verify your age to continue.',
      [
        { text: 'I\'m Under 18', onPress: onDeclined, style: 'destructive' },
        { text: 'Verify My Age', onPress: handleVerifyAge },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🛡️</Text>
        </View>
        
        <Text style={styles.title}>Age Verification Required</Text>
        
        <Text style={styles.description}>
          Cupido is designed for adults seeking meaningful relationships. You must be at least 18 years old to use our service.
        </Text>

        <View style={styles.requirements}>
          <Text style={styles.requirementTitle}>Why we verify age:</Text>
          <Text style={styles.requirement}>• Ensure a safe environment for all users</Text>
          <Text style={styles.requirement}>• Comply with legal requirements</Text>
          <Text style={styles.requirement}>• Maintain community standards</Text>
          <Text style={styles.requirement}>• Protect minors from adult content</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            By verifying your age, you confirm that you are 18 years of age or older and agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.verifyButton]} 
            onPress={handleVerifyAge}
            disabled={isProcessing}
          >
            <Text style={styles.verifyButtonText}>
              {isProcessing ? 'Verifying...' : 'I am 18 or older'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]} 
            onPress={handleDecline}
            disabled={isProcessing}
          >
            <Text style={styles.declineButtonText}>I am under 18</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Your privacy is important to us. We do not store your age verification data beyond confirming eligibility.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '85%',
  },
  requirements: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  requirement: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1C1C1E',
    marginBottom: 6,
    paddingLeft: 8,
  },
  disclaimer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6C6C8',
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: '75%',
  },
});

export default AgeVerification;