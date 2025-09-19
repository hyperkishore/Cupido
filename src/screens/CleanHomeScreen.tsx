import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useAppState } from '../contexts/AppStateContext';
import { theme } from '../design-system/tokens';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = theme.spacing.lg;
const CARD_WIDTH = screenWidth - (CARD_MARGIN * 2);

export const CleanHomeScreen = () => {
  const { state, dispatch } = useAppState();
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(true);
  const [showCommunityPrompt, setShowCommunityPrompt] = useState(true);
  const [likeAnimations, setLikeAnimations] = useState<{[key: string]: { scale: Animated.Value; opacity: Animated.Value }}>({});

  const initializeLikeAnimation = (answerId: string) => {
    if (!likeAnimations[answerId]) {
      setLikeAnimations(prev => ({
        ...prev,
        [answerId]: {
          scale: new Animated.Value(1),
          opacity: new Animated.Value(1),
        }
      }));
    }
  };

  const handleLikeAnswer = (answerId: string) => {
    const answer = state.answers.find(a => a.id === answerId);
    if (!answer) return;

    initializeLikeAnimation(answerId);
    const animations = likeAnimations[answerId];

    if (animations) {
      // Heart animation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(animations.scale, {
            toValue: 1.4,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(animations.scale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(animations.opacity, {
            toValue: 0.7,
            duration: 75,
            useNativeDriver: true,
          }),
          Animated.timing(animations.opacity, {
            toValue: 1,
            duration: 75,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    // Update state
    dispatch({ type: 'LIKE_ANSWER', payload: answerId });

    // Haptic feedback simulation
    if (!answer.isLiked) {
      // Show encouraging message for first-time likes
      const messages = [
        "Your appreciation means a lot! 💕",
        "Love seeing authentic connections! ✨",
        "This resonated with you too? 💭",
        "Beautiful response, right? 🌟"
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      setTimeout(() => {
        Alert.alert('', randomMessage, [{ text: 'Continue', style: 'default' }]);
      }, 300);
    }
  };

  const handleConnectLinkedIn = () => {
    Alert.alert(
      'Connect LinkedIn',
      'Connect your LinkedIn profile to find people with similar professional interests and career paths.\n\nThis helps improve match quality based on your professional background.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Connect', 
          style: 'default',
          onPress: () => {
            setShowLinkedInPrompt(false);
            Alert.alert('🎉 Connected!', 'LinkedIn integration enabled. Your matches will now include professional compatibility.');
          }
        },
      ]
    );
  };

  const handleAskCommunity = () => {
    Alert.alert(
      'Ask the Community',
      'Share a thoughtful question that could spark meaningful conversations among Cupido users.\n\nWhat would you like to explore together?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Question', 
          style: 'default',
          onPress: () => {
            setShowCommunityPrompt(false);
            Alert.alert('✨ Question Posted!', 'Your question has been shared with the community. Check back later to see the thoughtful responses!');
          }
        },
      ]
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderQuestionCard = (answer: any, index: number) => {
    initializeLikeAnimation(answer.id);
    const animations = likeAnimations[answer.id];

    return (
      <View key={answer.id} style={styles.cardContainer}>
        <View style={styles.questionCard}>
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.questionMetadata}>
              <View style={[styles.categoryDot, { backgroundColor: answer.color || theme.colors.primary }]} />
              <Text style={styles.categoryText}>{answer.category}</Text>
              <View style={styles.separator} />
              <Text style={styles.timeText}>{formatTimeAgo(answer.timestamp)}</Text>
            </View>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{answer.questionText}</Text>

          {/* Answer Text */}
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{answer.text}</Text>
          </View>

          {/* Interaction Footer */}
          <View style={styles.interactionFooter}>
            <TouchableOpacity 
              style={styles.heartButton}
              onPress={() => handleLikeAnswer(answer.id)}
              activeOpacity={0.8}
            >
              <Animated.View style={animations ? {
                transform: [{ scale: animations.scale }],
                opacity: animations.opacity,
              } : {}}>
                <Text style={[
                  styles.heartIcon,
                  answer.isLiked && styles.heartIconLiked
                ]}>
                  {answer.isLiked ? '♥' : '♡'}
                </Text>
              </Animated.View>
              <Text style={[
                styles.heartCount,
                answer.isLiked && styles.heartCountLiked
              ]}>
                {answer.hearts}
              </Text>
            </TouchableOpacity>

            <View style={styles.engagementStats}>
              <Text style={styles.engagementText}>
                {Math.floor(Math.random() * 12) + 3} people found this insightful
              </Text>
            </View>
          </View>
        </View>

        {/* Contextual Prompts */}
        {renderContextualPrompt(index)}
      </View>
    );
  };

  const renderContextualPrompt = (index: number) => {
    // LinkedIn prompt after first answer
    if (index === 0 && showLinkedInPrompt) {
      return (
        <View style={styles.promptContainer}>
          <View style={[styles.promptCard, styles.linkedinPrompt]}>
            <TouchableOpacity 
              style={styles.promptCloseButton}
              onPress={() => setShowLinkedInPrompt(false)}
            >
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.promptContent}>
              <View style={styles.promptIconContainer}>
                <View style={styles.linkedinIcon}>
                  <Text style={styles.linkedinText}>in</Text>
                </View>
              </View>
              
              <View style={styles.promptTextContent}>
                <Text style={styles.promptTitle}>Connect LinkedIn</Text>
                <Text style={styles.promptDescription}>
                  Find people with similar professional paths and career interests
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.promptActionButton}
                onPress={handleConnectLinkedIn}
              >
                <Text style={styles.promptActionText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Community prompt after third answer  
    if (index === 2 && showCommunityPrompt) {
      return (
        <View style={styles.promptContainer}>
          <View style={[styles.promptCard, styles.communityPrompt]}>
            <TouchableOpacity 
              style={styles.promptCloseButton}
              onPress={() => setShowCommunityPrompt(false)}
            >
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.promptContent}>
              <View style={styles.promptIconContainer}>
                <View style={styles.communityIcon}>
                  <Text style={styles.communityIconText}>✓</Text>
                </View>
              </View>
              
              <View style={styles.promptTextContent}>
                <Text style={styles.promptTitle}>Ask the Community</Text>
                <Text style={styles.promptDescription}>
                  Share a question that sparks meaningful conversations
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.promptActionButton}
                onPress={handleAskCommunity}
              >
                <Text style={styles.promptActionText}>Ask</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Reflections</Text>
          <Text style={styles.feedSubtitle}>
            Authentic thoughts from the community
          </Text>
        </View>

        {state.answers.map((answer, index) => renderQuestionCard(answer, index))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.huge,
  },
  feedHeader: {
    paddingHorizontal: theme.layout.containerPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  feedTitle: {
    ...theme.typography.largeTitle,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  feedSubtitle: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
  },
  cardContainer: {
    marginBottom: theme.spacing.lg,
  },
  questionCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.layout.containerPadding,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  questionHeader: {
    marginBottom: theme.spacing.lg,
  },
  questionMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  categoryText: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.separator,
    marginHorizontal: theme.spacing.sm,
  },
  timeText: {
    ...theme.typography.caption1,
    color: theme.colors.tertiaryLabel,
  },
  questionText: {
    ...theme.typography.title3,
    color: theme.colors.label,
    lineHeight: 28,
    marginBottom: theme.spacing.lg,
  },
  answerContainer: {
    marginBottom: theme.spacing.xl,
  },
  answerText: {
    ...theme.typography.body,
    color: theme.colors.label,
    lineHeight: 24,
  },
  interactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.separator,
  },
  heartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.secondarySystemBackground,
    minWidth: 60,
  },
  heartIcon: {
    fontSize: 18,
    color: theme.colors.tertiaryLabel,
    marginRight: theme.spacing.sm,
  },
  heartIconLiked: {
    color: theme.colors.error,
  },
  heartCount: {
    ...theme.typography.callout,
    color: theme.colors.secondaryLabel,
    fontWeight: '600',
  },
  heartCountLiked: {
    color: theme.colors.error,
  },
  engagementStats: {
    flex: 1,
    alignItems: 'flex-end',
  },
  engagementText: {
    ...theme.typography.footnote,
    color: theme.colors.tertiaryLabel,
  },
  promptContainer: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.layout.containerPadding,
  },
  promptCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    position: 'relative',
    ...theme.shadows.sm,
  },
  linkedinPrompt: {
    backgroundColor: '#F0F8FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0A66C2',
  },
  communityPrompt: {
    backgroundColor: '#F0FDF4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.success,
  },
  promptCloseButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 20,
    color: theme.colors.tertiaryLabel,
    fontWeight: '300',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.xxxl,
  },
  promptIconContainer: {
    marginRight: theme.spacing.lg,
  },
  linkedinIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#0A66C2',
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkedinText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  communityIcon: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityIconText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  promptTextContent: {
    flex: 1,
  },
  promptTitle: {
    ...theme.typography.headline,
    color: theme.colors.label,
    marginBottom: theme.spacing.xs,
  },
  promptDescription: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
    lineHeight: 20,
  },
  promptActionButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
    ...theme.shadows.sm,
  },
  promptActionText: {
    ...theme.typography.callout,
    color: theme.colors.label,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: theme.spacing.huge,
  },
});