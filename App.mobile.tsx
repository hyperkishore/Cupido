import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StatusBar } from 'react-native';

// Sample questions for the experience
const SAMPLE_QUESTIONS = [
  "What made you smile today, and why did it resonate with you?",
  "Describe a moment when you felt most authentically yourself.",
  "What's a belief you held strongly that has evolved over time?",
  "When do you feel most energized and alive?",
  "What's something you're curious about that others might find unusual?",
  "Describe a time when you showed courage in a small way.",
  "What does intimacy mean to you beyond physical connection?",
  "What's a childhood memory that still influences how you see the world?",
  "When do you feel most misunderstood, and what would help?",
  "What's something you've learned about yourself through difficulty?"
];

// Auth Screen Component
const AuthScreen = ({ email, setEmail, password, setPassword, onLogin }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <ScrollView contentContainerStyle={styles.authContainer}>
      <View style={styles.authContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Cupido</Text>
          <Text style={styles.tagline}>Privacy-first dating through daily self-discovery</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="demo@cupido.app"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter any password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <Text style={styles.demoNote}>Demo mode • Any credentials work</Text>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Daily Reflection Screen
const ReflectionScreen = ({ currentQuestion, questionIndex, response, setResponse, onNext, onBack, totalQuestions }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((questionIndex + 1) / totalQuestions) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{questionIndex + 1} of {totalQuestions}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.questionTitle}>Today's Reflection</Text>
        <Text style={styles.questionText}>{currentQuestion}</Text>
        
        <View style={styles.responseContainer}>
          <TextInput
            style={styles.responseInput}
            placeholder="Share your thoughts..."
            value={response}
            onChangeText={setResponse}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{response.length}/500</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, !response.trim() && styles.disabledButton]} 
          onPress={onNext}
          disabled={!response.trim()}
        >
          <Text style={styles.primaryButtonText}>
            {questionIndex === totalQuestions - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

// Home Dashboard Screen
const DashboardScreen = ({ onStartReflection, onViewProfile, onViewMatches, onSignOut }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.welcomeText}>Good morning</Text>
        <Text style={styles.userNameText}>Alex</Text>
        <TouchableOpacity style={styles.profileButton} onPress={onViewProfile}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.streakCard}>
        <View style={styles.streakContent}>
          <Text style={styles.streakNumber}>12</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.streakIcon}>
          <Text style={styles.streakEmoji}>🔥</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.reflectionCard} onPress={onStartReflection}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Daily Reflection</Text>
          <Text style={styles.cardSubtitle}>Continue your self-discovery journey</Text>
        </View>
        <View style={styles.cardArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.matchesCard} onPress={onViewMatches}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Your Matches</Text>
          <Text style={styles.cardSubtitle}>3 new compatible connections</Text>
        </View>
        <View style={styles.notificationBadge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.insightsCard}>
        <Text style={styles.cardTitle}>Recent Insights</Text>
        <Text style={styles.insightText}>
          "Your authenticity score has increased by 8% this week, showing stronger self-awareness in your reflections."
        </Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={onSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
);

// Matches Screen
const MatchesScreen = ({ onBack, onStartChat }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>Anonymous Match</Text>
            <Text style={styles.compatibilityScore}>87% Compatible</Text>
          </View>
          <Text style={styles.matchDescription}>
            Based on your personality traits and reflection patterns, you share strong compatibility in authenticity and empathy.
          </Text>
          <TouchableOpacity style={styles.chatButton} onPress={onStartChat}>
            <Text style={styles.chatButtonText}>Start Anonymous Chat</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>Anonymous Match</Text>
            <Text style={styles.compatibilityScore}>82% Compatible</Text>
          </View>
          <Text style={styles.matchDescription}>
            Your curiosity and openness scores align well, suggesting meaningful conversations ahead.
          </Text>
          <TouchableOpacity style={styles.chatButton} onPress={onStartChat}>
            <Text style={styles.chatButtonText}>Start Anonymous Chat</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>Anonymous Match</Text>
            <Text style={styles.compatibilityScore}>78% Compatible</Text>
          </View>
          <Text style={styles.matchDescription}>
            Strong alignment in values and communication style, with complementary personality traits.
          </Text>
          <TouchableOpacity style={styles.chatButton} onPress={onStartChat}>
            <Text style={styles.chatButtonText}>Start Anonymous Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </SafeAreaView>
);

