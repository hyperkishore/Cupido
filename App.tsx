// FIXED: Add WebSocket polyfills for React Native at the very top
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform,
  ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { AppStateProvider } from './src/contexts/AppStateContext';
import { FeedbackProvider, useFeedback } from './src/contexts/FeedbackContext';
import { withSimpleFeedback } from './src/components/withSimpleFeedback';
import { PixelPerfectHomeScreen } from './src/screens/PixelPerfectHomeScreen';
import { PixelPerfectReflectScreen } from './src/screens/PixelPerfectReflectScreen';
import { PixelPerfectMatchesScreen } from './src/screens/PixelPerfectMatchesScreen';
import { PixelPerfectProfileScreen } from './src/screens/PixelPerfectProfileScreen';
import { PixelPerfectMessagesScreen } from './src/screens/PixelPerfectMessagesScreen';
import { VersionDisplay } from './src/components/VersionDisplay';
import { ModeProvider, useAppMode } from './src/contexts/AppModeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from './src/contexts/OnboardingContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardingFlow } from './src/screens/OnboardingFlow';
import { CalmLoadingScreen } from './src/components/CalmLoadingScreen';
import { TestBridge } from './src/components/TestBridge';
import { promptService } from './src/services/promptService';

const Tab = createBottomTabNavigator();


// Wrap screens with simple feedback capability
const HomeScreenWithFeedback = withSimpleFeedback(PixelPerfectHomeScreen, 'HomeScreen');
const ReflectScreenWithFeedback = withSimpleFeedback(PixelPerfectReflectScreen, 'ReflectScreen');
const MatchesScreenWithFeedback = withSimpleFeedback(PixelPerfectMatchesScreen, 'MatchesScreen');
const ProfileScreenWithFeedback = withSimpleFeedback(PixelPerfectProfileScreen, 'ProfileScreen');

const AppShell = () => {
  const [showMessages, setShowMessages] = useState(false);
  const [hasNotification] = useState(true);
  useFeedback();
  const { mode } = useAppMode();

  const HeaderRight = () => (
    <View style={styles.headerRight}>
      {mode === 'demo' && (
        <View style={[styles.modeChip, styles.modeChipDemo]}>
          <Text style={styles.modeChipText}>Demo</Text>
        </View>
      )}
      <VersionDisplay />
      <TouchableOpacity
        style={styles.headerIcon}
        onPress={() => setShowMessages(true)}
      >
        <Feather name="message-circle" size={20} color="#1C1C1E" />
        {hasNotification && <View style={styles.notificationDot} />}
      </TouchableOpacity>
    </View>
  );

  if (showMessages) {
    return <PixelPerfectMessagesScreen onClose={() => setShowMessages(false)} />;
  }

  try {
    return (
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>Cupido</Text>
            <HeaderRight />
          </View>
          
          <Tab.Navigator
            initialRouteName="Reflect"
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color }) => {
                let iconName: keyof typeof Feather.glyphMap = 'circle';

                if (route.name === 'Home') {
                  iconName = 'home';
                } else if (route.name === 'Reflect') {
                  iconName = 'edit-3';
                } else if (route.name === 'Matches') {
                  iconName = 'heart';
                } else if (route.name === 'Profile') {
                  iconName = 'user';
                } else if (route.name === 'Docs') {
                  iconName = 'book-open';
                }

                return <Feather name={iconName} size={20} color={color ?? (focused ? '#007AFF' : '#8E8E93')} />;
              },
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: '#8E8E93',
              tabBarItemStyle: {
                paddingTop: 4,
                paddingBottom: 2,
                justifyContent: 'center',
                alignItems: 'center',
                height: 60,
              },
              tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0.5,
                borderTopColor: '#C6C6C8',
                paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                paddingTop: 6,
                height: Platform.OS === 'ios' ? 85 : 70,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '500',
                marginTop: 4,
                marginBottom: 0,
                paddingBottom: 2,
                lineHeight: 13,
              },
              tabBarShowLabel: true,
            })}
          >
            <Tab.Screen name="Home" component={HomeScreenWithFeedback} />
            <Tab.Screen name="Reflect" component={ReflectScreenWithFeedback} />
            <Tab.Screen name="Matches" component={MatchesScreenWithFeedback} />
            <Tab.Screen name="Profile" component={ProfileScreenWithFeedback} />
          </Tab.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    );
  } catch (error) {
    // Fallback in case of any errors
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Cupido</Text>
        <Text style={styles.errorText}>Loading your reflections…</Text>
        <Text style={styles.errorDetails}>
          {error?.toString() || 'Unknown error occurred'}
        </Text>
      </View>
    );
  }
};

