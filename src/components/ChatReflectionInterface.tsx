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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { questionsService, CategoryQuestion } from '../services/questionsLoader';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { habitTrackingService } from '../services/habitTrackingService';

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

  useEffect(() => {
    // Start conversation with greeting
    startConversation();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const startConversation = () => {
    const greetingMessage: ChatMessage = {
      id: generateId(),
      text: "Hi! I'm here to help you reflect on your thoughts and experiences. Let's start with a question that might spark some interesting insights.",
      isBot: true,
      timestamp: new Date(),
    };
    
    setMessages([greetingMessage]);
    
    // After a short delay, ask the first question
    setTimeout(() => {
      askQuestion();
    }, 1500);
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

    // Add user's message
    const userMessage: ChatMessage = {
      id: generateId(),
      text: currentInput.trim(),
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
        text: currentInput.trim(),
        category: currentQuestion.category,
        timestamp: new Date().toISOString(),
        hearts: 0,
        isLiked: false,
      };

      dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
      
      await habitTrackingService.addReflection(
        currentQuestion.question,
        currentInput.trim(),
        false
      );

      // Bot response after user answers
      setTimeout(() => {
        provideFeedbackAndContinue();
      }, 1000);

    } catch (error) {
      console.error('Error saving reflection:', error);
    }

    setCurrentInput('');
    setIsWaitingForAnswer(false);
  };

  const provideFeedbackAndContinue = () => {
    const encouragements = [
      "Thank you for sharing that! Your reflection has been added to help build your authentic profile.",
      "That's a thoughtful response! I appreciate you taking the time to reflect deeply.",
      "Great insight! These reflections help us understand what makes you uniquely you.",
      "I love hearing your perspective on this. Your authentic voice really comes through.",
      "Beautiful reflection! These moments of honesty help create meaningful connections.",
    ];

    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

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
            <TextInput
              style={styles.textInput}
              value={currentInput}
              onChangeText={setCurrentInput}
              placeholder="Type your thoughts..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
              autoFocus={isWaitingForAnswer}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                currentInput.trim().length === 0 && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={currentInput.trim().length === 0}
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
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: '#F2F2F7',
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
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    minHeight: 24,
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
});