import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useAppState } from '../contexts/AppStateContext';

interface Match {
  id: string;
  profileMatch: number;
  socialAlignment: number;
  overallCompatibility: number;
  sharedInterests: string;
  isLocked: boolean;
  pointsNeeded?: number;
  personalityTraits: string[];
  connectionStrength: 'high' | 'medium' | 'low';
}

export const FunctionalMatchesScreen = () => {
  const { state, dispatch } = useAppState();
  const [matches] = useState<Match[]>([
    {
      id: '1',
      profileMatch: 87,
      socialAlignment: 0,
      overallCompatibility: 44,
      sharedInterests: "Shares professional ambition and creative interests. Strong alignment in career goals and lifestyle preferences.",
      isLocked: true,
      pointsNeeded: 50,
      personalityTraits: ['Authentic', 'Creative', 'Ambitious'],
      connectionStrength: 'medium',
    },
    {
      id: '2',
      profileMatch: 92,
      socialAlignment: 76,
      overallCompatibility: 84,
      sharedInterests: "Deep connection through shared values about authenticity and vulnerability. Similar communication styles.",
      isLocked: true,
      pointsNeeded: 50,
      personalityTraits: ['Empathetic', 'Vulnerable', 'Thoughtful'],
      connectionStrength: 'high',
    },
    {
      id: '3',
      profileMatch: 78,
      socialAlignment: 82,
      overallCompatibility: 80,
      sharedInterests: "Both value personal growth and continuous learning. Aligned on relationship goals and life philosophy.",
      isLocked: true,
      pointsNeeded: 50,
      personalityTraits: ['Growth-minded', 'Curious', 'Philosophical'],
      connectionStrength: 'high',
    },
  ]);

  const [progressAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    // Animate progress bar
    const progressPercentage = (state.userStats.totalPoints / 50) * 100;
    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Pulse animation for unlock card
    if (state.userStats.totalPoints < 50) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [state.userStats.totalPoints]);

  const handleUnlockProgress = () => {
    const pointsNeeded = 50 - state.userStats.totalPoints;
    if (pointsNeeded <= 0) {
      Alert.alert(
        'Unlocked! 🎉',
        'You now have access to 1-1 anonymous chats with your matches!',
        [{ text: 'Start Chatting', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Keep Going!',
        `You need ${pointsNeeded} more points to unlock 1-1 chats.\n\nComplete more daily reflections and receive hearts on your responses to earn points faster!`,
        [
          { text: 'Continue Reflecting', style: 'default' },
          { text: 'View Tips', style: 'cancel', onPress: showTips },
        ]
      );
    }
  };

  const showTips = () => {
    Alert.alert(
      'Earning Points Tips',
      '• Complete daily reflections: +5 points each\n• Receive hearts on responses: +1 point each\n• Complete full reflection sessions: +6 bonus points\n• Maintain streaks: +2 bonus points\n\nAuthentic, thoughtful responses get more hearts!',
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const handleMatchInteraction = (match: Match) => {
    if (match.isLocked) {
      const pointsNeeded = match.pointsNeeded || 50;
      Alert.alert(
        'Match Locked',
        `This match requires ${pointsNeeded} points to unlock.\n\nCurrent points: ${state.userStats.totalPoints}\nNeeded: ${pointsNeeded - state.userStats.totalPoints} more`,
        [
          { text: 'Earn More Points', style: 'default' },
          { text: 'View Match Preview', style: 'cancel', onPress: () => showMatchPreview(match) },
        ]
      );
    } else {
      // Would navigate to chat
      Alert.alert(
        'Start Chat?',
        `Begin an anonymous conversation with this ${match.overallCompatibility}% compatible match?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Chat', onPress: () => startChat(match) },
        ]
      );
    }
  };

  const showMatchPreview = (match: Match) => {
    Alert.alert(
      'Match Preview',
      `Compatibility: ${match.overallCompatibility}%\n\nShared traits: ${match.personalityTraits.join(', ')}\n\nConnection strength: ${match.connectionStrength}\n\nUnlock to start chatting!`,
      [{ text: 'Close', style: 'default' }]
    );
  };

  const startChat = (match: Match) => {
    // Would implement actual chat navigation
    Alert.alert(
      'Chat Started!',
      'Your anonymous conversation has begun. Remember, authenticity leads to the best connections.',
      [{ text: 'Continue', style: 'default' }]
    );
  };

  const renderMatch = (match: Match) => (
    <TouchableOpacity 
      key={match.id} 
      style={styles.matchCard}
      onPress={() => handleMatchInteraction(match)}
      activeOpacity={0.8}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.matchTitle}>Anonymous Match</Text>
        <View style={styles.compatibilityContainer}>
          <Text style={[
            styles.compatibilityText,
            { color: match.overallCompatibility > 80 ? '#34C759' : match.overallCompatibility > 60 ? '#FF9500' : '#8E8E93' }
          ]}>
            {match.overallCompatibility}% Compatible
          </Text>
          {match.connectionStrength === 'high' && (
            <Text style={styles.connectionBadge}>🔥</Text>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Profile Match</Text>
          <Text style={styles.statValueGreen}>{match.profileMatch}%</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Social Alignment</Text>
          <Text style={[
            styles.statValueGreen,
            { color: match.socialAlignment > 0 ? '#34C759' : '#8E8E93' }
          ]}>
            {match.socialAlignment}%
          </Text>
        </View>
      </View>

      <View style={styles.interestsSection}>
        <Text style={styles.interestsTitle}>Shared Interests From:</Text>
        <Text style={styles.interestsText}>{match.sharedInterests}</Text>
      </View>

      <View style={styles.traitsContainer}>
        {match.personalityTraits.map((trait, index) => (
          <View key={index} style={styles.traitTag}>
            <Text style={styles.traitText}>{trait}</Text>
          </View>
        ))}
      </View>

      {match.isLocked ? (
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedText}>
            Locked - Need {match.pointsNeeded} points
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => startChat(match)}
        >
          <Text style={styles.chatButtonText}>Start Anonymous Chat</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const progressPercentage = Math.min((state.userStats.totalPoints / 50) * 100, 100);
  const isUnlocked = state.userStats.totalPoints >= 50;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <TouchableOpacity onPress={showTips}>
          <Text style={styles.helpIcon}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Unlock Progress Card */}
      <Animated.View style={[
        styles.unlockCard,
        { transform: [{ scale: pulseAnimation }] },
        isUnlocked && styles.unlockCardComplete
      ]}>
        <TouchableOpacity onPress={handleUnlockProgress} activeOpacity={0.8}>
          <Text style={[styles.unlockTitle, isUnlocked && styles.unlockTitleComplete]}>
            {isUnlocked ? 'Chats Unlocked! 🎉' : 'Unlock 1-1 Chats'}
          </Text>
          <Text style={styles.unlockDescription}>
            {isUnlocked 
              ? 'You can now start anonymous conversations with your matches!'
              : 'Complete more reflections and receive hearts on your responses to unlock anonymous 1-1 chats.'
            }
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                  backgroundColor: isUnlocked ? '#34C759' : '#FF9500',
                }
              ]} />
            </View>
            <Text style={styles.progressText}>
              {state.userStats.totalPoints}/50 points
              {!isUnlocked && ` (${50 - state.userStats.totalPoints} needed)`}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Matches List */}
      <View style={styles.matchesHeader}>
        <Text style={styles.matchesTitle}>
          {matches.length} Potential Matches
        </Text>
        <Text style={styles.matchesSubtitle}>
          Based on your reflection responses
        </Text>
      </View>

      {matches.map(renderMatch)}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backIcon: {
    fontSize: 24,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  helpIcon: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    width: 24,
    height: 24,
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  unlockCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  unlockCardComplete: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  unlockTitleComplete: {
    color: '#34C759',
  },
  unlockDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  matchesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  matchesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  matchesSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  compatibilityContainer: {
    alignItems: 'flex-end',
  },
  compatibilityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  connectionBadge: {
    fontSize: 14,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statColumn: {
    flex: 1,
  },
  statLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 28,
    fontWeight: '600',
    color: '#34C759',
  },
  interestsSection: {
    marginBottom: 16,
  },
  interestsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  interestsText: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  traitTag: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  traitText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  lockedContainer: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  lockedIcon: {
    fontSize: 16,
  },
  lockedText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  chatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
  },
});