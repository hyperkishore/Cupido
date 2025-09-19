import React, { useState } from 'react';
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

export const PixelPerfectHomeScreen = () => {
  const { state, dispatch } = useAppState();
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(true);
  const [showCommunityPrompt, setShowCommunityPrompt] = useState(true);

  const handleLikeAnswer = (answerId: string) => {
    dispatch({ type: 'LIKE_ANSWER', payload: answerId });
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

  const handleAnswerQuestion = (questionId: string) => {
    Alert.alert(
      'Share Your Thoughts',
      'This will open the reflection screen to answer this question.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Answer', onPress: () => console.log('Navigate to Reflect screen') },
      ]
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderQuestionCard = (answer: any, index: number) => {
    const isLiked = answer.isLiked || false;
    
    return (
      <View key={answer.id}>
        <FeedbackWrapper
          componentId={`question-card-${answer.id}`}
          componentType="QuestionCard"
          screenName="HomeScreen"
        >
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <FeedbackWrapper
                componentId={`question-text-${answer.id}`}
                componentType="QuestionText"
                screenName="HomeScreen"
              >
                <Text style={styles.questionText}>{answer.questionText}</Text>
              </FeedbackWrapper>
              <Text style={styles.timestamp}>{formatTimeAgo(answer.timestamp)}</Text>
            </View>
            
            <FeedbackWrapper
              componentId={`answer-text-${answer.id}`}
              componentType="AnswerText"
              screenName="HomeScreen"
            >
              <Text style={styles.answerText}>{answer.text}</Text>
            </FeedbackWrapper>
            
            <View style={styles.questionFooter}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{answer.category}</Text>
              </View>
              <FeedbackWrapper
                componentId={`heart-button-${answer.id}`}
                componentType="HeartButton"
                screenName="HomeScreen"
              >
                <TouchableOpacity 
                  style={styles.heartContainer}
                  onPress={() => handleLikeAnswer(answer.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.heartIcon, isLiked && styles.heartIconLiked]}>
                    {isLiked ? '♥' : '♡'}
                  </Text>
                  <Text style={[styles.heartCount, isLiked && styles.heartCountLiked]}>
                    {answer.hearts}
                  </Text>
                </TouchableOpacity>
              </FeedbackWrapper>
              {index === 1 && (
                <FeedbackWrapper
                  componentId={`answer-button-${answer.id}`}
                  componentType="AnswerButton"
                  screenName="HomeScreen"
                >
                  <TouchableOpacity 
                    style={styles.answerButton}
                    onPress={() => handleAnswerQuestion(answer.questionId)}
                  >
                    <Text style={styles.answerButtonText}>Answer</Text>
                  </TouchableOpacity>
                </FeedbackWrapper>
              )}
            </View>
          </View>
        </FeedbackWrapper>

        {/* LinkedIn Connect Prompt after first card */}
        {index === 0 && showLinkedInPrompt && (
          <View style={styles.promptCard}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowLinkedInPrompt(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
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
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCommunityPrompt(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {state.answers.map((answer, index) => renderQuestionCard(answer, index))}
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
});