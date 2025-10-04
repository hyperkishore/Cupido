import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { chatAiService } from '../services/chatAiService';
import { chatDatabase, type ChatMessage as DBChatMessage, type ChatConversation } from '../services/chatDatabase';
import { generateId } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { userProfileService } from '../services/userProfileService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Natural conversation starters and responses
const CONVERSATION_STARTERS = [
  "Tell me about your week - what's been the highlight?",
  "What's something that made you smile recently?",
  "If you could have dinner with anyone tonight, who would it be?",
  "What's been on your mind lately?",
  "What's the best part of your day usually?",
  "What are you looking forward to this weekend?",
  "What's something you've been curious about?",
  "Tell me about a place that feels like home to you.",
];

// Getting-to-know-you questions for dating context
const GETTING_TO_KNOW_QUESTIONS = [
  "What's your idea of a perfect Saturday?",
  "What's something you're passionate about that people might not expect?",
  "What's the last thing that made you laugh out loud?",
  "If you could learn any skill instantly, what would it be?",
  "What's your go-to comfort food?",
  "What's the best advice you've ever received?",
  "What's something you've changed your mind about recently?",
  "What's a small thing that instantly improves your mood?",
  "What's your favorite way to unwind after a long day?",
  "What's something you're really good at that might surprise people?",
];

// Deeper questions for when conversation develops
const DEEPER_QUESTIONS = [
  "What's something you believe that most people disagree with?",
  "What's a moment that changed how you see the world?",
  "What's something you're working on improving about yourself?",
  "What does a meaningful relationship look like to you?",
  "What's something you've learned about yourself this year?",
  "What's a challenge you've overcome that you're proud of?",
  "What's something you wish people knew about you?",
  "What makes you feel most like yourself?",
];

// Natural, friendly responses
const FRIENDLY_RESPONSES = [
  "Oh interesting! ",
  "That sounds amazing! ",
  "I love that! ",
  "That's so cool! ",
  "Wow, ",
  "That's awesome! ",
  "I can totally see that! ",
  "",  // Sometimes no prefix
];

const FOLLOW_UPS = [
  "Tell me more about that!",
  "What was that like?",
  "How did that make you feel?",
  "What's the story behind that?",
  "I'd love to hear more!",
  "What drew you to that?",
  "How did you get into that?",
  "What's your favorite part about it?",
];

// Create user-specific storage key
const getSessionStorageKey = (userId: string) => `cupido_chat_session_${userId}`;

const getStoredSessionUserId = async (authUserId: string): Promise<string | null> => {
  const key = getSessionStorageKey(authUserId);

  if (Platform.OS === 'web') {
    try {
      const storage = (globalThis as any)?.localStorage as
        | { getItem: (key: string) => string | null }
        | undefined;
      return storage?.getItem(key) ?? null;
    } catch (error) {
      console.warn('Failed to read session from web storage', error);
      return null;
    }
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to read session from AsyncStorage', error);
    return null;
  }
};

const setStoredSessionUserId = async (authUserId: string, value: string) => {
  const key = getSessionStorageKey(authUserId);

  if (Platform.OS === 'web') {
    try {
      const storage = (globalThis as any)?.localStorage as
        | { setItem: (key: string, val: string) => void }
        | undefined;
      storage?.setItem(key, value);
    } catch (error) {
      console.warn('Failed to persist session to web storage', error);
    }
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to persist session to AsyncStorage', error);
  }
};

interface SimpleReflectionChatProps {
  onKeyboardToggle?: (isVisible: boolean) => void;
}

