import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView 
} from 'react-native';
import { claudeAIService } from '../services/claudeAI.service';

const SKIP_REASONS = [
  "Too personal right now",
  "Need more time to think",
  "Not relevant to me",
  "Want a different topic",
  "Feeling uncomfortable"
];

export const ReflectionScreen = ({ onBack, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [response, setResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [authenticityScore, setAuthenticityScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    generateNewQuestion();
  }, []);

  const generateNewQuestion = async (skipReason?: string) => {
    setIsLoading(true);
    setResponse('');
    setAuthenticityScore(0);
    
    try {
      const newQuestion = await claudeAIService.generateReflectionQuestion({
        previousQuestions,
        skipReason
      });
      
      setCurrentQuestion(newQuestion);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error generating question:', error);
      // Use fallback question
      setCurrentQuestion({
        id: `fallback_${Date.now()}`,
        question: "What's something that made you smile today?",
        category: "Reflection"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = async (text: string) => {
    setResponse(text);
    
    if (text.length > 20) {
      const score = await claudeAIService.analyzeResponseAuthenticity(text);
      setAuthenticityScore(score);
    } else {
      setAuthenticityScore(0);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setResponse(response + ' [Voice transcription would appear here]');
      }, 2000);
    }
  };

  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const handleSkipWithReason = async (reason: string) => {
    setShowSkipModal(false);
    
    if (currentQuestion) {
      setPreviousQuestions(prev => [...prev, currentQuestion.question]);
    }
    
    await generateNewQuestion(reason);
  };

  const handleNext = async () => {
    if (!response.trim() || !currentQuestion) return;
    
    // Save the response
    const newResponse = {
      question: currentQuestion.question,
      response: response.trim(),
      score: authenticityScore
    };
    
    setAllResponses(prev => [...prev, newResponse]);
    setPreviousQuestions(prev => [...prev, currentQuestion.question]);
    
    // Generate follow-up question based on response
    setIsLoading(true);
    try {
      const followUp = await claudeAIService.generateFollowUpQuestion(
        currentQuestion.question,
        response
      );
      setCurrentQuestion(followUp);
      setResponse('');
      setAuthenticityScore(0);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      // Generate new random question if follow-up fails
      await generateNewQuestion();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSession = () => {
    if (response.trim() && currentQuestion) {
      // Save current response before completing
      const finalResponses = [
        ...allResponses,
        {
          question: currentQuestion.question,
          response: response.trim(),
          score: authenticityScore
        }
      ];
      onComplete(finalResponses);
    } else {
      onComplete(allResponses);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Generating your reflection question...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Text style={styles.questionCounter}>Question {questionCount}</Text>
            <Text style={styles.categoryBadge}>{currentQuestion?.category}</Text>
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.questionTitle}>Daily Reflection</Text>
          <Text style={styles.questionText}>{currentQuestion?.question}</Text>
          
          {currentQuestion?.followUp && (
            <Text style={styles.followUpHint}>{currentQuestion.followUp}</Text>
          )}
          
          <View style={styles.responseContainer}>
            <View style={styles.voiceInputContainer}>
              <TextInput
                style={styles.responseInput}
                placeholder="Share your thoughts..."
                value={response}
                onChangeText={handleResponseChange}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={handleVoiceRecord}
              >
                <Text style={styles.voiceButtonText}>{isRecording ? '🛑' : '🎤'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.characterCount}>{response.length}/500</Text>
          </View>
          
          {response.length > 20 && (
            <View style={styles.authenticityPreview}>
              <Text style={styles.authenticityTitle}>Authenticity Score: {authenticityScore}%</Text>
              <View style={styles.authenticityBar}>
                <View style={[styles.authenticityFill, { width: `${authenticityScore}%` }]} />
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleCompleteSession}
              disabled={allResponses.length === 0 && !response.trim()}
            >
              <Text style={styles.secondaryButtonText}>Complete Session</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, styles.nextButton, !response.trim() && styles.disabledButton]} 
              onPress={handleNext}
              disabled={!response.trim()}
            >
              <Text style={styles.primaryButtonText}>Next Question</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Skip Reason Modal */}
      <Modal
        visible={showSkipModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why skip this question?</Text>
            <Text style={styles.modalSubtitle}>This helps us find better questions for you</Text>
            
            <ScrollView style={styles.reasonsContainer}>
              {SKIP_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reasonButton}
                  onPress={() => handleSkipWithReason(reason)}
                >
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSkipModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
    marginBottom: 16,
  },
  followUpHint: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 24,
  },
  responseContainer: {
    marginBottom: 24,
  },
  voiceInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  responseInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  voiceButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  voiceButtonText: {
    fontSize: 20,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  authenticityPreview: {
    marginBottom: 24,
  },
  authenticityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  authenticityBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  authenticityFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
});