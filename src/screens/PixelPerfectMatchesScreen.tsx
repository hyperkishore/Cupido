import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { matchingService, Match, CompatibilityScore } from '../services/matchingService';
import { conversationMemoryService } from '../services/conversationMemoryService';
import { useAppMode } from '../contexts/AppModeContext';

export const PixelPerfectMatchesScreen = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversationMemory, setConversationMemory] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { mode } = useAppMode();

  // Demo matches for demo mode
  const demoMatches: Match[] = [
    {
      id: 'demo-1',
      profileId: 'demo-profile-1',
      compatibilityScore: {
        overall: 92,
        values: 88,
        personality: 95,
        lifestyle: 90,
        interests: 85,
        matchType: 'personality_twin' as const,
        strengths: ['Shared love for adventure', 'Similar communication style', 'Both value authenticity'],
        challenges: ['Different work schedules'],
      },
      profile: {
        id: 'demo-profile-1',
        name: 'Alex Chen',
        age: 28,
        location: 'San Francisco',
        bio: 'Coffee enthusiast, weekend hiker, and startup founder. Looking for someone who appreciates deep conversations and spontaneous adventures.',
        interests: ['Hiking', 'Coffee', 'Startups', 'Travel'],
        photos: [],
        personalityTraits: {
          openness: 85,
          conscientiousness: 75,
          extraversion: 65,
          agreeableness: 80,
          neuroticism: 30,
        },
      },
      matchedAt: new Date(),
      status: 'pending',
    },
    {
      id: 'demo-2',
      profileId: 'demo-profile-2',
      compatibilityScore: {
        overall: 87,
        values: 92,
        personality: 82,
        lifestyle: 88,
        interests: 86,
        matchType: 'complementary_growth' as const,
        strengths: ['Complementary personalities', 'Shared values', 'Growth mindset'],
        challenges: ['Different social preferences'],
      },
      profile: {
        id: 'demo-profile-2',
        name: 'Jordan Taylor',
        age: 30,
        location: 'Oakland',
        bio: 'Artist by day, chef by night. Seeking someone who finds joy in the simple things and isn\'t afraid to try new experiences.',
        interests: ['Art', 'Cooking', 'Jazz', 'Yoga'],
        photos: [],
        personalityTraits: {
          openness: 90,
          conscientiousness: 70,
          extraversion: 55,
          agreeableness: 85,
          neuroticism: 25,
        },
      },
      matchedAt: new Date(Date.now() - 86400000),
      status: 'pending',
    },
    {
      id: 'demo-3',
      profileId: 'demo-profile-3',
      compatibilityScore: {
        overall: 94,
        values: 96,
        personality: 91,
        lifestyle: 93,
        interests: 95,
        matchType: 'deep_alignment' as const,
        strengths: ['Deep value alignment', 'Similar life goals', 'Emotional compatibility'],
        challenges: ['Geographic distance'],
      },
      profile: {
        id: 'demo-profile-3',
        name: 'Morgan Rivera',
        age: 27,
        location: 'Berkeley',
        bio: 'Book lover, environmental advocate, and weekend farmer\'s market regular. Looking for genuine connection and shared growth.',
        interests: ['Reading', 'Environment', 'Gardening', 'Philosophy'],
        photos: [],
        personalityTraits: {
          openness: 88,
          conscientiousness: 82,
          extraversion: 60,
          agreeableness: 88,
          neuroticism: 28,
        },
      },
      matchedAt: new Date(Date.now() - 172800000),
      status: 'pending',
    },
  ];

  useEffect(() => {
    if (mode === 'demo') {
      // Use demo data
      setMatches(demoMatches);
      setLoading(false);
    } else {
      // Load real data
      loadData();
    }
  }, [mode]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Initialize services
      await matchingService.initialize();
      await conversationMemoryService.initialize();
      
      // Get user data
      const memory = await conversationMemoryService.getConversationMemory();
      const profile = await matchingService.getCurrentUserProfile();
      
      setConversationMemory(memory);
      setUserProfile(profile);
      
      // Get or generate matches
      if (memory && memory.totalConversations >= 5) {
        const existingMatches = await matchingService.getMatches();
        if (existingMatches.length < 3) {
          const newMatches = await matchingService.generateMatches(5);
          setMatches(newMatches);
        } else {
          setMatches(existingMatches);
        }
      }
    } catch (error) {
      console.error('Error loading matches data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMatchInteraction = async (match: Match, action: 'like' | 'pass') => {
    try {
      await matchingService.interactWithMatch(match.id, {
        type: action,
        data: { action }
      });

      // Update local state
      setMatches(prev => prev.map(m => 
        m.id === match.id 
          ? { ...m, status: action === 'like' ? 'liked' : 'passed' }
          : m
      ));

      if (action === 'like') {
        Alert.alert(
          'Match Liked! 💙',
          'Great choice! We\'ll let you know if they like you back.'
        );
      }
    } catch (error) {
      console.error('Error interacting with match:', error);
    }
  };

  const getMatchTypeEmoji = (matchType: CompatibilityScore['matchType']): string => {
    switch (matchType) {
      case 'personality_twin': return '🪞';
      case 'complementary_growth': return '🌱';
      case 'deep_alignment': return '💫';
      case 'balanced_connection': return '⚖️';
      default: return '💙';
    }
  };

  const getMatchTypeDescription = (matchType: CompatibilityScore['matchType']): string => {
    switch (matchType) {
      case 'personality_twin': return 'Personality Twin';
      case 'complementary_growth': return 'Growth Partner';
      case 'deep_alignment': return 'Deep Connection';
      case 'balanced_connection': return 'Balanced Match';
      default: return 'Great Match';
    }
  };

  const renderMatch = (match: Match) => {
    const { compatibilityScore } = match;
    
    return (
      <View key={match.id} style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.matchTitleContainer}>
            <Text style={styles.matchEmoji}>
              {getMatchTypeEmoji(compatibilityScore.matchType)}
            </Text>
            <View>
              <Text style={styles.matchTitle}>
                {getMatchTypeDescription(compatibilityScore.matchType)}
              </Text>
              <Text style={styles.compatibilityText}>
                {compatibilityScore.overallScore || compatibilityScore.overall}% Compatible
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Personality Match</Text>
            <Text style={[
              styles.statValue,
              (compatibilityScore.breakdown?.personalityMatch || compatibilityScore.personality || 0) > 70 ? styles.statValueGreen : styles.statValueGray
            ]}>
              {Math.round(compatibilityScore.breakdown?.personalityMatch || compatibilityScore.personality || 0)}%
            </Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Values Alignment</Text>
            <Text style={[
              styles.statValue,
              (compatibilityScore.breakdown?.valuesAlignment || compatibilityScore.values || 0) > 70 ? styles.statValueGreen : styles.statValueGray
            ]}>
              {Math.round(compatibilityScore.breakdown?.valuesAlignment || compatibilityScore.values || 0)}%
            </Text>
          </View>
        </View>

        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>Why we think you'll connect:</Text>
          {(compatibilityScore.reasoning || compatibilityScore.strengths || []).slice(0, 2).map((reason, index) => (
            <Text key={index} style={styles.interestsText}>
              • {reason}
            </Text>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.passButton}
            onPress={() => handleMatchInteraction(match, 'pass')}
          >
            <Text style={styles.passButtonText}>Pass</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleMatchInteraction(match, 'like')}
          >
            <Text style={styles.likeButtonText}>Like</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Check if user has enough data for matches
  const hasEnoughData = conversationMemory && conversationMemory.totalConversations >= 5;
  const totalPoints = userProfile?.personalityProfile?.authenticityScore || 0;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.spacer} />
      </View>

      {/* Progress Card */}
      <View style={styles.unlockCard}>
        <Text style={styles.unlockTitle}>
          {hasEnoughData ? 'Finding Your Matches' : 'Unlock Matching'}
        </Text>
        <Text style={styles.unlockDescription}>
          {hasEnoughData 
            ? 'Based on your authentic responses and personality insights'
            : 'Complete more reflections to unlock personality-based matching'
          }
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill, 
              { width: `${Math.min(100, (conversationMemory?.totalConversations || 0) * 20)}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {conversationMemory?.totalConversations || 0}/5 reflections
          </Text>
        </View>
      </View>

      {/* Matches or Empty State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing compatibility...</Text>
        </View>
      ) : !hasEnoughData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Complete More Reflections</Text>
          <Text style={styles.emptyText}>
            We need at least 5 meaningful conversations to understand your personality and find compatible matches.
          </Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptyText}>
            Keep reflecting to help us find better matches for you. We're analyzing personality compatibility based on your authentic responses.
          </Text>
        </View>
      ) : (
        matches
          .filter(match => match.status === 'suggested')
          .map(renderMatch)
      )}

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
  spacer: {
    width: 24,
  },
  unlockCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
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
    width: '50%',
    height: '100%',
    backgroundColor: '#FF9500',
  },
  progressText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
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
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  compatibilityText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statColumn: {
    flex: 1,
  },
  statLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
  },
  statValueGreen: {
    fontSize: 28,
    fontWeight: '600',
    color: '#34C759',
  },
  statValueGray: {
    fontSize: 28,
    fontWeight: '600',
    color: '#8E8E93',
  },
  matchEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  matchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestsSection: {
    marginBottom: 24,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  passButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  passButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  likeButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  likeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    textAlign: 'center',
  },
  lockedContainer: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  bottomPadding: {
    height: 120,
  },
});