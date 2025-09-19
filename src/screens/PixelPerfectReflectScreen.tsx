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
import { questionsService, CategoryQuestion } from '../services/questionsLoader';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { VoiceTextInput } from '../components/VoiceTextInput';

export const PixelPerfectReflectScreen = () => {
  const { dispatch } = useAppState();
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<CategoryQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);

  useEffect(() => {
    // Load a random daily reflection question
    const question = questionsService.getDailyReflectionQuestion();
    setCurrentQuestion(question);
  }, []);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answer.trim()) return;

    const newAnswer = {
      id: generateId(),
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      text: answer.trim(),
      category: currentQuestion.category,
      timestamp: new Date().toISOString(),
      hearts: 0,
      isLiked: false,
    };

    dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
    
    Alert.alert(
      'Reflection Shared!',
      'Your thoughtful response has been added to the community feed.',
      [
        { text: 'Continue Reflecting', onPress: loadNextQuestion },
        { text: 'View Community', onPress: () => console.log('Navigate to Home') },
      ]
    );
  };

  const loadNextQuestion = () => {
    const newQuestion = questionsService.getRandomQuestion();
    setCurrentQuestion(newQuestion);
    setAnswer('');
    setQuestionNumber(prev => prev + 1);
  };

  const handleCompleteSession = () => {
    Alert.alert(
      'Complete Reflection Session',
      'Are you ready to finish your reflection session?',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Complete', onPress: () => console.log('Navigate to Home') },
      ]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Question',
      'Would you like to skip this question and try another?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: loadNextQuestion },
      ]
    );
  };

  if (!currentQuestion) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading reflection...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Minimal Header - just skip option */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Clean Content - Focus on Question and Answer */}
      <View style={styles.content}>
        <Text style={styles.question}>
          {currentQuestion.question}
        </Text>
        
        <VoiceTextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Speak naturally or type your thoughts..."
          maxLength={500}
          style={styles.inputContainer}
          autoFocus={true}
        />
      </View>

      {/* Simple Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            answer.trim().length === 0 && styles.submitButtonDisabled
          ]}
          disabled={answer.trim().length === 0}
          onPress={handleSubmitAnswer}
        >
          <Text style={[
            styles.submitButtonText,
            answer.trim().length === 0 && styles.submitButtonTextDisabled
          ]}>
            Share Reflection
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
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'center',
  },
  question: {
    fontSize: 28,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 36,
    marginBottom: 48,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#F2F2F7',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#8E8E93',
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