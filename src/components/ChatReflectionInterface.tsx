import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
  Vibration,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { questionsService, CategoryQuestion } from '../services/questionsLoader';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { habitTrackingService } from '../services/habitTrackingService';
import { personalityInsightsService } from '../services/personalityInsightsService';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  questionId?: string;
  imageUri?: string;
  imageInsights?: string;
}

export const ChatReflectionInterface = () => {
  const { dispatch } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<CategoryQuestion | null>(null);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [conversationStage, setConversationStage] = useState<'greeting' | 'questioning' | 'followup'>('greeting');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [wasVoiceUsed, setWasVoiceUsed] = useState(false);
  const recordingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start conversation with greeting
    startConversation();
    setupAudioMode();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const setupAudioMode = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      // Stop any existing recording first
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant audio recording permission to use voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      }

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) {
      console.log('No recording to stop');
      return;
    }

    try {
      console.log('Stopping recording...');
      
      // Stop animation immediately
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(0);
      
      // Update state immediately
      setIsRecording(false);

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at:', uri);

      // Clear recording reference
      setRecording(null);

      // Transcribe the audio
      if (uri) {
        const transcribedText = await transcribeAudio(uri);
        if (transcribedText && transcribedText.trim()) {
          setCurrentInput(transcribedText);
          setWasVoiceUsed(true);
        }
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const transcribeAudio = async (uri: string): Promise<string> => {
    try {
      console.log('Transcribing audio from:', uri);
      
      // Check if OpenAI API key is available
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.log('OpenAI API key not configured, using placeholder transcription');
        return 'This is a placeholder transcription. Configure OpenAI API key for real transcription.';
      }
      
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      } as any);
      formData.append('model', 'whisper-1');

      // Use OpenAI Whisper API for transcription
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Transcription result:', result);
        return result.text || '';
      } else {
        const errorText = await response.text();
        console.error('Transcription failed:', response.status, response.statusText, errorText);
        return 'Voice transcription failed. Please type your response.';
      }
    } catch (error) {
      console.error('Transcription error:', error);
      return 'Voice transcription error. Please type your response.';
    }
  };

  const startConversation = () => {
    const greetings = [
      "Hi there! ✨ I'm here to help you discover more about yourself through meaningful reflection. Ready to explore what makes you uniquely you?",
      "Welcome! 🌟 I'm excited to be part of your self-discovery journey. Through our conversations, we'll uncover insights that help you connect authentically with others.",
      "Hello! 💫 I'm here to guide you through thoughtful reflection. Each response you share helps build a genuine picture of who you are.",
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    const greetingMessage: ChatMessage = {
      id: generateId(),
      text: greeting,
      isBot: true,
      timestamp: new Date(),
    };
    
    setMessages([greetingMessage]);
    
    // After a short delay, ask the first question
    setTimeout(() => {
      askQuestion();
    }, 2000);
  };

  const askQuestion = () => {
    const question = questionsService.getDailyReflectionQuestion();
    setCurrentQuestion(question);
    
    const questionMessage: ChatMessage = {
      id: generateId(),
      text: question.question,
      isBot: true,
      timestamp: new Date(),
      questionId: question.id,
    };
    
    setMessages(prev => [...prev, questionMessage]);
    setIsWaitingForAnswer(true);
    setConversationStage('questioning');
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !currentQuestion) return;

    const answerText = currentInput.trim();
    
    // Add user's message
    const userMessage: ChatMessage = {
      id: generateId(),
      text: answerText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Save the reflection
    try {
      const newAnswer = {
        id: generateId(),
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        text: answerText,
        category: currentQuestion.category,
        timestamp: new Date().toISOString(),
        hearts: 0,
        isLiked: false,
      };

      dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
      
      await habitTrackingService.addReflection(
        currentQuestion.question,
        answerText,
        wasVoiceUsed
      );

      // Analyze reflection for personality insights
      await personalityInsightsService.analyzeReflection(
        currentQuestion.question,
        answerText,
        currentQuestion.category,
        wasVoiceUsed
      );

      // Bot response after user answers
      setTimeout(() => {
        provideFeedbackAndContinue(answerText);
      }, 1000);

      // Check for achievements
      setTimeout(() => {
        checkForAchievements(answerText);
      }, 2500);

    } catch (error) {
      console.error('Error saving reflection:', error);
    }

    setCurrentInput('');
    setWasVoiceUsed(false);
    setIsWaitingForAnswer(false);
  };

  const provideFeedbackAndContinue = (answerText: string) => {
    // Analyze the user's response for more authentic feedback
    const userResponse = answerText.toLowerCase();
    const responseLength = userResponse.split(' ').length;
    
    let encouragement = "";
    
    // More authentic responses based on content analysis
    if (userResponse.includes('difficult') || userResponse.includes('hard') || userResponse.includes('struggle')) {
      encouragement = "Thank you for being so vulnerable. It takes real courage to share something difficult. 💙";
    } else if (userResponse.includes('happy') || userResponse.includes('joy') || userResponse.includes('love')) {
      encouragement = "Your positivity is contagious! It's beautiful to see you embrace these joyful moments.";
    } else if (userResponse.includes('learn') || userResponse.includes('grow') || userResponse.includes('change')) {
      encouragement = "I can see you're someone who values growth. That self-awareness is really powerful.";
    } else if (responseLength > 50) {
      encouragement = "Wow, thank you for opening up so deeply. The detail in your reflection shows real introspection.";
    } else if (responseLength < 10) {
      encouragement = "Sometimes the most profound truths are the simplest. Would you like to explore this further?";
    } else if (userResponse.includes('family') || userResponse.includes('friend') || userResponse.includes('relationship')) {
      encouragement = "Relationships really shape who we are, don't they? Thank you for sharing this connection.";
    } else if (userResponse.includes('work') || userResponse.includes('career') || userResponse.includes('job')) {
      encouragement = "Our professional lives are such a big part of our identity. I appreciate you sharing this aspect.";
    } else {
      // Fallback to varied generic responses
      const genericResponses = [
        "Thank you for sharing that with me. Your authenticity really shines through.",
        "I appreciate your honesty here. Every reflection helps paint a clearer picture of who you are.",
        "That's really insightful. These moments of reflection are building something meaningful.",
      ];
      encouragement = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }

    const feedbackMessage: ChatMessage = {
      id: generateId(),
      text: encouragement,
      isBot: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, feedbackMessage]);

    // Ask if they want to continue or explore further
    setTimeout(() => {
      offerContinueOptions();
    }, 1500);
  };

  const offerContinueOptions = () => {
    const options = [
      "Would you like to explore another question, or shall we dive deeper into what you just shared?",
      "Want to continue with another question, share a photo from your day, or explore this topic further?",
      "What would you like to do next - another reflection, share a moment from your day through a photo, or go deeper?",
    ];

    // 40% chance to offer photo sharing
    const offerPhoto = Math.random() < 0.4;
    const messageText = offerPhoto ? options[1] : options[0];

    const continueMessage: ChatMessage = {
      id: generateId(),
      text: messageText,
      isBot: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, continueMessage]);
    setConversationStage('followup');
  };

  const handleContinueReflecting = () => {
    const continueMessage: ChatMessage = {
      id: generateId(),
      text: "Let's continue reflecting",
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, continueMessage]);

    setTimeout(() => {
      const nextMessage: ChatMessage = {
        id: generateId(),
        text: "Perfect! Here's another question for you to explore:",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, nextMessage]);
      
      setTimeout(() => {
        askQuestion();
      }, 1000);
    }, 500);
  };

  const handleExploreDeeper = () => {
    const exploreMessage: ChatMessage = {
      id: generateId(),
      text: "Tell me more about that",
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, exploreMessage]);

    setTimeout(() => {
      const followupPrompts = [
        "What do you think influenced that perspective?",
        "How does that make you feel when you think about it now?",
        "What would you tell someone else in a similar situation?",
        "How has this experience shaped who you are today?",
        "What surprised you most about your own response?",
      ];

      const prompt = followupPrompts[Math.floor(Math.random() * followupPrompts.length)];

      const followupMessage: ChatMessage = {
        id: generateId(),
        text: prompt,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, followupMessage]);
      setIsWaitingForAnswer(true);
    }, 1000);
  };

  const handleSharePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to share them.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const userMessage: ChatMessage = {
          id: generateId(),
          text: "Here's a photo from my day",
          isBot: false,
          timestamp: new Date(),
          imageUri: result.assets[0].uri,
        };

        setMessages(prev => [...prev, userMessage]);

        // Analyze the photo and provide insights
        setTimeout(() => {
          analyzePhoto(result.assets[0].uri);
        }, 1000);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzePhoto = (imageUri: string) => {
    // Simulate AI analysis of the photo for personality insights
    const photoInsights = [
      "I can see this moment captures something meaningful to you. What drew you to this particular scene or moment?",
      "There's something beautiful about everyday moments like this. How does sharing this photo make you feel?",
      "Photos often tell stories beyond what we see. What story does this image tell about your day?",
      "I notice you chose to capture this moment. What made it special enough to preserve?",
      "This photo gives me insight into what you value. Can you tell me more about why this moment mattered?",
    ];

    const insight = photoInsights[Math.floor(Math.random() * photoInsights.length)];

    const botResponse: ChatMessage = {
      id: generateId(),
      text: insight,
      isBot: true,
      timestamp: new Date(),
      imageInsights: "Photo analyzed for personality insights",
    };

    setMessages(prev => [...prev, botResponse]);
    setIsWaitingForAnswer(true);
  };

  const checkForAchievements = async (answerText: string) => {
    const messageCount = messages.filter(m => !m.isBot).length;
    const wordCount = answerText.split(' ').length;
    
    let achievementMessage = null;

    // First reflection achievement
    if (messageCount === 1) {
      achievementMessage = "🎉 Achievement Unlocked: First Steps! \n\nYou've taken your first step on this journey of self-discovery. Welcome to the community!";
    }
    // Deep thinker achievement
    else if (wordCount > 40 && messageCount === 3) {
      achievementMessage = "🧠 Achievement Unlocked: Deep Thinker! \n\nYour thoughtful reflections show real introspection. You're building an authentic profile!";
    }
    // Vulnerability achievement
    else if ((answerText.toLowerCase().includes('difficult') || answerText.toLowerCase().includes('struggle') || answerText.toLowerCase().includes('vulnerable')) && messageCount >= 2) {
      achievementMessage = "💙 Achievement Unlocked: Vulnerability Warrior! \n\nSharing something personal takes courage. Your authenticity is inspiring!";
    }
    // Consistency achievement
    else if (messageCount === 5) {
      achievementMessage = "⭐ Achievement Unlocked: Reflection Master! \n\nFive thoughtful responses! You're 25% of the way to unlocking 1-on-1 chats!";
    }

    if (achievementMessage) {
      setTimeout(() => {
        const achievement: ChatMessage = {
          id: generateId(),
          text: achievementMessage,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, achievement]);
      }, 1000);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          message.isBot ? styles.botBubble : styles.userBubble
        ]}>
          {message.imageUri && (
            <Image 
              source={{ uri: message.imageUri }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          <Text style={[
            styles.messageText,
            message.isBot ? styles.botText : styles.userText,
            message.imageUri && styles.messageTextWithImage
          ]}>
            {message.text}
          </Text>
        </View>
        <Text style={[
          styles.timestamp,
          message.isBot ? styles.botTimestamp : styles.userTimestamp
        ]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        
        {/* Continue/Explore buttons during followup stage */}
        {conversationStage === 'followup' && !isWaitingForAnswer && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleContinueReflecting}
            >
              <Text style={styles.optionButtonText}>New Question</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleSharePhoto}
            >
              <Text style={styles.optionButtonText}>Share Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleExploreDeeper}
            >
              <Text style={styles.optionButtonText}>Explore Deeper</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Input area */}
      {(isWaitingForAnswer || conversationStage === 'questioning') && (
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={handleSharePhoto}
            >
              <Text style={styles.photoButtonIcon}>📷</Text>
            </TouchableOpacity>
            
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, isRecording && styles.textInputRecording]}
                value={currentInput}
                onChangeText={setCurrentInput}
                placeholder={isRecording ? "Recording..." : "Type your thoughts or hold to record"}
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={500}
                autoFocus={isWaitingForAnswer && !isRecording}
                editable={!isRecording}
              />
              
              {/* Voice recording button */}
              <TouchableOpacity 
                style={styles.voiceButton}
                activeOpacity={0.8}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                delayLongPress={100}
              >
                <View style={[styles.voiceButtonContent, isRecording && styles.voiceButtonContentRecording]}>
                  {isRecording ? (
                    <Animated.View style={[
                      styles.recordingIndicator,
                      {
                        opacity: recordingAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                        transform: [{
                          scale: recordingAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.05],
                          }),
                        }],
                      }
                    ]}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording...</Text>
                    </Animated.View>
                  ) : (
                    <Text style={styles.voiceButtonIcon}>🎤</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                currentInput.trim().length === 0 && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={currentInput.trim().length === 0 || isRecording}
            >
              <Text style={[
                styles.sendButtonText,
                currentInput.trim().length === 0 && styles.sendButtonTextDisabled
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#000000',
  },
  userText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  botTimestamp: {
    textAlign: 'left',
  },
  userTimestamp: {
    textAlign: 'right',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  optionButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sendButtonTextDisabled: {
    color: '#8E8E93',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageTextWithImage: {
    marginTop: 0,
  },
  photoButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonIcon: {
    fontSize: 20,
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    minHeight: 24,
    paddingRight: 50, // Make room for voice button
  },
  textInputRecording: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  voiceButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  voiceButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  voiceButtonContentRecording: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonIcon: {
    fontSize: 18,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});