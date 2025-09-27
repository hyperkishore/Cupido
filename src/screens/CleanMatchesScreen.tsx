import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../contexts/AppStateContext';
import { personalityGraphService } from '../services/personalityGraphService';

interface Match {
  id: string;
  compatibility: number;
  profileMatch: number;
  socialAlignment: number;
  sharedInterests: string;
  isLocked: boolean;
  pointsNeeded?: number;
}

export const CleanMatchesScreen = () => {
  const { user } = useAuth();
  const { state } = useAppState();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPoints, setUserPoints] = useState(25);
  const maxPoints = 50;

  useEffect(() => {
    loadMatches();
    // Calculate points from user's reflections
    const points = Math.min(state.answers.length * 5, maxPoints);
    setUserPoints(points);
  }, [state.answers]);

  const loadMatches = async () => {
    // In production, this would fetch real matches
    // For now, we'll create demo matches
    const demoMatches: Match[] = [
      {
        id: '1',
        compatibility: 44,
        profileMatch: 87,
        socialAlignment: 0,
        sharedInterests: 'Shares professional ambition and creative interests. Strong alignment in career goals and lifestyle preferences.',
        isLocked: userPoints < 50,
        pointsNeeded: 50,
      },
      {
        id: '2',
        compatibility: 78,
        profileMatch: 92,
        socialAlignment: 65,
        sharedInterests: 'Common values around authenticity and personal growth. Both value deep connections and meaningful conversations.',
        isLocked: userPoints < 75,
        pointsNeeded: 75,
      },
      {
        id: '3',
        compatibility: 62,
        profileMatch: 71,
        socialAlignment: 54,
        sharedInterests: 'Similar interests in mindfulness and wellness. Both enjoy outdoor activities and creative pursuits.',
        isLocked: userPoints < 100,
        pointsNeeded: 100,
      },
    ];
    
    setMatches(demoMatches);
  };

  const handleUnlockChat = (match: Match) => {
    if (match.isLocked) {
      Alert.alert(
        'Unlock Chat',
        `You need ${match.pointsNeeded} points to unlock this match. Complete more reflections to earn points!`,
        [{ text: 'OK' }]
      );
    } else {
      // Navigate to chat
      Alert.alert('Chat Unlocked', 'You can now chat with this match!');
    }
  };

  const progressPercentage = (userPoints / maxPoints) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Matches</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Unlock Progress Card */}
        <View style={styles.unlockCard}>
          <Text style={styles.unlockTitle}>Unlock 1-1 Chats</Text>
          <Text style={styles.unlockDescription}>
            Complete more reflections and receive hearts on your responses to unlock anonymous 1-1 chats.
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{userPoints}/{maxPoints} points</Text>
          </View>
        </View>

        {/* Matches List */}
        {matches.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchCard}
            onPress={() => handleUnlockChat(match)}
            activeOpacity={0.8}
          >
            <View style={styles.matchHeader}>
              <Text style={styles.matchTitle}>Anonymous Match</Text>
              <Text style={[
                styles.compatibilityText,
                { color: match.compatibility > 70 ? '#34C759' : '#007AFF' }
              ]}>
                {match.compatibility}% Compatible
              </Text>
            </View>

            <View style={styles.matchStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Profile Match</Text>
                <Text style={styles.statValue}>{match.profileMatch}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Social Alignment</Text>
                <Text style={styles.statValue}>{match.socialAlignment}%</Text>
              </View>
            </View>

            <View style={styles.sharedInterestsSection}>
              <Text style={styles.sharedInterestsTitle}>Shared Interests From:</Text>
              <Text style={styles.sharedInterestsText}>{match.sharedInterests}</Text>
            </View>

            {match.isLocked && (
              <View style={styles.lockedOverlay}>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedText}>
                    Locked - Need {match.pointsNeeded} points
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Find More Matches Button */}
        <TouchableOpacity style={styles.findMoreButton}>
          <Feather name="search" size={20} color="#007AFF" />
          <Text style={styles.findMoreText}>Find More Matches</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  unlockCard: {
    backgroundColor: '#FFF9E6',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4A1',
  },
  unlockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  unlockDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  matchCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  matchHeader: {
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  compatibilityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  matchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34C759',
  },
  sharedInterestsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sharedInterestsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sharedInterestsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lockedText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  findMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  findMoreText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});