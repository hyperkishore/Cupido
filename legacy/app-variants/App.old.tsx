import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

// Auth Screen Component
const AuthScreen = ({ email, setEmail, password, setPassword, onLogin }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Cupido</Text>
    <Text style={styles.subtitle}>Privacy-first dating through daily self-discovery</Text>
    
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Demo Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email (demo@cupido.app)"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (any password)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Home Screen Component
const HomeScreen = ({ onSignOut }) => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to Cupido</Text>
        <Text style={styles.headerSubtitle}>Your privacy-first dating journey</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Reflection</Text>
          <Text style={styles.promptText}>
            "What made you smile today, and why did it resonate with you?"
          </Text>
          <Text style={styles.completedText}>✅ Completed for today</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Matches</Text>
          <View style={styles.matchItem}>
            <Text style={styles.matchText}>Anonymous Match • 87% Compatible</Text>
            <TouchableOpacity style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Start Q&A</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.matchItem}>
            <Text style={styles.matchText}>Anonymous Match • 82% Compatible</Text>
            <TouchableOpacity style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Start Q&A</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Personality</Text>
          <View style={styles.traitItem}>
            <Text style={styles.traitName}>Authenticity</Text>
            <View style={styles.traitBar}>
              <View style={[styles.traitFill, { width: '92%' }]} />
            </View>
            <Text style={styles.traitScore}>92%</Text>
          </View>
          <View style={styles.traitItem}>
            <Text style={styles.traitName}>Empathy</Text>
            <View style={styles.traitBar}>
              <View style={[styles.traitFill, { width: '88%' }]} />
            </View>
            <Text style={styles.traitScore}>88%</Text>
          </View>
          <View style={styles.traitItem}>
            <Text style={styles.traitName}>Curiosity</Text>
            <View style={styles.traitBar}>
              <View style={[styles.traitFill, { width: '85%' }]} />
            </View>
            <Text style={styles.traitScore}>85%</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Badges</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>✨</Text>
              <Text style={styles.badgeName}>First Steps</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🔥</Text>
              <Text style={styles.badgeName}>Week Warrior</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🎤</Text>
              <Text style={styles.badgeName}>Voice Pioneer</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🌈</Text>
              <Text style={styles.badgeName}>Authentic Soul</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>❤️</Text>
              <Text style={styles.badgeName}>Empathetic Heart</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onSignOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
);

// Main App Component
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    setCurrentScreen('home');
  };

  const handleSignOut = () => {
    setCurrentScreen('auth');
  };

  return currentScreen === 'auth' ? (
    <AuthScreen 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onLogin={handleLogin}
    />
  ) : (
    <HomeScreen onSignOut={handleSignOut} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  promptText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  completedText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  smallButton: {
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  traitName: {
    fontSize: 16,
    color: '#000000',
    width: 120,
  },
  traitBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  traitFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  traitScore: {
    fontSize: 14,
    color: '#666666',
    width: 40,
    textAlign: 'right',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#666666',
  },
});