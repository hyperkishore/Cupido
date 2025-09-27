// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Animated,
} from 'react-native';
import { useAppState } from '../contexts/AppStateContext';

export const FunctionalProfileScreen = () => {
  const { state, dispatch } = useAppState();
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const personalityTraits = [
    { name: 'Authenticity', percentage: 92, color: '#34C759' },
    { name: 'Empathy', percentage: 88, color: '#007AFF' },
    { name: 'Curiosity', percentage: 85, color: '#FF9500' },
    { name: 'Openness', percentage: 79, color: '#AF52DE' },
  ];

  const achievements = [
    { name: 'First Steps', description: 'Completed your first reflection', unlocked: true },
    { name: 'Week Warrior', description: '7-day reflection streak', unlocked: true },
    { name: 'Voice Pioneer', description: 'Used voice recording feature', unlocked: true },
    { name: 'Authentic Soul', description: 'Received 50+ hearts', unlocked: false },
    { name: 'Deep Thinker', description: 'Wrote 1000+ words in reflections', unlocked: false },
    { name: 'Community Helper', description: 'Asked 5 community questions', unlocked: false },
  ];

  const handleAuthenticityScore = () => {
    Alert.alert(
      'Authenticity Score',
      `Your score of ${state.userStats.authenticityScore}% is calculated based on:\n\n📝 Response depth and honesty\n❤️ Community engagement\n🔄 Consistency over time\n🎯 Self-reflection quality\n\nHigher scores lead to better matches!`,
      [
        { text: 'Learn More', onPress: showAuthenticityTips },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const showAuthenticityTips = () => {
    Alert.alert(
      'Improving Your Score',
      '✨ Tips to increase authenticity:\n\n• Be honest in your reflections\n• Share personal experiences\n• Engage with others\' responses\n• Complete daily reflections\n• Use voice recordings when comfortable\n\nAuthenticity attracts authentic people!',
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const handleSocialConnections = () => {
    const unlockedConnections = Math.floor(state.userStats.totalPoints / 10);
    Alert.alert(
      'Social Connections',
      `You've unlocked ${unlockedConnections}/105 potential connections.\n\nEarn more points through reflections to discover people who share your values and interests.`,
      [
        { text: 'Find More', style: 'default' },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const handlePersonalityInsight = (trait: any) => {
    const insights = {
      'Authenticity': 'You consistently share genuine thoughts and feelings. Others appreciate your honesty.',
      'Empathy': 'You show deep understanding of others\' perspectives and emotions.',
      'Curiosity': 'You ask thoughtful questions and seek to understand the world around you.',
      'Openness': 'You\'re receptive to new experiences and different viewpoints.',
    };

    Alert.alert(
      `${trait.name}: ${trait.percentage}%`,
      insights[trait.name] || 'This trait shows how you connect with others.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleAchievement = (achievement: any) => {
    if (achievement.unlocked) {
      Alert.alert(
        `🏆 ${achievement.name}`,
        `${achievement.description}\n\nUnlocked! Great work on your growth journey.`,
        [{ text: 'Nice!', style: 'default' }]
      );
    } else {
      Alert.alert(
        `🔒 ${achievement.name}`,
        `${achievement.description}\n\nKeep going to unlock this achievement!`,
        [{ text: 'Got it!', style: 'default' }]
      );
    }
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress?',
      'This will delete all your reflections, matches, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_STATE' });
            Alert.alert('Reset Complete', 'Your progress has been reset.');
          }
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your reflection data and insights will be prepared for download. This helps you keep your personal growth journey.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          Alert.alert('Export Started', 'Your data export will be ready shortly.');
        }},
      ]
    );
  };

  // Pulse animation for points needed
  React.useEffect(() => {
    if (state.userStats.totalPoints < 50) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [state.userStats.totalPoints]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Authenticity Score Section */}
      <TouchableOpacity style={styles.authenticitySection} onPress={handleAuthenticityScore}>
        <Text style={styles.authenticityScore}>{state.userStats.authenticityScore}%</Text>
        <Text style={styles.authenticityLabel}>Authenticity Score</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{state.userStats.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{state.userStats.responses}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{state.userStats.connected}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Points Progress Section */}
      <Animated.View style={[
        styles.pointsSection,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <TouchableOpacity onPress={() => Alert.alert('Points System', 'Earn points by completing reflections and receiving hearts on your responses!')}>
          <View style={styles.pointsInfo}>
            <View style={styles.orangeDot} />
            <Text style={styles.pointsText}>
              {Math.max(0, 50 - state.userStats.totalPoints)} points to unlock chats
            </Text>
          </View>
          <Text style={styles.pointsDescription}>
            Continue sharing authentic responses to unlock 1-1 anonymous chats
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Social Connections Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Connections</Text>
        <TouchableOpacity style={styles.socialCard} onPress={handleSocialConnections}>
          <Text style={styles.socialScore}>
            {Math.floor(state.userStats.totalPoints / 10)}/105
          </Text>
          <Text style={styles.socialLabel}>Compatibility Score</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Personality Insights Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personality Insights</Text>
        <View style={styles.personalityGrid}>
          {personalityTraits.map((trait, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.traitItem}
              onPress={() => handlePersonalityInsight(trait)}
            >
              <Text style={[styles.traitPercentage, { color: trait.color }]}>
                {trait.percentage}%
              </Text>
              <Text style={styles.traitName}>{trait.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          {achievements.map((achievement, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.achievementItem}
              onPress={() => handleAchievement(achievement)}
            >
              <Text style={styles.achievementBullet}>
                {achievement.unlocked ? '🏆' : '🔒'}
              </Text>
              <Text style={[
                styles.achievementName,
                !achievement.unlocked && styles.achievementNameLocked
              ]}>
                {achievement.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.settingsHeader}
          onPress={handleSettings}
        >
          <Text style={styles.sectionTitle}>Settings</Text>
          <Text style={styles.chevron}>{showSettings ? '−' : '+'}</Text>
        </TouchableOpacity>
        
        {showSettings && (
          <View style={styles.settingsContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Anonymous Mode</Text>
              <Switch 
                value={anonymousMode} 
                onValueChange={setAnonymousMode}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Data Sharing</Text>
              <Switch 
                value={dataSharing} 
                onValueChange={setDataSharing}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <TouchableOpacity style={styles.settingButton} onPress={handleExportData}>
              <Text style={styles.settingButtonText}>Export My Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingButton, styles.dangerButton]} 
              onPress={handleResetProgress}
            >
              <Text style={[styles.settingButtonText, styles.dangerButtonText]}>
                Reset All Progress
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  authenticitySection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  authenticityScore: {
    fontSize: 80,
    fontWeight: '300',
    color: '#000000',
    lineHeight: 80,
  },
  authenticityLabel: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 32,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  pointsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
  pointsText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  pointsDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 12,
  },
  socialScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34C759',
  },
  socialLabel: {
    fontSize: 17,
    color: '#8E8E93',
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  traitItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
  },
  traitPercentage: {
    fontSize: 48,
    fontWeight: '300',
    marginBottom: 4,
  },
  traitName: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  achievementBullet: {
    fontSize: 17,
  },
  achievementName: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
  },
  achievementNameLocked: {
    color: '#8E8E93',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsContent: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  settingLabel: {
    fontSize: 17,
    color: '#000000',
  },
  settingButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
  },
});