// Phone-sized frame: constrains app to 480px max width on wide screens
const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.phoneFrameOuter}>
    <View style={styles.phoneFrameInner}>
      {children}
    </View>
  </View>
);

export default function App() {
  return (
    <ModeProvider>
      <OnboardingProvider>
        <AuthProvider>
          <AppStateProvider>
            <FeedbackProvider>
              <TestBridge />
              <PhoneFrame>
                <Root />
              </PhoneFrame>
            </FeedbackProvider>
          </AppStateProvider>
        </AuthProvider>
      </OnboardingProvider>
    </ModeProvider>
  );
}

const Root = () => {
  const { user, loading } = useAuth();
  const { mode, setMode } = useAppMode();
  const { hasCompletedOnboarding } = useOnboarding();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Auto-enter demo mode on GitHub Pages after onboarding
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'hyperkishore.github.io' && hasCompletedOnboarding && mode !== 'demo') {
      console.log('[Root] GitHub Pages detected — auto-entering demo mode');
      setMode('demo');
    }
  }, [hasCompletedOnboarding, mode, setMode]);

  React.useEffect(() => {
    console.log('[Root] Loading state:', loading, 'User:', user ? 'exists' : 'null', 'Onboarding:', hasCompletedOnboarding);
  }, [loading, user, hasCompletedOnboarding]);

  React.useEffect(() => {
    console.log('[Root] Initializing promptService...');
    // Initialize prompt service
    promptService.initialize().catch(error => {
      console.error('[Root] Failed to initialize promptService:', error);
    });
  }, []);

  React.useEffect(() => {
    console.log('[Root] Setting 5s timeout for loading screen...');
    // Set a timeout for loading state
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[Root] ⏱️  Loading timeout reached (5s) - showing timeout screen');
        setLoadingTimeout(true);
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, [loading]);

  // In demo mode, bypass everything (onboarding + auth)
  if (mode === 'demo') {
    return <AppShell />;
  }

  // Show loading while onboarding state is being read from AsyncStorage
  if (hasCompletedOnboarding === null) {
    return <CalmLoadingScreen message="Loading your reflection space" />;
  }

  // Show onboarding flow for new users
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  // Auth loading state (onboarding is complete)
  if (loading && !loadingTimeout) {
    console.log('[Root] Rendering CalmLoadingScreen...');
    return <CalmLoadingScreen message="Loading your reflection space" />;
  }

  // FIXED: Check both loading and loadingTimeout to allow recovery
  if (loading && loadingTimeout) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>Cupido</Text>
          <Text style={styles.loadingCopy}>Taking longer than usual...</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoadingTimeout(false);
              // Reload the app
              if (Platform.OS === 'web') {
                window.location.reload();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // In local mode, require authentication
  if (!user) {
    return <LoginScreen />;
  }

  return <AppShell />;
};

const styles = StyleSheet.create({
  phoneFrameOuter: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  phoneFrameInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  logo: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modeChipDemo: {
    backgroundColor: '#FEE4E2',
  },
  modeChipLocal: {
    backgroundColor: '#E0F2FE',
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerIcon: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
  },
  loadingCopy: {
    marginTop: 12,
    fontSize: 15,
    color: '#6C6C70',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
