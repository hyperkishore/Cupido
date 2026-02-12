import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingConsents {
  ageVerified: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  consentDate: string | null;
}

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean | null; // null = loading
  consents: OnboardingConsents;
  completeOnboarding: (consents: Omit<OnboardingConsents, 'consentDate'>) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const STORAGE_KEY_COMPLETE = 'cupido_onboarding_complete';
const STORAGE_KEY_CONSENTS = 'cupido_onboarding_consents';

const DEFAULT_CONSENTS: OnboardingConsents = {
  ageVerified: false,
  termsAccepted: false,
  privacyAccepted: false,
  consentDate: null,
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [consents, setConsents] = useState<OnboardingConsents>(DEFAULT_CONSENTS);

  useEffect(() => {
    const load = async () => {
      try {
        const complete = await AsyncStorage.getItem(STORAGE_KEY_COMPLETE);
        setHasCompletedOnboarding(complete === 'true');

        if (complete === 'true') {
          const stored = await AsyncStorage.getItem(STORAGE_KEY_CONSENTS);
          if (stored) {
            setConsents(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.warn('[Onboarding] Failed to read state from storage', error);
        setHasCompletedOnboarding(false);
      }
    };

    load();
  }, []);

  const completeOnboarding = async (newConsents: Omit<OnboardingConsents, 'consentDate'>) => {
    const fullConsents: OnboardingConsents = {
      ...newConsents,
      consentDate: new Date().toISOString(),
    };

    setConsents(fullConsents);
    setHasCompletedOnboarding(true);

    try {
      await AsyncStorage.setItem(STORAGE_KEY_COMPLETE, 'true');
      await AsyncStorage.setItem(STORAGE_KEY_CONSENTS, JSON.stringify(fullConsents));
    } catch (error) {
      console.warn('[Onboarding] Failed to persist onboarding state', error);
    }
  };

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    setConsents(DEFAULT_CONSENTS);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY_COMPLETE);
      await AsyncStorage.removeItem(STORAGE_KEY_CONSENTS);
    } catch (error) {
      console.warn('[Onboarding] Failed to reset onboarding state', error);
    }
  };

  const value = useMemo(
    () => ({ hasCompletedOnboarding, consents, completeOnboarding, resetOnboarding }),
    [hasCompletedOnboarding, consents]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
