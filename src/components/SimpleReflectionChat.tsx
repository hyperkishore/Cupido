import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MinimalChatInput } from './MinimalChatInput';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { intelligentQuestionService } from '../services/intelligentQuestionService';
import { reflectionCoachService } from '../services/reflectionCoachService';
import { conversationMemoryService } from '../services/conversationMemoryService';
import { habitTrackingService } from '../services/habitTrackingService';
import { personalityInsightsService } from '../services/personalityInsightsService';
import { persistentStorage } from '../services/storage/persistentStorage';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  imageUri?: string;
  audioUri?: string;
  fileUri?: string;
  location?: { latitude: number; longitude: number };
}

interface SimpleReflectionChatProps {
  /**
   * Total bottom inset reserved for the tab bar + safe area so the input isn't hidden.
   */
  bottomInset?: number;
}

export const SimpleReflectionChat: React.FC<SimpleReflectionChatProps> = ({ bottomInset = 0 }) => {
  const { dispatch } = useAppState();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const userId = user?.id || user?.phoneNumber || 'guest';

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const startConversation = async () => {
    await conversationMemoryService.initialize();
    await intelligentQuestionService.initialize();
    
    const greeting = "Hey! I'm excited to get to know you better through our conversations. Ready to share what's on your mind?";
    
    setMessages([{
      id: generateId(),
      text: greeting,
      isBot: true,
      timestamp: new Date(),
    }]);
    
    setTimeout(() => {
      askQuestion();
    }, 1500);
  };

  const askQuestion = async () => {
    try {
      // Show typing indicator
      setIsTyping(true);
      
      const questionWithContext = await intelligentQuestionService.getQuestionWithMemoryContext('');
      
      if (!questionWithContext) {
        setIsTyping(false);
        return;
      }
      
      const { question, memoryReference, conversationLeadIn } = questionWithContext;
      setCurrentQuestion(question);
      
      // Build more natural message text
      let messageText = '';
      
      // Add natural transition based on conversation depth
      if (messages.length > 3) {
        const transitions = [
          "That's really insightful. ",
          "Thanks for sharing that. ",
          "I appreciate your openness. ",
          "Interesting perspective! ",
        ];
        messageText = transitions[Math.floor(Math.random() * transitions.length)];
      }
      
      if (memoryReference) {
        messageText += `${memoryReference} ${conversationLeadIn} ${question.question}`;
      } else {
        messageText += `${conversationLeadIn} ${question.question}`;
      }
      
      // Simulate natural typing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      setIsTyping(false);
      
      setMessages(prev => [...prev, {
        id: generateId(),
        text: messageText,
        isBot: true,
        timestamp: new Date(),
      }]);
      
      setIsWaitingForAnswer(true);
    } catch (error) {
      console.error('Error getting question:', error);
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (message: {
    text: string;
    imageUri?: string;
    fileUri?: string;
    location?: { latitude: number; longitude: number };
    audioUri?: string;
  }) => {
    if (!currentQuestion) return;
    
    const { text, imageUri, fileUri, location, audioUri } = message;
    
    // Create user message
    let displayText = text;
    if (imageUri) displayText += displayText ? '\n[Photo attached]' : '[Photo]';
    if (fileUri) displayText += displayText ? '\n[File attached]' : '[File]';
    if (location) displayText += displayText ? '\n[Location shared]' : '[Location]';
    if (audioUri) displayText += displayText ? '\n[Voice note]' : '[Voice note]';
    
    const userMessage: ChatMessage = {
      id: generateId(),
      text: displayText || 'Shared content',
      isBot: false,
      timestamp: new Date(),
      imageUri,
      audioUri,
      fileUri,
      location,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsWaitingForAnswer(false);
    
    try {
      // Process the reflection
      const coachTurn = await reflectionCoachService.createTurn(
        {
          question: {
            id: currentQuestion.id,
            text: currentQuestion.question,
            category: currentQuestion.theme,
          },
          recentThemes: [],
          conversationHistory: messages.slice(-6).map((msg) => ({
            role: msg.isBot ? 'coach' : 'user',
            content: msg.text,
          })),
        },
        displayText
      );
      
      // Save the answer
      const newAnswer = {
        id: generateId(),
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        text: displayText,
        category: currentQuestion.theme || 'Self-Discovery',
        timestamp: new Date().toISOString(),
        hearts: 0,
        isLiked: false,
        summary: coachTurn.aiResult.summary,
        insights: coachTurn.aiResult.insights,
        mood: coachTurn.aiResult.mood,
        tags: coachTurn.aiResult.tags,
      };
      
      dispatch({ type: 'ADD_ANSWER', payload: newAnswer });
      
      // Track in services
      await conversationMemoryService.addConversation(
        currentQuestion.id,
        currentQuestion.question,
        displayText,
        currentQuestion.theme || 'Self-Discovery',
        currentQuestion.theme,
        Boolean(audioUri)
      );
      
      await habitTrackingService.addReflection(
        currentQuestion.question,
        displayText,
        Boolean(audioUri)
      );
      
      await personalityInsightsService.analyzeReflection(
        currentQuestion.question,
        displayText,
        currentQuestion.theme || 'Self-Discovery',
        Boolean(audioUri)
      );
      
      // Add coach response
      setMessages(prev => [...prev, {
        id: generateId(),
        text: coachTurn.reply,
        isBot: true,
        timestamp: new Date(),
      }]);
      
      // Ask next question after delay
      setTimeout(() => {
        askQuestion();
      }, 2000);
      
    } catch (error) {
      console.error('Error processing reflection:', error);
      setIsWaitingForAnswer(true);
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View 
      key={message.id} 
      style={[
        styles.messageContainer,
        message.isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}
    >
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
          message.isBot ? styles.botText : styles.userText
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

  const tabBarOffset = Math.max(bottomInset - insets.bottom, 0);
  const bottomGutter = 120 + tabBarOffset + insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={tabBarOffset + insets.bottom + 24}
    >
      <View style={styles.innerContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: bottomGutter }]}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Coach is typing...</Text>
          </View>
        )}
        
        {/* Fixed input at bottom, lifted above the tab bar */}
        <View
          style={[
            styles.inputWrapper,
            {
              paddingBottom: insets.bottom + 12,
              bottom: tabBarOffset,
            },
          ]}
        >
          <MinimalChatInput 
            onSendMessage={handleSendMessage}
            placeholder={messages.length > 0 ? "Share your thoughts..." : "Say hello to start..."}
          />
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
  innerContainer: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 999,
    elevation: 999,
  },
  messageContainer: {
    marginBottom: 12,
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
    paddingVertical: 10,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: '#F5F5F5',
  },
  userBubble: {
    backgroundColor: '#000',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#000',
  },
  userText: {
    color: '#FFF',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  botTimestamp: {
    textAlign: 'left',
    marginLeft: 4,
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 4,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
