import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { enhancedQuestionsService, EnhancedQuestion } from '../services/enhancedQuestionsService';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { EnhancedVoiceInput } from '../components/EnhancedVoiceInput';

export const EnhancedReflectScreen = () => {
  const { dispatch } = useAppState();
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<EnhancedQuestion | null>(null);
  const [questionGuidance, setQuestionGuidance] = useState<any>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(true);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  useEffect(() => {
    // Animate question entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestion]);

  const loadNewQuestion = () => {
    const question = enhancedQuestionsService.getProgressiveQuestion(
      questionNumber,
      sessionQuestions
    );
    
    if (question) {
      setCurrentQuestion(question);
      const guidance = enhancedQuestionsService.getQuestionWithGuidance(question.id);
      setQuestionGuidance(guidance);
      setAnswer('');
      
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answer.trim()) return;

    const newAnswer = {
      id: generateId(),
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      text: answer.trim(),
      category: currentQuestion.category,
      theme: currentQuestion.theme,
      tags: currentQuestion.tags,
      emotionalDepth: currentQuestion.emotionalDepth,
      timestamp: new Date().toISOString(),
      hearts: 0,
      isLiked: false,
    };

    dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
    setSessionQuestions([...sessionQuestions, currentQuestion.id]);
    
    Alert.alert(
      '✨ Reflection Captured',
      'Your thoughtful response has been saved and shared with the community.',
      [
        { 
          text: 'Continue Reflecting', 
          onPress: () => {
            setQuestionNumber(prev => prev + 1);
            loadNewQuestion();
          }
        },
        { 
          text: 'View Community', 
          onPress: () => console.log('Navigate to Home'),
          style: 'cancel'
        },
      ]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip This Question?',
      'You can always come back to it later.',
      [
        { text: 'Stay', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            setQuestionNumber(prev => prev + 1);
            loadNewQuestion();
          }
        },
      ]
    );
  };

  const handleCompleteSession = () => {
    const encouragement = sessionQuestions.length > 0
      ? `You've reflected on ${sessionQuestions.length} question${sessionQuestions.length > 1 ? 's' : ''} today. Great work!`
      : 'Come back anytime you want to reflect.';
    
    Alert.alert(
      'Complete Session',
      encouragement,
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Finish', 
          onPress: () => console.log('Navigate to Home')
        },
      ]
    );
  };

  const getMoodEmoji = (tone: string) => {
    const emojiMap: Record<string, string> = {
      curious: '🤔',
      nostalgic: '💭',
      gentle: '🤗',
      vulnerable: '💝',
      contemplative: '🧘',
      reflective: '🪞',
      introspective: '💫',
      playful: '🎈',
      thoughtful: '💡',
    };
    return emojiMap[tone] || '✨';
  };

  if (!currentQuestion) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Preparing your reflection...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.sessionTitle}>Daily Reflection</Text>
            <Text style={styles.questionCounter}>Question {questionNumber}</Text>
          </View>
          
          <TouchableOpacity onPress={handleCompleteSession}>
            <Text style={styles.completeText}>Complete</Text>
          </TouchableOpacity>
        </View>

        {/* Question Card */}
        <Animated.View 
          style={[
            styles.questionCard,
            { 
              backgroundColor: currentQuestion.color + '15',
              borderColor: currentQuestion.color,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.questionMeta}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(currentQuestion.tone)}</Text>
              <Text style={[styles.theme, { color: currentQuestion.color }]}>
                {currentQuestion.theme}
              </Text>
            </View>
            
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip →</Text>
            </TouchableOpacity>
          </View>

          {/* Tags */}
          {showTags && currentQuestion.tags && (
            <View style={styles.tagsContainer}>
              {currentQuestion.tags.slice(0, 5).map((tag, index) => (
                <View 
                  key={index} 
                  style={[styles.tag, { backgroundColor: currentQuestion.color + '20' }]}
                >
                  <Text style={[styles.tagText, { color: currentQuestion.color }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Question Text */}
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          {/* Emotional Depth Indicator */}
          <View style={styles.depthContainer}>
            <Text style={styles.depthLabel}>Depth:</Text>
            <View style={styles.depthIndicator}>
              {['low', 'medium', 'high'].map((level) => (
                <View 
                  key={level}
                  style={[
                    styles.depthDot,
                    { 
                      backgroundColor: 
                        (level === 'low' && currentQuestion.emotionalDepth !== 'low') ? '#E5E5EA' :
                        (level === 'medium' && currentQuestion.emotionalDepth === 'high') ? '#E5E5EA' :
                        currentQuestion.color
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.depthText}>{currentQuestion.emotionalDepth}</Text>
          </View>
        </Animated.View>

        {/* Answer Input */}
        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Your Reflection</Text>
          
          <EnhancedVoiceInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Share your thoughts... Speak or type"
            maxLength={500}
            answerPrompts={questionGuidance?.question.answerPrompts || []}
            starterPhrases={questionGuidance?.starterPhrases || []}
          />
          
          {/* Answer Types Hint */}
          {currentQuestion.suggestedAnswerTypes && answer.length === 0 && (
            <View style={styles.answerTypesContainer}>
              <Text style={styles.answerTypesLabel}>This works well as:</Text>
              <View style={styles.answerTypes}>
                {currentQuestion.suggestedAnswerTypes.slice(0, 3).map((type, index) => (
                  <Text key={index} style={styles.answerType}>
                    {type}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            { backgroundColor: currentQuestion.color },
            answer.trim().length === 0 && styles.submitButtonDisabled
          ]}
          disabled={answer.trim().length === 0}
          onPress={handleSubmitAnswer}
        >
          <Text style={styles.submitButtonText}>
            Share Your Reflection
          </Text>
        </TouchableOpacity>

        {/* Session Stats */}
        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sessionQuestions.length}</Text>
            <Text style={styles.statLabel}>Reflected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{answer.length}</Text>
            <Text style={styles.statLabel}>Characters</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000000',
  },
  headerCenter: {
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  questionCounter: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  completeText: {
    fontSize: 17,
    color: '#007AFF',
  },
  questionCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodEmoji: {
    fontSize: 24,
  },
  theme: {
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#000000',
    marginBottom: 16,
  },
  depthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  depthLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  depthIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  depthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  depthText: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  answerSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  answerLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  answerTypesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  answerTypesLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  answerTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  answerType: {
    fontSize: 13,
    color: '#007AFF',
    backgroundColor: '#007AFF15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
});