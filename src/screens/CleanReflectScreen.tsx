import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { questionsService, CategoryQuestion } from '../services/questionsLoader';

export const CleanReflectScreen = () => {
  const { dispatch } = useAppState();
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<CategoryQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const loadNewQuestion = () => {
    const question = questionsService.getDailyReflectionQuestion();
    setCurrentQuestion(question);
    setAnswer('');
  };

  const handleSkip = () => {
    setQuestionNumber(prev => prev + 1);
    loadNewQuestion();
  };

  const loadNextQuestion = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: theme.animations.fast,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animations.fast,
        useNativeDriver: true,
      }),
    ]).start();

    const answeredIds = state.answers.map(a => a.questionId);
    const userLevel = state.answers.length;
    const nextQuestion = enhancedQuestionsService.getProgressiveQuestion(userLevel, answeredIds);
    
    setCurrentQuestion(nextQuestion);
    setAnswer('');
    setQuestionNumber(prev => prev + 1);
  };

  const handleNextQuestion = () => {
    if (answer.trim().length === 0) {
      Alert.alert(
        'Empty Response',
        'Please share your thoughts before moving to the next question. Even a few words can make a difference!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    saveCurrentAnswer();
    
    if (questionNumber >= 3) {
      handleCompleteSession();
    } else {
      loadNextQuestion();
    }
  };

  const saveCurrentAnswer = () => {
    const newAnswer = {
      id: generateId(),
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      text: answer.trim(),
      category: currentQuestion.category,
      timestamp: new Date().toISOString(),
      hearts: Math.floor(Math.random() * 12) + 3,
      isLiked: false,
      color: currentQuestion.color,
    };

    dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
  };

  const handleCompleteSession = () => {
    if (answer.trim().length > 0) {
      saveCurrentAnswer();
    }

    const sessionBonus = questionNumber * 2;
    dispatch({ 
      type: 'UPDATE_STATS', 
      payload: { 
        totalPoints: state.userStats.totalPoints + sessionBonus,
        currentStreak: state.userStats.currentStreak + 1 
      } 
    });

    setIsCompleted(true);
    
    Alert.alert(
      'Session Complete! 🎉',
      `Great work! You've earned ${sessionBonus} bonus points for completing your reflection session.\n\nYour authenticity grows with each honest response.`,
      [
        { 
          text: 'Continue Exploring', 
          onPress: () => setIsCompleted(false)
        }
      ]
    );
  };

  const getRemainingCharacters = () => maxCharacters - answer.length;
  const isOverLimit = answer.length > maxCharacters;

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Animated.View style={[styles.completedContent, { opacity: fadeAnim }]}>
          <Text style={styles.completedEmoji}>✨</Text>
          <Text style={styles.completedTitle}>Session Complete!</Text>
          <Text style={styles.completedSubtitle}>
            You've completed today's reflection. Your insights help build authentic connections.
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>+{questionNumber * 2}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => setIsCompleted(false)}
          >
            <Text style={styles.continueButtonText}>Continue Exploring</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.questionInfo}>
          <Text style={styles.questionNumber}>Question {questionNumber}</Text>
          <Text style={styles.category}>{currentQuestion.category}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleSkip}
          disabled={skipCount >= maxSkips}
          style={styles.skipContainer}
        >
          <Text style={[
            styles.skipButton, 
            skipCount >= maxSkips && styles.skipButtonDisabled
          ]}>
            Skip {skipCount < maxSkips && `(${maxSkips - skipCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Daily Reflection</Text>
        
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
          <View style={[styles.themeIndicator, { backgroundColor: currentQuestion.color }]} />
          <Text style={styles.question}>{currentQuestion.question}</Text>
          <Text style={styles.questionTone}>Tone: {currentQuestion.tone}</Text>
        </Animated.View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, isOverLimit && styles.textInputError]}
            placeholder="Share your thoughts..."
            placeholderTextColor={theme.colors.tertiaryLabel}
            multiline
            value={answer}
            onChangeText={setAnswer}
            textAlignVertical="top"
            maxLength={maxCharacters + 50}
          />
          <View style={styles.inputActions}>
            <Text style={[
              styles.charCount,
              isOverLimit && styles.charCountError
            ]}>
              {getRemainingCharacters()} characters remaining
            </Text>
          </View>
        </View>

        {answer.length > 0 && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 The more authentic your response, the better your matches will be!
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={handleCompleteSession}
        >
          <Text style={styles.completeButtonText}>Complete Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            (answer.trim().length === 0 || isOverLimit) && styles.nextButtonDisabled
          ]}
          onPress={handleNextQuestion}
          disabled={answer.trim().length === 0 || isOverLimit}
        >
          <Text style={styles.nextButtonText}>
            {questionNumber >= 3 ? 'Finish' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.layout.containerPadding,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  backButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.label,
  },
  questionInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    ...theme.typography.headline,
    color: theme.colors.label,
  },
  category: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.xs,
  },
  skipContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  skipButton: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '400',
  },
  skipButtonDisabled: {
    color: theme.colors.tertiaryLabel,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.layout.containerPadding,
    paddingTop: theme.spacing.xxxl,
  },
  title: {
    ...theme.typography.largeTitle,
    color: theme.colors.label,
    marginBottom: theme.spacing.xl,
  },
  questionContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
    ...theme.shadows.sm,
  },
  themeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginBottom: theme.spacing.lg,
  },
  question: {
    ...theme.typography.title3,
    color: theme.colors.label,
    lineHeight: 28,
    marginBottom: theme.spacing.md,
  },
  questionTone: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.label,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingBottom: theme.spacing.lg,
  },
  textInputError: {
    color: theme.colors.error,
  },
  inputActions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.separator,
    paddingTop: theme.spacing.md,
  },
  charCount: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
    textAlign: 'right',
  },
  charCountError: {
    color: theme.colors.error,
  },
  tipContainer: {
    backgroundColor: theme.colors.successBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  tipText: {
    ...theme.typography.footnote,
    color: theme.colors.success,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.layout.containerPadding,
    paddingBottom: theme.spacing.huge,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground,
  },
  completeButton: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  completeButtonText: {
    ...theme.typography.body,
    color: theme.colors.secondaryLabel,
  },
  nextButton: {
    backgroundColor: theme.colors.cupidoPink,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  nextButtonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
  nextButtonText: {
    ...theme.typography.headline,
    color: theme.colors.white,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.systemGroupedBackground,
    padding: theme.spacing.xxxxl,
  },
  completedContent: {
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxxxl,
    ...theme.shadows.lg,
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.xl,
  },
  completedTitle: {
    ...theme.typography.title1,
    color: theme.colors.label,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  completedSubtitle: {
    ...theme.typography.body,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xxxl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xxxxl,
    marginBottom: theme.spacing.xxxl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.largeTitle,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.footnote,
    color: theme.colors.secondaryLabel,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxxl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
  },
  continueButtonText: {
    ...theme.typography.headline,
    color: theme.colors.white,
  },
});