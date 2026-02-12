import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { WelcomeSlides } from '../components/WelcomeSlides';
import { AgeVerification } from '../components/AgeVerification';
import { ConsentStep } from '../components/ConsentStep';
import { useOnboarding } from '../contexts/OnboardingContext';

type OnboardingStep = 'welcome' | 'age' | 'terms';

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);
  const [declinedType, setDeclinedType] = useState<'age' | 'terms'>('age');
  const { completeOnboarding } = useOnboarding();

  const handleWelcomeComplete = () => {
    setStep('age');
  };

  const handleAgeVerified = () => {
    setStep('terms');
  };

  const handleAgeDeclined = () => {
    setDeclinedType('age');
    setShowDeclinedModal(true);
  };

  const handleConsentAccepted = async () => {
    await completeOnboarding({
      ageVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
    });
    // Root component will automatically re-render and show LoginScreen
  };

  const handleConsentDeclined = () => {
    setDeclinedType('terms');
    setShowDeclinedModal(true);
  };

  const handleRetry = () => {
    setShowDeclinedModal(false);
    // Stay on the current step to let them try again
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeSlides onComplete={handleWelcomeComplete} />;

      case 'age':
        return (
          <AgeVerification
            onVerified={handleAgeVerified}
            onDeclined={handleAgeDeclined}
          />
        );

      case 'terms':
        return (
          <ConsentStep
            onAccept={handleConsentAccepted}
            onDecline={handleConsentDeclined}
          />
        );

      default:
        return <WelcomeSlides onComplete={handleWelcomeComplete} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}

      {/* Declined modal (web-safe alternative to Alert.alert) */}
      {showDeclinedModal && (
        Platform.OS === 'web' ? (
          // Web: inline overlay since Modal can be flaky on web
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {declinedType === 'age' ? 'Age Requirement' : 'Terms Required'}
              </Text>
              <Text style={styles.modalMessage}>
                {declinedType === 'age'
                  ? 'You must be at least 18 years old to use Cupido. Please verify your age to continue.'
                  : 'You must accept the Terms of Service and Privacy Policy to use Cupido.'}
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
                <Text style={styles.modalButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Modal transparent animationType="fade" visible={showDeclinedModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {declinedType === 'age' ? 'Age Requirement' : 'Terms Required'}
                </Text>
                <Text style={styles.modalMessage}>
                  {declinedType === 'age'
                    ? 'You must be at least 18 years old to use Cupido. Please verify your age to continue.'
                    : 'You must accept the Terms of Service and Privacy Policy to use Cupido.'}
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
                  <Text style={styles.modalButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OnboardingFlow;
