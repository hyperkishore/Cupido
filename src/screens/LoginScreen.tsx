import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAppMode, AppMode } from '../contexts/AppModeContext';

const PHONE_REGEX = /^[0-9+() -]{6,}$/;

export const LoginScreen: React.FC = () => {
  const { signIn, loading } = useAuth();
  const { setMode } = useAppMode();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const trimmed = phoneNumber.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      setError('Enter a valid phone number (minimum 6 digits).');
      return;
    }

    setError(null);
    await signIn(trimmed);
  };

  const handleTryDemo = () => {
    setMode('demo');
    // Demo mode will bypass authentication in AppNavigator
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Cupido</Text>
        <Text style={styles.subtitle}>Sign in with your phone number to continue</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. +1 415 555 0199"
            placeholderTextColor="#9A9A9A"
            keyboardType="phone-pad"
            autoComplete="tel"
            autoCorrect={false}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleTryDemo} style={styles.demoLinkContainer}>
          <Text style={styles.demoLinkText}>
            Just exploring? <Text style={styles.demoLinkHighlight}>Try demo mode</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6F6F6F',
    textAlign: 'center',
    marginBottom: 28,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F1F',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  errorText: {
    color: '#D14343',
    marginTop: 6,
    fontSize: 13,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  demoLinkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoLinkText: {
    fontSize: 14,
    color: '#6F6F6F',
    textAlign: 'center',
  },
  demoLinkHighlight: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
