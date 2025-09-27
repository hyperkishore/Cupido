import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../contexts/AppStateContext';
import { homeExperienceService, HomeExperienceData } from '../services/homeExperienceService';
import { FeedbackWrapper } from '../components/FeedbackWrapper';
import { SAMPLE_COMMUNITY_REFLECTIONS, SAMPLE_USER_REFLECTIONS } from '../data/sampleReflections';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { personalityGraphService } from '../services/personalityGraphService';

const capitalizeTag = (tag: string) => tag.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const PixelPerfectHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { state } = useAppState();
  const { user } = useAuth();
  const [homeData, setHomeData] = useState<HomeExperienceData | null>(() => {
    if (SAMPLE_USER_REFLECTIONS.length === 0) {
      return null;
    }

    const latest = SAMPLE_USER_REFLECTIONS[0];
    const trendingTags = Array.from(
      SAMPLE_USER_REFLECTIONS.reduce((acc, reflection) => {
        (reflection.category ? [reflection.category] : []).forEach((tag) => {
          acc.set(tag, (acc.get(tag) ?? 0) + 1);
        });
        return acc;
      }, new Map<string, number>())
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      stats: {
        currentStreak: 12,
        longestStreak: 12,
        totalReflections: SAMPLE_USER_REFLECTIONS.length,
        authenticityScore: 82,
        lastReflectionDate: latest?.timestamp ?? new Date().toISOString(),
      },
      trendingTags,
      latestReflection: latest
        ? {
            id: latest.id,
            question: latest.questionText,
            summary: latest.text,
            createdAt: latest.timestamp,
            mood: undefined,
            insights: [],
            tags: [],
          }
        : undefined,
      recommendedPrompts: SAMPLE_USER_REFLECTIONS.slice(0, 3).map((reflection) => ({
        id: reflection.questionId,
        question: reflection.questionText,
        category: reflection.category,
      })),
      communitySpotlight: SAMPLE_COMMUNITY_REFLECTIONS.slice(0, 3).map((reflection) => ({
        id: reflection.id,
        authorId: reflection.authorId,
        authorName: reflection.authorName,
        isAnonymous: reflection.isAnonymous,
        question: reflection.question,
        answer: reflection.answer,
        mood: reflection.mood,
        tags: reflection.tags,
        createdAt: reflection.createdAt,
        communityHearts: reflection.communityHearts,
        hasUserLiked: reflection.hasUserLiked,
        visibility: reflection.visibility,
      })),
      dailyIntention: 'Take a moment to notice one small win and let it land before the day moves on.',
    } satisfies HomeExperienceData;
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState<Record<string, boolean>>({});
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>({
    linkedin: false,
    youtube: false,
    calendar: false,
  });

  const refreshHomeData = async () => {
    setError(null);
    try {
      const data = await homeExperienceService.load();
      setHomeData(data);
    } catch (err) {
      console.error('Failed to hydrate home experience', err);
      setError('Unable to load home data right now.');
    }
  };

  useEffect(() => {
    setLoading(true);
    refreshHomeData().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answers.length]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refreshHomeData().finally(() => setRefreshing(false));
  }, []);

  const handleStartReflection = () => {
    navigation.navigate('Reflect');
  };

  const handlePromptPress = (prompt: HomeExperienceData['recommendedPrompts'][number]) => {
    navigation.navigate('Reflect', {
      suggestedPrompt: {
        id: prompt.id,
        question: prompt.question,
        category: prompt.category,
      },
    });
  };

  const handleLikeCommunity = async (reflectionId: string) => {
    if (!homeData) return;

    const targetReflection = homeData.communitySpotlight.find((item) => item.id === reflectionId);
    if (!targetReflection) return;

    const previousState = homeData;
    const nextLikeState = !targetReflection.hasUserLiked;
    const nextHeartCount = Math.max(
      0,
      targetReflection.communityHearts + (nextLikeState ? 1 : -1)
    );

    setLiking((prev) => ({ ...prev, [reflectionId]: true }));
    setHomeData((prev) =>
      prev
        ? {
            ...prev,
            communitySpotlight: prev.communitySpotlight.map((item) =>
              item.id === reflectionId
                ? {
                    ...item,
                    hasUserLiked: nextLikeState,
                    communityHearts: nextHeartCount,
                  }
                : item
            ),
          }
        : prev
    );

    try {
      if (nextLikeState) {
        await personalityGraphService.recordLike({
          id: reflectionId,
          type: 'reflection',
          tags: targetReflection.tags,
          mood: targetReflection.mood || undefined,
          question: targetReflection.question,
          answer: targetReflection.answer,
        });
      }

      await homeExperienceService.toggleLikeCommunityReflection(reflectionId);
      const updatedData = await homeExperienceService.load();
      setHomeData(updatedData);
    } catch (err) {
      console.error('Failed to toggle like on community reflection', err);
      setHomeData(previousState);
      Alert.alert('Not sent', 'Please try again in a moment.');
    } finally {
      setLiking((prev) => ({ ...prev, [reflectionId]: false }));
    }
  };

  const handleReflectFromCommunity = (reflection: HomeExperienceData['communitySpotlight'][number]) => {
    navigation.navigate('Reflect', {
      suggestedPrompt: {
        id: `community-${reflection.id}`,
        question: reflection.question,
        category: '',
      },
    });
  };

  const handleIntegrationPress = (key: string) => {
    Alert.alert(
      `Connect ${key.charAt(0).toUpperCase() + key.slice(1)}`,
      'This integration will be available soon.',
      [{ text: 'OK' }]
    );
    setConnectedIntegrations((prev) => ({ ...prev, [key]: true }));
  };

  const trendingTags = useMemo(() => {
    if (!homeData?.trendingTags) return [];
    return homeData.trendingTags.map(capitalizeTag);
  }, [homeData]);

  const connectors = [
    {
      key: 'linkedin' as const,
      icon: 'linkedin' as const,
      title: 'LinkedIn',
      subtitle: 'Connect professional energy',
      accent: '#0A66C2',
      background: '#E8F1FB',
    },
    {
      key: 'youtube' as const,
      icon: 'play-circle' as const,
      title: 'YouTube',
      subtitle: 'Share your playlists',
      accent: '#FF3B30',
      background: '#FFECEC',
    },
    {
      key: 'calendar' as const,
      icon: 'calendar' as const,
      title: 'Calendar',
      subtitle: 'Schedule reflection time',
      accent: '#5856D6',
      background: '#EEEDFF',
    },
  ];

  if (error && !homeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>We hit a snag</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!homeData) {
    return null;
  }

  // Mix community reflections, connector cards, and prompts for better distribution
  const feedItems: any[] = [];
  let communityIndex = 0;
  let promptIndex = 0;
  let connectorIndex = 0;

  // Create a mixed feed
  for (let i = 0; i < 12; i++) {
    if (i % 4 === 0 && communityIndex < homeData.communitySpotlight.length) {
      feedItems.push({ type: 'community', data: homeData.communitySpotlight[communityIndex] });
      communityIndex++;
    } else if (i % 4 === 1 && connectorIndex < connectors.length) {
      feedItems.push({ type: 'connector', data: connectors[connectorIndex] });
      connectorIndex++;
    } else if (i % 4 === 2 && promptIndex < homeData.recommendedPrompts.length) {
      feedItems.push({ type: 'prompt', data: homeData.recommendedPrompts[promptIndex] });
      promptIndex++;
    } else if (communityIndex < homeData.communitySpotlight.length) {
      feedItems.push({ type: 'community', data: homeData.communitySpotlight[communityIndex] });
      communityIndex++;
    }
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
        />
      }
    >
      <FeedbackWrapper componentId="home-progress" componentType="HomeStats" screenName="HomeScreen">
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>Daily ritual</Text>
              <Text style={styles.sectionTitle}>You are building consistency</Text>
            </View>
            <TouchableOpacity style={styles.reflectButton} onPress={handleStartReflection}>
              <Text style={styles.reflectButtonText}>Reflect now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{homeData.stats.currentStreak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{homeData.stats.totalReflections}</Text>
              <Text style={styles.statLabel}>reflections</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{homeData.stats.authenticityScore}</Text>
              <Text style={styles.statLabel}>authenticity</Text>
            </View>
          </View>
        </View>
      </FeedbackWrapper>

      {homeData.latestReflection && (
        <FeedbackWrapper componentId="home-latest-reflection" componentType="LatestReflection" screenName="HomeScreen">
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Your latest reflection</Text>
            <View style={styles.cardSurface}>
              <Text style={styles.cardQuestion}>{homeData.latestReflection.question}</Text>
              <Text style={styles.cardSummary}>{homeData.latestReflection.summary}</Text>
            </View>
          </View>
        </FeedbackWrapper>
      )}

      <FeedbackWrapper componentId="home-feed" componentType="MixedFeed" screenName="HomeScreen">
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Community feed</Text>
          {feedItems.map((item, index) => {
            if (item.type === 'community') {
              const reflection = item.data;
              return (
                <Pressable
                  key={`community-${reflection.id}`}
                  onLongPress={() => handleReflectFromCommunity(reflection)}
                  delayLongPress={280}
                  style={styles.communityCard}
                >
                  <View style={styles.communityHeader}>
                    <Text style={styles.communityAuthor}>
                      {reflection.isAnonymous ? 'Anonymous' : reflection.authorName}
                    </Text>
                  </View>
                  <Text style={styles.communityQuestion}>{reflection.question}</Text>
                  <Text style={styles.communityAnswer}>{reflection.answer}</Text>
                  {reflection.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {reflection.tags.slice(0, 3).map((tag, tagIndex) => (
                        <View key={`${reflection.id}-tag-${tagIndex}`} style={styles.microTag}>
                          <Text style={styles.microTagText}>{capitalizeTag(tag)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.communityFooter}>
                    <TouchableOpacity
                      style={[
                        styles.heartPill,
                        reflection.hasUserLiked && styles.heartPillActive,
                        liking[reflection.id] && styles.heartPillDisabled,
                      ]}
                      onPress={() => handleLikeCommunity(reflection.id)}
                      disabled={liking[reflection.id]}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name="heart"
                        size={16}
                        color={reflection.hasUserLiked ? '#FF3B30' : '#8E8E93'}
                      />
                      <Text
                        style={[
                          styles.heartCount,
                          reflection.hasUserLiked && styles.heartCountActive,
                        ]}
                      >
                        {reflection.communityHearts}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.communityHint}>Long press to reflect with this prompt</Text>
                  </View>
                </Pressable>
              );
            } else if (item.type === 'connector') {
              const connector = item.data;
              const isConnected = connectedIntegrations[connector.key];
              return (
                <Pressable
                  key={`connector-${connector.key}`}
                  onPress={() => handleIntegrationPress(connector.key)}
                  style={[styles.connectorCardCompact, { backgroundColor: connector.background }]}
                >
                  <Feather name={connector.icon} size={20} color={connector.accent} />
                  <View style={styles.connectorTextCompact}>
                    <Text style={styles.connectorTitleCompact}>{connector.title}</Text>
                    <Text style={styles.connectorSubtitleCompact}>{connector.subtitle}</Text>
                  </View>
                  <View style={[styles.connectorStatus, isConnected && styles.connectorStatusConnected]}>
                    <Text style={styles.connectorStatusText}>
                      {isConnected ? '✓' : '+'}
                    </Text>
                  </View>
                </Pressable>
              );
            } else if (item.type === 'prompt') {
              const prompt = item.data;
              return (
                <TouchableOpacity
                  key={`prompt-${prompt.id}`}
                  onPress={() => handlePromptPress(prompt)}
                  activeOpacity={0.85}
                  style={styles.promptCardCompact}
                >
                  <Text style={styles.promptCategoryCompact}>{prompt.category}</Text>
                  <Text style={styles.promptQuestionCompact}>{prompt.question}</Text>
                </TouchableOpacity>
              );
            }
            return null;
          })}
        </View>
      </FeedbackWrapper>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  reflectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  reflectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  cardSurface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  communityCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  heartButton: {
    padding: 4,
  },
  communityQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  communityAnswer: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 12,
  },
  communityFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heartPillActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.16)',
  },
  heartPillDisabled: {
    opacity: 0.6,
  },
  heartCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  heartCountActive: {
    color: '#FF3B30',
  },
  communityHint: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  microTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  microTagText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  connectorCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  connectorTextCompact: {
    flex: 1,
    marginLeft: 12,
  },
  connectorTitleCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  connectorSubtitleCompact: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  connectorStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorStatusConnected: {
    backgroundColor: '#34C759',
  },
  connectorStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  promptCardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  promptCategoryCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  promptQuestionCompact: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 18,
  },
});
