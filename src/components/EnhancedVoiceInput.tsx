import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';

interface EnhancedVoiceInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  answerPrompts?: string[];
  starterPhrases?: string[];
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Tap mic to speak or type your thoughts...',
  maxLength = 500,
  answerPrompts = [],
  starterPhrases = [],
  onVoiceStart,
  onVoiceEnd,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Web Speech API
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onstart = () => {
          setIsListening(true);
          setIsProcessing(false);
          animateListening();
        };
        
        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript + ' ';
            } else {
              currentTranscript += result[0].transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          } else if (currentTranscript) {
            setTranscript(prev => {
              const lastFinalIndex = prev.lastIndexOf(' ');
              return lastFinalIndex > -1 
                ? prev.substring(0, lastFinalIndex + 1) + currentTranscript
                : currentTranscript;
            });
          }
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          stopListening();
        };
        
        recognitionInstance.onend = () => {
          if (isListening) {
            // Restart if still in listening mode
            recognitionInstance.start();
          }
        };
        
        setRecognition(recognitionInstance);
      }
    }
  }, [isListening]);

  const animateListening = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
    
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const startListening = () => {
    if (!isSupported && Platform.OS === 'web') {
      alert('Voice input is not supported in your browser. Please use Chrome or Safari.');
      return;
    }
    
    setShowVoiceModal(true);
    setTranscript('');
    setIsProcessing(false);
    
    if (recognition) {
      try {
        recognition.start();
        onVoiceStart?.();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsProcessing(true);
    
    if (recognition) {
      recognition.stop();
    }
    
    // Stop animations
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    
    // Process the transcript
    setTimeout(() => {
      if (transcript) {
        const prefix = selectedStarter ? selectedStarter + ' ' : '';
        const newText = value 
          ? value + '\n\n' + prefix + transcript 
          : prefix + transcript;
        onChangeText(newText);
      }
      setShowVoiceModal(false);
      setIsProcessing(false);
      onVoiceEnd?.();
    }, 500);
  };

  const handleStarterSelect = (starter: string) => {
    setSelectedStarter(starter);
    onChangeText(starter + ' ');
  };

  const renderVoiceModal = () => (
    <Modal
      visible={showVoiceModal}
      transparent
      animationType="fade"
      onRequestClose={stopListening}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            {/* Voice Visualization */}
            <View style={styles.voiceVisualization}>
              <Animated.View 
                style={[
                  styles.outerCircle,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.1],
                    })
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.middleCircle,
                  {
                    transform: [{ 
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [1, 1.1],
                      })
                    }]
                  }
                ]}
              />
              <View style={styles.innerCircle}>
                <Text style={styles.micIcon}>🎙️</Text>
              </View>
            </View>

            {/* Status Text */}
            <Text style={styles.statusText}>
              {isProcessing ? 'Processing...' : 'Listening...'}
            </Text>
            
            {/* Live Transcript */}
            {transcript && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            )}
            
            {/* Control Buttons */}
            <View style={styles.controlButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowVoiceModal(false);
                  stopListening();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.doneButton, !transcript && styles.doneButtonDisabled]}
                onPress={stopListening}
                disabled={!transcript}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            {/* Tips */}
            <Text style={styles.tipText}>
              Speak naturally and clearly. Tap Done when finished.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Answer Prompts */}
      {answerPrompts.length > 0 && !value && (
        <View style={styles.promptsContainer}>
          {answerPrompts.map((prompt, index) => (
            <Text key={index} style={styles.promptText}>💭 {prompt}</Text>
          ))}
        </View>
      )}
      
      {/* Starter Phrases */}
      {starterPhrases.length > 0 && !value && (
        <View style={styles.startersContainer}>
          <Text style={styles.startersTitle}>Try starting with:</Text>
          <View style={styles.starterButtons}>
            {starterPhrases.map((starter, index) => (
              <TouchableOpacity
                key={index}
                style={styles.starterButton}
                onPress={() => handleStarterSelect(starter)}
              >
                <Text style={styles.starterButtonText}>{starter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={maxLength}
          style={styles.textInput}
          textAlignVertical="top"
        />
        
        {/* Voice Button */}
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={startListening}
          activeOpacity={0.7}
        >
          <View style={styles.voiceButtonInner}>
            <Text style={styles.voiceButtonIcon}>🎤</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Character Count */}
      <View style={styles.footer}>
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
        <Text style={styles.hint}>Tap 🎤 to speak</Text>
      </View>
      
      {/* Voice Modal */}
      {renderVoiceModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  promptsContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  promptText: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  startersContainer: {
    marginBottom: 16,
  },
  startersTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  starterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starterButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  starterButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  inputContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    minHeight: 150,
    position: 'relative',
  },
  textInput: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 24,
    minHeight: 118,
    paddingRight: 60,
  },
  voiceButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonIcon: {
    fontSize: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  voiceVisualization: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  outerCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#007AFF',
  },
  middleCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    opacity: 0.3,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 40,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  transcriptContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 120,
    minWidth: '100%',
  },
  transcriptText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#3A3A3C',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  doneButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tipText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
});