import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppState } from '../contexts/AppStateContext';
import { FeedbackWrapper } from '../components/FeedbackWrapper';
import { communityService, CommunityReflection } from '../services/communityService';
import { habitTrackingService } from '../services/habitTrackingService';

export const PixelPerfectHomeScreen = () => {
  const { state, dispatch } = useAppState();
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(true);
  const [showCommunityPrompt, setShowCommunityPrompt] = useState(true);
  const [communityFeed, setCommunityFeed] = useState<CommunityReflection[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      await communityService.initialize();
      await habitTrackingService.initialize();
      
      const feed = await communityService.getCommunityFeed(10);
      const streak = await habitTrackingService.getCurrentStreak();
      
      setCommunityFeed(feed);
      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeAnswer = async (reflectionId: string) => {
    try {
      await communityService.likeReflection(reflectionId);
      // Refresh the feed to show updated heart count
      const updatedFeed = await communityService.getCommunityFeed(10);
      setCommunityFeed(updatedFeed);
    } catch (error) {
      console.error('Error liking reflection:', error);
    }
  };

  const handleConnectLinkedIn = () => {
    Alert.alert(
      'Connect LinkedIn',
      'Connect your LinkedIn profile to find people with similar professional interests.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Connect', 
          onPress: () => {
            setShowLinkedInPrompt(false);
            Alert.alert('Connected!', 'LinkedIn integration enabled.');
          }
        },
      ]
    );
  };

  const handleAskCommunity = () => {
    Alert.alert(
      'Ask the Community',
      'Share a thoughtful question with the Cupido community.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Question', 
          onPress: () => {
            setShowCommunityPrompt(false);
            Alert.alert('Question Posted!', 'Your question has been shared.');
          }
        },
      ]
    );
  };


  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'yesterday';
    return `${diffInDays}d ago`;
  };

  const handleAnswerQuestion = (question: string) => {
    Alert.alert(
      'Share Your Thoughts',
      `Reflect on: "${question}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reflect', onPress: () => console.log('Navigate to Reflect screen with question:', question) },
      ]
    );
  };

  const renderQuestionCard = (reflection: CommunityReflection, index: number) => {
    const isLiked = reflection.hasUserLiked;
    
    return (
      <View key={reflection.id}>
        <FeedbackWrapper
          componentId={`question-card-${reflection.id}`}
          componentType="QuestionCard"
          screenName="HomeScreen"
        >
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{reflection.authorName}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(reflection.createdAt.toISOString())}</Text>
              </View>
              <FeedbackWrapper
                componentId={`question-text-${reflection.id}`}
                componentType="QuestionText"
                screenName="HomeScreen"
              >
                <Text style={styles.questionText}>{reflection.question}</Text>
              </FeedbackWrapper>
            </View>
            
            <FeedbackWrapper
              componentId={`answer-text-${reflection.id}`}
              componentType="AnswerText"
              screenName="HomeScreen"
            >
              <Text style={styles.answerText}>{reflection.answer}</Text>
            </FeedbackWrapper>
            
            <View style={styles.questionFooter}>
              <View style={styles.tagsContainer}>
                {reflection.tags?.map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <FeedbackWrapper
                componentId={`heart-button-${reflection.id}`}
                componentType="HeartButton"
                screenName="HomeScreen"
              >
                <TouchableOpacity 
                  style={styles.heartContainer}
                  onPress={() => handleLikeAnswer(reflection.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.heartIcon, isLiked && styles.heartIconLiked]}>
                    {isLiked ? '♥' : '♡'}
                  </Text>
                  <Text style={[styles.heartCount, isLiked && styles.heartCountLiked]}>
                    {reflection.communityHearts}
                  </Text>
                </TouchableOpacity>
              </FeedbackWrapper>
              {index === 1 && (
                <FeedbackWrapper
                  componentId={`answer-button-${reflection.id}`}
                  componentType="AnswerButton"
                  screenName="HomeScreen"
                >
                  <TouchableOpacity 
                    style={styles.answerButton}
                    onPress={() => handleAnswerQuestion(reflection.question)}
                  >
                    <Text style={styles.answerButtonText}>Reflect</Text>
                  </TouchableOpacity>
                </FeedbackWrapper>
              )}
            </View>
          </View>
        </FeedbackWrapper>

        {/* LinkedIn Connect Prompt after first card */}
        {index === 0 && showLinkedInPrompt && (
          <View style={styles.promptCard}>
            <View style={styles.promptContent}>
              <View style={styles.linkedinIconContainer}>
                <Text style={styles.linkedinIcon}>in</Text>
              </View>
              <View style={styles.promptTextContainer}>
                <Text style={styles.promptTitle}>Connect LinkedIn</Text>
                <Text style={styles.promptSubtitle}>
                  Find people similar to your professional network
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={handleConnectLinkedIn}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Community Prompt after fourth card */}
        {index === 3 && showCommunityPrompt && (
          <View style={styles.promptCard}>
            <View style={styles.promptContent}>
              <View style={styles.communityIconContainer}>
                <Text style={styles.communityIcon}>✓</Text>
              </View>
              <View style={styles.promptTextContainer}>
                <Text style={styles.promptTitle}>Ask the Community</Text>
                <Text style={styles.promptSubtitle}>
                  Share a question that sparks meaningful conversations
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.askButton}
                onPress={handleAskCommunity}
              >
                <Text style={styles.askButtonText}>Ask</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading community reflections...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {currentStreak > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakContent}>
            <Text style={styles.streakTitle}>{currentStreak} Day Streak!</Text>
            <Text style={styles.streakSubtitle}>Keep your authentic reflection going</Text>
          </View>
        </View>
      )}
      {communityFeed.map((reflection, index) => renderQuestionCard(reflection, index))}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 24,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  answerText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 16,
  },
  questionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  heartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 'auto',
  },
  heartIcon: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 4,
  },
  heartIconLiked: {
    color: '#FF3B30',
  },
  heartCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  heartCountLiked: {
    color: '#FF3B30',
  },
  answerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    marginLeft: 12,
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  promptCard: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: '300',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedinIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#0A66C2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkedinIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#34C759',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  promptTextContainer: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  promptSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  connectButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  askButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  authorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});