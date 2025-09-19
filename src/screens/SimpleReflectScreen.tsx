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
import { CleanVoiceInput } from '../components/CleanVoiceInput';

export const SimpleReflectScreen = () => {
  const { dispatch } = useAppState();
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<CategoryQuestion | null>(null);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const loadNewQuestion = () => {
    const question = questionsService.getDailyReflectionQuestion();
    setCurrentQuestion(question);
    setAnswer('');
  };

  const handleSubmitAnswer = () => {
    console.log('Submit clicked, answer length:', answer.length, 'trimmed:', answer.trim().length);
    
    if (!currentQuestion || !answer.trim()) {
      console.log('Submit blocked - no question or empty answer');
      return;
    }

    console.log('Creating new answer...');
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

    console.log('Dispatching answer:', newAnswer);
    dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
    
    Alert.alert(
      'Shared',
      'Your reflection has been added.',
      [{ text: 'Continue', onPress: loadNewQuestion }]
    );
  };

  const handleSkip = () => {
    loadNewQuestion();
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Simple tag */}
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>{currentQuestion.theme}</Text>
        </View>

        {/* Clean question */}
        <Text style={styles.question}>
          {currentQuestion.question}
        </Text>

        {/* Voice input with Wispr Flow style */}
        <CleanVoiceInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Your thoughts..."
          maxLength={500}
        />

        {/* Simple buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.shareButton,
              answer.trim().length === 0 && styles.shareButtonDisabled
            ]}
            onPress={handleSubmitAnswer}
          >
            <Text style={[
              styles.shareText,
              answer.trim().length === 0 && styles.shareTextDisabled
            ]}>
              Share ({answer.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  tagContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tag: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  question: {
    fontSize: 22,
    lineHeight: 30,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '400',
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  shareButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  shareButtonDisabled: {
    opacity: 0.4,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareTextDisabled: {
    color: '#CCCCCC',
  },
  loading: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: '50%',
  },
});