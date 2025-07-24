import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import questionsData from '../data/questions.json';

interface Question {
  text: string;
  category: string;
}

export const ReflectScreen = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Load a random question from the Relationship category for demo
    const relationshipQuestions = questionsData.filter(
      q => q.theme.toLowerCase().includes('relationship')
    );
    if (relationshipQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * relationshipQuestions.length);
      setCurrentQuestion({
        text: relationshipQuestions[randomIndex].question,
        category: relationshipQuestions[randomIndex].theme
      });
    } else {
      // Fallback to any question if no relationship questions found
      const randomIndex = Math.floor(Math.random() * questionsData.length);
      setCurrentQuestion({
        text: questionsData[randomIndex].question,
        category: questionsData[randomIndex].theme
      });
    }
  }, []);

  const handleNextQuestion = () => {
    if (answer.trim().length > 0 || questionNumber >= 3) {
      if (questionNumber >= 3) {
        setIsCompleted(true);
      } else {
        // Load next question
        const randomIndex = Math.floor(Math.random() * questionsData.length);
        setCurrentQuestion({
          text: questionsData[randomIndex].question,
          category: questionsData[randomIndex].theme
        });
        setAnswer('');
        setQuestionNumber(prev => prev + 1);
      }
    }
  };

  const handleCompleteSession = () => {
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
        <Text style={styles.completedTitle}>Session Complete!</Text>
        <Text style={styles.completedSubtitle}>
          You've completed today's reflection. Come back tomorrow for more insights.
        </Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.questionInfo}>
            <Text style={styles.questionNumber}>Question {questionNumber}</Text>
            <Text style={styles.category}>{currentQuestion.category}</Text>
          </View>
          
          <TouchableOpacity>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Daily Reflection</Text>
          <Text style={styles.question}>{currentQuestion.text}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts..."
              placeholderTextColor="#999999"
              multiline
              value={answer}
              onChangeText={setAnswer}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="pencil" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.charCount}>{answer.length}/500</Text>
        </View>

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
              answer.trim().length === 0 && styles.nextButtonDisabled
            ]}
            onPress={handleNextQuestion}
            disabled={answer.trim().length === 0}
          >
            <Text style={styles.nextButtonText}>Next Question</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
    marginBottom: 12,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  category: {
    fontSize: 14,
    color: '#666666',
    textTransform: 'capitalize',
  },
  skipButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
  },
  question: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 28,
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    minHeight: 168,
  },
  editIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  charCount: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  completeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#FFB8B8',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});