// Profile Screen
const ProfileScreen = ({ onBack }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>27</Text>
            <Text style={styles.statLabel}>Reflections</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
        
        <View style={styles.traitsSection}>
          <Text style={styles.sectionTitle}>Your Personality</Text>
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
        
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgeGrid}>
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
      </ScrollView>
    </View>
  </SafeAreaView>
);

// Main App Component
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState(Array(5).fill(''));

  const handleLogin = () => {
    setCurrentScreen('dashboard');
  };

  const handleStartReflection = () => {
    setCurrentScreen('reflection');
  };

  const handleNextQuestion = () => {
    if (questionIndex < 4) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setCurrentScreen('dashboard');
      setQuestionIndex(0);
      setResponses(Array(5).fill(''));
    }
  };

  const handleBackFromReflection = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const updateResponse = (text) => {
    const newResponses = [...responses];
    newResponses[questionIndex] = text;
    setResponses(newResponses);
  };

  const handleViewMatches = () => {
    setCurrentScreen('matches');
  };

  const handleViewProfile = () => {
    setCurrentScreen('profile');
  };

  const handleStartChat = () => {
    alert('Anonymous chat feature coming soon!');
  };

  const handleSignOut = () => {
    setCurrentScreen('auth');
    setEmail('');
    setPassword('');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return (
          <AuthScreen 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onLogin={handleLogin}
          />
        );
      
      case 'dashboard':
        return (
          <DashboardScreen 
            onStartReflection={handleStartReflection}
            onViewProfile={handleViewProfile}
            onViewMatches={handleViewMatches}
            onSignOut={handleSignOut}
          />
        );
      
      case 'reflection':
        return (
          <ReflectionScreen 
            currentQuestion={SAMPLE_QUESTIONS[questionIndex]}
            questionIndex={questionIndex}
            response={responses[questionIndex]}
            setResponse={updateResponse}
            onNext={handleNextQuestion}
            onBack={handleBackFromReflection}
            totalQuestions={5}
          />
        );
      
      case 'matches':
        return (
          <MatchesScreen 
            onBack={() => setCurrentScreen('dashboard')}
            onStartChat={handleStartChat}
          />
        );
      
      case 'profile':
        return (
          <ProfileScreen 
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      
      default:
        return null;
    }
  };

  return renderScreen();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Auth Screen Styles
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authContent: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  formContainer: {
    marginTop: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  primaryButton: {
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E1E5E9',
  },
  demoNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  
  // Screen Container
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  backButtonText: {
    fontSize: 20,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Progress Bar
  progressContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  
  // Content Area
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Reflection Screen
  questionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    marginTop: 32,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 32,
  },
  responseContainer: {
    flex: 1,
    marginBottom: 24,
  },
  responseInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 150,
  },
  characterCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  
  // Dashboard Screen
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 8,
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  
  // Cards
  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  streakIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 32,
  },
  
  reflectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  matchesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  cardArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  arrowText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  notificationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  insightsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  insightText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginTop: 8,
  },
  
  // Matches Screen
  matchCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  compatibilityScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  matchDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  chatButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Profile Screen
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  traitsSection: {
    marginBottom: 32,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  traitName: {
    fontSize: 16,
    color: '#000000',
    width: 100,
  },
  traitBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E1E5E9',
    borderRadius: 4,
    marginHorizontal: 16,
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
  
  badgesSection: {
    marginBottom: 32,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badge: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  
  // Logout
  logoutButton: {
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: '#666666',
  },
});