import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import { supabaseService, User, Conversation } from '../services/supabase.production';
import { AuthScreen } from './AuthScreen';
import { EnhancedReflectionScreen } from './EnhancedReflectionScreen';
import { MatchingScreen } from './MatchingScreen';
import { ChatScreen } from './ChatScreen';
import { ProfileGenerationScreen } from './ProfileGenerationScreen';

type AppScreen = 'reflection' | 'matching' | 'chat' | 'profile';

export const MainApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('reflection');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await supabaseService.signOut();
      setCurrentUser(null);
      setCurrentScreen('reflection');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleChatOpen = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentScreen('chat');
  };

  const handleBackFromChat = () => {
    setSelectedConversation(null);
    setCurrentScreen('matching');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Cupido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </SafeAreaView>
    );
  }

  const renderCurrentScreen = () => {
    if (currentScreen === 'chat' && selectedConversation) {
      return (
        <ChatScreen
          conversation={selectedConversation}
          currentUser={currentUser}
          onBack={handleBackFromChat}
        />
      );
    }

    switch (currentScreen) {
      case 'reflection':
        return <EnhancedReflectionScreen currentUser={currentUser} />;
      case 'matching':
        return <MatchingScreen currentUser={currentUser} />;
      case 'profile':
        return (
          <ProfileGenerationScreen
            currentUser={currentUser}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      default:
        return <EnhancedReflectionScreen currentUser={currentUser} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cupido</Text>
        <View style={styles.headerActions}>
          <Text style={styles.headerUser}>Hi, {currentUser.first_name}!</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>

      {/* Bottom Navigation */}
      {currentScreen !== 'chat' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[
              styles.navItem,
              currentScreen === 'reflection' && styles.navItemActive
            ]}
            onPress={() => setCurrentScreen('reflection')}
          >
            <Text style={[
              styles.navIcon,
              currentScreen === 'reflection' && styles.navIconActive
            ]}>
              ✍️
            </Text>
            <Text style={[
              styles.navLabel,
              currentScreen === 'reflection' && styles.navLabelActive
            ]}>
              Reflect
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              currentScreen === 'matching' && styles.navItemActive
            ]}
            onPress={() => setCurrentScreen('matching')}
          >
            <Text style={[
              styles.navIcon,
              currentScreen === 'matching' && styles.navIconActive
            ]}>
              💕
            </Text>
            <Text style={[
              styles.navLabel,
              currentScreen === 'matching' && styles.navLabelActive
            ]}>
              Discover
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              currentScreen === 'profile' && styles.navItemActive
            ]}
            onPress={() => setCurrentScreen('profile')}
          >
            <Text style={[
              styles.navIcon,
              currentScreen === 'profile' && styles.navIconActive
            ]}>
              👤
            </Text>
            <Text style={[
              styles.navLabel,
              currentScreen === 'profile' && styles.navLabelActive
            ]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerUser: {
    fontSize: 14,
    color: '#8E8E93',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  logoutText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state handled by text color
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    // Active state
  },
  navLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#007AFF',
  },
});