export const SimpleReflectionChat: React.FC<SimpleReflectionChatProps> = ({ onKeyboardToggle }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user: authUser } = useAuth(); // Get authenticated user from context

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Initialize chat with database - reinitialize when user changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupChat = async () => {
      // Clear existing messages when user changes
      setMessages([]);
      setConversationHistory([]);
      setConversationCount(0);

      unsubscribe = await initializeChat();
    };

    setupChat();

    return () => {
      unsubscribe?.();
    };
  }, [authUser?.id]); // Re-initialize when user changes

  const initializeChat = async (): Promise<(() => void) | undefined> => {
    try {
      setIsLoading(true);

      // Initialize user profile service
      await userProfileService.initialize();

      // Use authenticated user or generate demo user
      let sessionUserId: string;
      let userName: string;

      if (authUser) {
        // Use authenticated user's phone number or ID
        sessionUserId = authUser.phoneNumber || authUser.id;
        userName = authUser.name || `User ${sessionUserId.slice(-6)}`;
        console.log('🔑 Using authenticated user:', sessionUserId);
      } else {
        // Demo mode: Generate or retrieve user-specific session ID
        const demoUserId = 'demo_user';
        sessionUserId = await getStoredSessionUserId(demoUserId) || `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        if (!await getStoredSessionUserId(demoUserId)) {
          await setStoredSessionUserId(demoUserId, sessionUserId);
        }

        userName = `Demo User`;
        console.log('🔑 Using demo session user ID:', sessionUserId);
      }

      const user = await chatDatabase.getOrCreateUser(sessionUserId, userName);

      if (!user) {
        console.error('Failed to create user');
        return;
      }

      setUserId(user.id);
      
      // Get or create conversation
      const conversation = await chatDatabase.getOrCreateConversation(user.id);
      if (!conversation) {
        console.error('Failed to create conversation');
        return;
      }
      
      setCurrentConversation(conversation);
      
      // Load chat history
      const history = await chatDatabase.getChatHistory(conversation.id);
      
      if (history.length > 0) {
        // Convert DB messages to UI messages
        const uiMessages: Message[] = history.map(msg => ({
          id: msg.id,
          text: msg.content,
          isBot: msg.is_bot,
          timestamp: new Date(msg.created_at),
        }));
        
        setMessages(uiMessages);
        setConversationCount(history.filter(msg => !msg.is_bot).length);
        
        // Rebuild conversation history for AI
        const aiHistory = history.map(msg => ({
          role: msg.is_bot ? 'assistant' as const : 'user' as const,
          content: msg.content,
        }));
        setConversationHistory(aiHistory);
      } else {
        // Start with a greeting if no history
        const greetings = [
          "Hey! How's your day going?",
          "Hi there! What's been happening with you lately?",
          "Hey! Good to see you here. What's on your mind?",
          "Hi! How are you feeling today?",
          "Hey! What's been the best part of your week so far?",
        ];
        
        const greetingText = greetings[Math.floor(Math.random() * greetings.length)];
        
        // Save greeting to database
        const savedMessage = await chatDatabase.saveMessage(
          conversation.id,
          greetingText,
          true, // is_bot
          undefined, // no AI model for greeting
          { type: 'greeting' }
        );
        
        if (savedMessage) {
          const greeting: Message = {
            id: savedMessage.id,
            text: greetingText,
            isBot: true,
            timestamp: new Date(savedMessage.created_at),
          };
          setMessages([greeting]);
        }
      }
      
      // Setup real-time subscription - but don't add messages we create locally
      // This is mainly for multi-device sync or admin messages
      const localMessageIds = new Set<string>();
      const unsubscribe = chatDatabase.subscribeToMessages(conversation.id, (newMessage) => {
        // Ignore messages we created locally
        if (localMessageIds.has(newMessage.id)) return;

        // Only add messages that don't already exist
        setMessages(prev => {
          const exists = prev.find(msg => msg.id === newMessage.id);
          if (exists) return prev;

          return [...prev, {
            id: newMessage.id,
            text: newMessage.content,
            isBot: newMessage.is_bot,
            timestamp: new Date(newMessage.created_at),
          }];
        });
      });

      // Store reference to local message IDs for this session
      (window as any).__localChatMessageIds = localMessageIds;

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard listeners
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        onKeyboardToggle?.(true);
      }
    );

    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        onKeyboardToggle?.(false);
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [onKeyboardToggle]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const generateResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    try {
      // Update conversation history to include the new user message BEFORE calling AI
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];
      
      console.log('💬 Sending to AI:', {
        userMessage,
        historyLength: updatedHistory.length,
        fullHistory: updatedHistory
      });

      // Call the AI service with UPDATED conversation history
      const aiResponse = await chatAiService.generateResponse(
        userMessage,
        updatedHistory,
        conversationCount
      );

      // Add natural delay to feel more human
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

      // Save bot message to database
      if (currentConversation) {
        console.log('AI Response received:', {
          message: aiResponse.message,
          model: aiResponse.usedModel,
          shouldAskQuestion: aiResponse.shouldAskQuestion
        });

        const savedBotMessage = await chatDatabase.saveMessage(
          currentConversation.id,
          aiResponse.message,
          true, // is_bot
          aiResponse.usedModel, // ai_model used (was aiResponse.model)
          { 
            response_time: Date.now(),
            conversation_count: conversationCount + 1,
            shouldAskQuestion: aiResponse.shouldAskQuestion
          }
        );

        if (savedBotMessage) {
          // Mark this message as locally created to prevent duplication
          const localIds = (window as any).__localChatMessageIds;
          if (localIds) localIds.add(savedBotMessage.id);

          const botMessage: Message = {
            id: savedBotMessage.id,
            text: aiResponse.message,
            isBot: true,
            timestamp: new Date(savedBotMessage.created_at),
          };

          setMessages(prev => [...prev, botMessage]);
        }
      }
      
      setConversationCount(prev => prev + 1);
      
      // Update conversation history for context (use the updated history we passed to AI)
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: aiResponse.message }
      ]);

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback to a friendly error message
      const fallbackText = "Sorry, I'm having trouble connecting right now! But I'm still here - what else would you like to chat about?";
      
      // Save fallback message to database
      if (currentConversation) {
        const savedFallback = await chatDatabase.saveMessage(
          currentConversation.id,
          fallbackText,
          true, // is_bot
          undefined, // no AI model for fallback
          { type: 'error_fallback' }
        );

        if (savedFallback) {
          const fallbackMessage: Message = {
            id: savedFallback.id,
            text: fallbackText,
            isBot: true,
            timestamp: new Date(savedFallback.created_at),
          };
          
          setMessages(prev => [...prev, fallbackMessage]);
        }
      }
      
      setConversationCount(prev => prev + 1);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePhotoUpload = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload images.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;

      // Create a message indicating photo was shared
      const photoMessage: Message = {
        id: generateId(),
        text: '📷 [Photo shared]',
        isBot: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, photoMessage]);

      // Generate a response about the photo
      setTimeout(() => {
        const photoResponse: Message = {
          id: generateId(),
          text: 'Nice photo! Tell me more about it - what does this mean to you?',
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, photoResponse]);
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Extract profile information from user messages
    const previousMessages = messages.filter(m => !m.isBot).map(m => m.text);
    const profileUpdates = userProfileService.extractProfileFromMessage(messageText, previousMessages);
    if (Object.keys(profileUpdates).length > 0) {
      await userProfileService.updateProfile(profileUpdates);

      // If we just got the user's name, log it
      if (profileUpdates.name) {
        console.log('User name collected:', profileUpdates.name);
      }
    }

    console.log('📤 Sending message:', messageText);

    // Save user message to database first
    if (currentConversation) {
      const savedUserMessage = await chatDatabase.saveMessage(
        currentConversation.id,
        messageText,
        false, // is_bot = false for user
        undefined, // no AI model for user messages
        { message_length: messageText.length }
      );

      if (savedUserMessage) {
        const userMessage: Message = {
          id: savedUserMessage.id,
          text: messageText,
          isBot: false,
          timestamp: new Date(savedUserMessage.created_at),
        };
        
        setMessages(prev => [...prev, userMessage]);
      }
    }

    // Generate response
    try {
      await generateResponse(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Fixed positioning calculations
  const INPUT_AREA_HEIGHT = 70;
  const inputBottomPosition = 0; // Always at the bottom
  const messagesBottomPadding = INPUT_AREA_HEIGHT + tabBarHeight + 10;

  return (
    <View style={styles.container}>
      {/* Messages area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: messagesBottomPadding }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.isBot ? styles.botBubble : styles.userBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isBot ? styles.botText : styles.userText,
                ]}
              >
                {message.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        ))}
        
        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed input area */}
      <View 
        style={[
          styles.inputWrapper,
          { 
            bottom: inputBottomPosition,
            height: INPUT_AREA_HEIGHT,
          }
        ]}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handlePhotoUpload}
          >
            <Feather name="plus" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your thoughts..."
            placeholderTextColor="#999"
            multiline
            maxLength={10000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Feather
              name="send"
              size={20}
              color={(inputText.trim() && !isSending) ? '#007AFF' : '#C0C0C0'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#000',
  },
  userText: {
    color: '#FFF',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 4,
  },
  typingContainer: {
    padding: 8,
    alignItems: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  inputWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 22,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
