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
  Animated,
} from 'react-native';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { questionsService } from '../services/questionsService';

export const FunctionalReflectScreen = () => {
  const { state, dispatch } = useAppState();
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(questionsService.getDailyQuestion());
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  const maxSkips = 3;
  const maxCharacters = 500;

  useEffect(() => {
    // Load today's question or continue from where user left off
    const todayQuestion = questionsService.getDailyQuestion();
    setCurrentQuestion(todayQuestion);
  }, []);

  const handleSkip = () => {
    if (skipCount >= maxSkips) {
      Alert.alert(
        'Skip Limit Reached',
        'You\'ve used all your skips for today. Try answering this question - even a brief response helps your growth!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Skip Question?',
      `Are you sure you want to skip this question? You have ${maxSkips - skipCount - 1} skips remaining today.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => {
            setSkipCount(prev => prev + 1);
            loadNextQuestion();
          }
        },
      ]
    );
  };

  const loadNextQuestion = () => {
    // Animate question change
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Get answered question IDs to avoid repeats
    const answeredIds = state.answers.map(a => a.questionId);
    const nextQuestion = questionsService.getNextReflectionQuestion(answeredIds);
    
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
      questionText: currentQuestion.text,
      text: answer.trim(),
      category: currentQuestion.category,
      timestamp: new Date().toISOString(),
      hearts: 0,
      isLiked: false,
    };

    dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
  };

  const handleCompleteSession = () => {
    if (answer.trim().length > 0) {
      saveCurrentAnswer();
    }

    // Calculate session bonus
    const sessionBonus = questionNumber * 2; // 2 points per question
    dispatch({ 
      type: 'UPDATE_STATS', 
      payload: { 
        totalPoints: state.userStats.totalPoints + sessionBonus,
        currentStreak: state.userStats.currentStreak + 1 
      } 
    });

    setIsCompleted(true);
    
    // Show completion message
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
          <Text style={styles.category}>{currentQuestion.theme}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleSkip}
          disabled={skipCount >= maxSkips}
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
        
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.question}>{currentQuestion.text}</Text>
        </Animated.View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, isOverLimit && styles.textInputError]}
            placeholder="Share your thoughts..."
            placeholderTextColor="#C7C7CC"
            multiline
            value={answer}
            onChangeText={setAnswer}
            textAlignVertical="top"
            maxLength={maxCharacters + 50} // Allow slight overflow for UX
          />
          <TouchableOpacity style={styles.editIcon}>
            <Text style={styles.editIconText}>✏️</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[
          styles.charCount,
          isOverLimit && styles.charCountError
        ]}>
          {getRemainingCharacters()} characters remaining
        </Text>

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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
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
  questionInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  category: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  skipButton: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '400',
  },
  skipButtonDisabled: {
    color: '#C7C7CC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },
  question: {
    fontSize: 22,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 28,
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    minHeight: 200,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 50,
  },
  textInput: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 22,
    minHeight: 168,
    textAlignVertical: 'top',
  },
  textInputError: {
    color: '#FF3B30',
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  editIconText: {
    fontSize: 18,
  },
  charCount: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  },
  charCountError: {
    color: '#FF3B30',
  },
  tipContainer: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  tipText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
  },
  completeButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#FFCCCB',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  completedContent: {
    alignItems: 'center',
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});