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

const ModeToggle: React.FC<{ mode: AppMode; onToggle: (mode: AppMode) => void }> = ({ mode, onToggle }) => {
  return (
    <View style={styles.modeToggleContainer}>
      <Text style={styles.modeLabel}>Mode</Text>
      <View style={styles.modeButtons}>
        {(['demo', 'local'] as AppMode[]).map(value => {
          const isActive = mode === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.modeButton, isActive && styles.modeButtonActive]}
              onPress={() => onToggle(value)}
            >
              <Text style={[styles.modeButtonText, isActive && styles.modeButtonTextActive]}>
                {value === 'demo' ? 'Demo' : 'Local'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const AuthPhoneScreen: React.FC = () => {
  const { signIn, loading } = useAuth();
  const { mode, setMode } = useAppMode();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    const trimmed = phoneNumber.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      setError('Enter a valid phone number.');
      return;
    }

    setError(null);
    await signIn(trimmed);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Cupido</Text>
        <Text style={styles.subtitle}>Step into your reflection journey</Text>

        <ModeToggle mode={mode} onToggle={setMode} />

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. +1 415 555 0199"
            placeholderTextColor="#B0B0B0"
            keyboardType="phone-pad"
            autoComplete="tel"
            autoCorrect={false}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>
              Continue
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          We’ll use this number to personalise your experience. No codes required in demo mode.
        </Text>
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
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    maxWidth: 460,
    alignSelf: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
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
  signInButton: {
    backgroundColor: '#000000',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  signInButtonDisabled: {
    opacity: 0.4,
  },
  signInButtonText: {
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
  modeToggleContainer: {
    marginBottom: 24,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
});
