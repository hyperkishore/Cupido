import React, { useState, useRef, useEffect, Fragment } from 'react';
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
  Image,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { chatAiService } from '../services/chatAiService';
import { chatDatabase, type ChatMessage as DBChatMessage, type ChatConversation, type ImageAttachment } from '../services/chatDatabase';
import { generateId } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { userProfileService } from '../services/userProfileService';
import { ImageUpload } from './ImageUpload';
import { ImageMessage } from './ImageMessage';
import { processImage, ImageProcessingResult } from '../utils/imageUtils';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  imageUri?: string; // Legacy support for existing images
  imageAttachments?: ImageAttachment[]; // New support for processed images
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
      // Use window.localStorage directly for better reliability
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        console.log(`📦 Retrieved session from localStorage: ${key} = ${value}`);
        return value;
      }
      return null;
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
      // Use window.localStorage directly for better reliability
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        console.log(`💾 Saved session to localStorage: ${key} = ${value}`);
      }
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

const DEBUG = false; // Set to true for verbose logging during development

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

  // Refs for test message handler to avoid race conditions
  const messagesRef = useRef<Message[]>([]);
  const isTypingRef = useRef(false);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const userIdRef = useRef<string>('');
  const isSendingRef = useRef(false);

  // Deduplication: Track recently processed test messages to prevent duplicates
  const processedTestMessagesRef = useRef<Set<string>>(new Set());

  // Update refs when state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    conversationIdRef.current = currentConversation?.id;
  }, [currentConversation]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  // Initialize chat with database - reinitialize when user changes
  useEffect(() => {
    if (DEBUG) console.log('[useEffect setupChat] 🔄 Triggered - authUser?.id:', authUser?.id);
    let unsubscribe: (() => void) | undefined;

    const setupChat = async () => {
      if (DEBUG) console.log('[setupChat] 🚀 Starting chat setup...');
      // Clear existing messages when user changes
      setMessages([]);
      setConversationHistory([]);
      setConversationCount(0);
      if (DEBUG) console.log('[setupChat] ✓ Cleared existing messages');

      if (DEBUG) console.log('[setupChat] Calling initializeChat...');
      unsubscribe = await initializeChat();
      if (DEBUG) console.log('[setupChat] ✓ initializeChat returned, unsubscribe:', unsubscribe ? 'function' : 'undefined');
    };

    setupChat();

    return () => {
      if (DEBUG) console.log('[useEffect setupChat] Cleanup - calling unsubscribe');
      unsubscribe?.();
    };
  }, [authUser?.id]); // Re-initialize when user changes

  // Forward console logs to parent dashboard
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (window.parent === window) return; // Not in iframe

    const forwardToParent = (level: string, args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      window.parent.postMessage({
        type: 'app-console-log',
        level,
        message,
        timestamp: new Date().toISOString()
      }, '*');
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      originalLog(...args);
      forwardToParent('log', args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      forwardToParent('warn', args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      forwardToParent('error', args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Listen for test commands from test dashboard
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleTestMessage = async (event: MessageEvent) => {
      const { type, message } = event.data;

      switch (type) {
        case 'test-send-message':
          // Deduplication: Use content-based key (simpler and more reliable than time-based)
          const conversationId = conversationIdRef.current || 'no-conversation';
          const messageKey = `${conversationId}_${message.trim().toLowerCase()}`;

          if (processedTestMessagesRef.current.has(messageKey)) {
            console.log('[TEST] ⚠️  DUPLICATE MESSAGE BLOCKED:', message.substring(0, 50));
            return; // Skip duplicate
          }

          // Mark this message as processed
          processedTestMessagesRef.current.add(messageKey);

          // Clean up after 5 seconds (prevents memory leak for long test sessions)
          setTimeout(() => {
            processedTestMessagesRef.current.delete(messageKey);
          }, 5000);

          // Simulate sending a message from test dashboard
          console.log('[TEST] ✅ Received test message command:', message);
          console.log('[TEST] Current state:', {
            currentInputText: inputText,
            isSending,
            messageLength: message?.length
          });

          // Directly call handleSend with the message (no state involved)
          console.log('[TEST] Calling handleSend directly with message...');
          handleSend(message);
          break;

        case 'test-clear-session':
          // Clear session for testing new user flow
          console.log('[TEST] Clearing session for new user test');
          if (typeof window !== 'undefined' && window.localStorage) {
            const keys = Object.keys(window.localStorage);
            keys.forEach(key => {
              if (key.startsWith('cupido_')) {
                window.localStorage.removeItem(key);
              }
            });
          }
          // Reinitialize chat
          initializeChat();
          break;

        case 'test-get-state':
          // Return current state to test dashboard using refs to avoid race conditions
          const state = {
            messageCount: messagesRef.current.length,
            isTyping: isTypingRef.current,
            isSending: isSendingRef.current,  // Use ref for immediate value
            conversationId: conversationIdRef.current,
            userId: userIdRef.current,
            profile: userProfileService.getProfile(),
          };
          console.log('[TEST] test-get-state response:', state);
          // Send response back to parent window
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'test-state-response',
              state
            }, '*');
          }
          break;
          
        case 'simulator-response':
          // Handle simulator responses from the test dashboard
          const { message: simResponse, personaName } = event.data;
          if (!simResponse) break;
          
          console.log(`[SIMULATOR] Received response from ${personaName || 'simulator'}:`, simResponse);
          
          // Add the simulator response as an AI message
          const newBotMessage: ChatMessageType = {
            id: `${Date.now()}-simulator`,
            text: simResponse,
            isBot: true,
            timestamp: new Date().toISOString(),
          };
          
          setMessages(prev => [...prev, newBotMessage]);
          messagesRef.current = [...messagesRef.current, newBotMessage];
          
          // Save to database if conversation exists
          if (currentConversation) {
            try {
              await chatDatabase.addMessage(
                currentConversation.id,
                simResponse,
                'ai',
                { simulatorPersona: personaName }
              );
            } catch (error) {
              console.error('[SIMULATOR] Error saving message:', error);
            }
          }
          break;
      }
    };

    window.addEventListener('message', handleTestMessage);

    return () => {
      window.removeEventListener('message', handleTestMessage);
    };
  }, []); // Empty dependency array - listener stays active and uses refs

  const initializeChat = async (): Promise<(() => void) | undefined> => {
    if (DEBUG) console.log('[initializeChat] 🚀 Starting initialization...');
    if (DEBUG) console.log('[initializeChat] authUser:', authUser ? `exists (id: ${authUser.id})` : 'null');

    try {
      setIsLoading(true);

      // Initialize user profile service
      if (DEBUG) console.log('[initializeChat] Step 1: Initializing user profile service...');
      await userProfileService.initialize();
      if (DEBUG) console.log('[initializeChat] ✓ User profile service initialized');

      // Use authenticated user or generate demo user
      let sessionUserId: string;
      let userName: string;

      if (authUser) {
        if (DEBUG) console.log('[initializeChat] Step 2a: Using authenticated user path...');
        // Use authenticated user's phone number or ID
        sessionUserId = authUser.phoneNumber || authUser.id;
        userName = authUser.name || `User ${sessionUserId.slice(-6)}`;
        if (DEBUG) console.log('[initializeChat] 🔑 Authenticated user - sessionUserId:', sessionUserId, 'userName:', userName);

        // Check if this user has a stored session
        const storedSessionId = await getStoredSessionUserId(sessionUserId);
        if (DEBUG) console.log('[initializeChat] Stored session check:', storedSessionId ? 'found' : 'not found');
        if (!storedSessionId) {
          // Store the session ID for this user
          await setStoredSessionUserId(sessionUserId, sessionUserId);
          if (DEBUG) console.log('[initializeChat] ✓ Stored new session ID');
        }
      } else {
        if (DEBUG) console.log('[initializeChat] Step 2b: Using DEMO MODE path...');
        // Demo mode: Generate or retrieve user-specific session ID
        const demoUserId = 'demo_user';
        if (DEBUG) console.log('[initializeChat] Checking for existing demo session...');
        const storedSessionId = await getStoredSessionUserId(demoUserId);
        if (DEBUG) console.log('[initializeChat] Stored demo session result:', storedSessionId || 'none found');

        if (storedSessionId) {
          // Use existing session ID
          sessionUserId = storedSessionId;
          if (DEBUG) console.log('[initializeChat] 🔑 Retrieved existing demo session:', sessionUserId);
        } else {
          // Generate new session ID only if none exists
          sessionUserId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          if (DEBUG) console.log('[initializeChat] 🔑 Generated NEW demo session:', sessionUserId);
          await setStoredSessionUserId(demoUserId, sessionUserId);
          if (DEBUG) console.log('[initializeChat] ✓ Stored new demo session ID');
        }

        userName = `Demo User`;
        if (DEBUG) console.log('[initializeChat] Demo userName:', userName);
      }

      if (DEBUG) console.log('[initializeChat] Step 3: Creating/getting user from database...');
      if (DEBUG) console.log('[initializeChat] Calling chatDatabase.getOrCreateUser with:', { sessionUserId, userName });
      const user = await chatDatabase.getOrCreateUser(sessionUserId, userName);
      if (DEBUG) console.log('[initializeChat] User result:', user);

      if (!user) {
        console.error('[initializeChat] ❌ Failed to create user - user is null/undefined');
        return;
      }

      if (DEBUG) console.log('[initializeChat] Step 4: Setting userId state...');
      if (DEBUG) console.log('[initializeChat] User object from DB:', JSON.stringify(user));
      setUserId(user.id);
      // CRITICAL: Update ref immediately for test compatibility (don't wait for useEffect)
      userIdRef.current = user.id;
      if (DEBUG) console.log('[initializeChat] ✅ User ID set in state AND ref:', user.id);

      // Get or create conversation
      if (DEBUG) console.log('[initializeChat] Step 5: Creating/getting conversation...');
      const conversation = await chatDatabase.getOrCreateConversation(user.id);
      if (DEBUG) console.log('[initializeChat] Conversation result:', conversation);

      if (!conversation) {
        console.error('[initializeChat] ❌ Failed to create conversation - conversation is null/undefined');
        return;
      }

      if (DEBUG) console.log('[initializeChat] Step 6: Setting currentConversation state...');
      setCurrentConversation(conversation);
      // CRITICAL: Update ref immediately for test compatibility (don't wait for useEffect)
      conversationIdRef.current = conversation.id;
      if (DEBUG) console.log('[initializeChat] ✅ Conversation set in state AND ref:', conversation.id);

      // Load chat history (increased limit to load more messages)
      const history = await chatDatabase.getChatHistory(conversation.id, 200);
      if (DEBUG) console.log(`📚 Loaded ${history.length} messages from database for conversation ${conversation.id}`);

      if (history.length > 0) {
        // Convert DB messages to UI messages and load image attachments
        const uiMessages: Message[] = await Promise.all(
          history.map(async (msg) => {
            const baseMessage: Message = {
              id: msg.id,
              text: msg.content,
              isBot: msg.is_bot,
              timestamp: new Date(msg.created_at),
            };

            // Check if this message has image attachments - use lazy loading
            if (msg.metadata?.hasImage) {
              // Create placeholder for lazy loading - don't block chat initialization
              baseMessage.imageAttachments = [{
                id: msg.metadata?.imageAttachmentId || `placeholder_${msg.id}`,
                conversation_id: conversation.id,
                user_id: user.id,
                image_data: '', // Empty - will be loaded on demand
                mime_type: 'image/jpeg', // Default
                file_size: 0,
                created_at: msg.created_at,
                metadata: { 
                  isPlaceholder: true, 
                  messageId: msg.id,
                  attachmentId: msg.metadata?.imageAttachmentId 
                }
              } as ImageAttachment];
              
              // Hide message text for image messages unless it's descriptive
              if (!msg.metadata?.isDescriptiveText) {
                baseMessage.text = '';
              }
              
              console.log('📋 Created image placeholder for message:', msg.id);
            }

            return baseMessage;
          })
        );
        
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
      // IMPORTANT: We'll disable the subscription for now to prevent duplicates
      const unsubscribe = () => {}; // Disabled subscription to prevent duplicates

      // Store reference to local message IDs for this session
      (window as any).__localChatMessageIds = new Set<string>();

      if (DEBUG) console.log('[initializeChat] ✅ Initialization complete - returning unsubscribe function');
      return unsubscribe;
    } catch (error) {
      console.error('[initializeChat] ❌ ERROR during initialization:', error);
      console.error('[initializeChat] Error details:', JSON.stringify(error));
      console.error('[initializeChat] Stack trace:', error instanceof Error ? error.stack : 'no stack');
    } finally {
      if (DEBUG) console.log('[initializeChat] Finally block - setting isLoading to false');
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

  const generateResponse = async (userMessage: string, conversationId?: string) => {
    if (DEBUG) console.log('[MOBILE DEBUG] generateResponse called with:', userMessage);
    if (DEBUG) console.log('[MOBILE DEBUG] currentConversation in generateResponse:', currentConversation);
    if (DEBUG) console.log('[MOBILE DEBUG] conversationId passed:', conversationId);
    setIsTyping(true);

    // Define activeConversationId in function scope so it's available in catch block
    const activeConversationId = conversationId || currentConversation?.id;

    try {
      // Update conversation history to include the new user message BEFORE calling AI
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];

      if (DEBUG) console.log('💬 Sending to AI:', {
        userMessage,
        historyLength: updatedHistory.length,
        fullHistory: updatedHistory
      });

      if (DEBUG) console.log('[MOBILE DEBUG] Calling chatAiService.generateResponse');

      // Call the AI service with UPDATED conversation history (with 30s timeout)
      const aiResponsePromise = chatAiService.generateResponse(
        userMessage,
        updatedHistory,
        conversationCount
      );

      // Timeout wrapper to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT: Response took longer than 30s')), 30000)
      );

      const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);
      if (DEBUG) console.log('[MOBILE DEBUG] AI Response received:', aiResponse);

      // Add natural delay to feel more human
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

      // Save bot message to database
      if (DEBUG) console.log('🔍 Active conversation ID for saving bot message:', activeConversationId);

      if (activeConversationId) {
        if (DEBUG) console.log('AI Response received:', {
          message: aiResponse.message,
          model: aiResponse.usedModel,
          shouldAskQuestion: aiResponse.shouldAskQuestion
        });

        const savedBotMessage = await chatDatabase.saveMessage(
          activeConversationId,
          aiResponse.message,
          true, // is_bot
          aiResponse.usedModel, // ai_model used (was aiResponse.model)
          {
            response_time: Date.now(),
            conversation_count: conversationCount + 1,
            shouldAskQuestion: aiResponse.shouldAskQuestion
          }
        );

        if (!savedBotMessage) {
          console.error('❌ Failed to save AI message to database');
          // Still show the message even if database save fails
          const tempBotMessage: Message = {
            id: `temp_${Date.now()}`,
            text: aiResponse.message,
            isBot: true,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, tempBotMessage]);
        } else {
          if (DEBUG) console.log('✅ AI message saved to database:', savedBotMessage.id);
        }

        if (savedBotMessage) {
          const botMessage: Message = {
            id: savedBotMessage.id,
            text: aiResponse.message,
            isBot: true,
            timestamp: new Date(savedBotMessage.created_at),
          };

          // Check if message already exists before adding (only check ID, not text)
          setMessages(prev => {
            const exists = prev.find(msg => msg.id === savedBotMessage.id);
            if (exists) {
              if (DEBUG) console.log('⚠️ Bot message already exists, not adding duplicate');
              return prev;
            }
            if (DEBUG) console.log('✅ Adding bot message to UI');
            return [...prev, botMessage];
          });
        }
      } else {
        console.error('❌ No conversation ID available - showing message anyway');
        // No conversation ID, but still show the message
        const tempBotMessage: Message = {
          id: `temp_no_conv_${Date.now()}`,
          text: aiResponse.message,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, tempBotMessage]);
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
      if (activeConversationId) {
        const savedFallback = await chatDatabase.saveMessage(
          activeConversationId,
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
      } else {
        // Still show fallback even without conversation ID
        const fallbackMessage: Message = {
          id: `fallback_${Date.now()}`,
          text: fallbackText,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }

      setConversationCount(prev => prev + 1);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageSelected = async (imageData: ImageProcessingResult) => {
    if (!currentConversation) {
      console.error('❌ No current conversation for image upload');
      return;
    }

    try {
      console.log('📸 Processing image upload:', {
        fileName: imageData.fileName,
        dimensions: `${imageData.width}x${imageData.height}`,
        originalSize: imageData.originalSize,
        compressedSize: imageData.compressedSize
      });

      // Save image attachment to database
      const imageAttachment = await chatDatabase.saveImageAttachment(
        currentConversation.id,
        userId,
        imageData.base64,
        imageData.mimeType,
        undefined, // No message ID yet
        {
          width: imageData.width,
          height: imageData.height,
          fileName: imageData.fileName,
          originalSize: imageData.originalSize,
          compressedSize: imageData.compressedSize
        }
      );

      if (!imageAttachment) {
        throw new Error('Failed to save image attachment');
      }

      // Create user message with image (will be updated with description)
      const userMessage = await chatDatabase.saveMessage(
        currentConversation.id,
        'Image uploaded', // Temporary text, will be updated
        false, // is_bot
        undefined,
        { hasImage: true, imageAttachmentId: imageAttachment.id }
      );

      // Update the image attachment with the message ID for proper linking
      if (userMessage) {
        await chatDatabase.updateImageAttachment(imageAttachment.id, {
          message_id: userMessage.id
        });
      }

      if (userMessage) {
        const messageWithImage: Message = {
          id: userMessage.id,
          text: '', // Hide text for image messages
          isBot: false,
          timestamp: new Date(userMessage.created_at),
          imageAttachments: [imageAttachment]
        };

        setMessages(prev => [...prev, messageWithImage]);

        // Generate AI response with image
        setIsTyping(true);
        try {
          // Step 1: Get a brief description of the image for context
          const descriptionPrompt = "Please describe this image in one concise sentence, focusing on the main subject and setting. Keep it under 20 words.";
          
          const descriptionResponse = await chatAiService.generateResponseWithImage(
            descriptionPrompt,
            [], // No conversation history for description
            0,
            { base64: imageData.base64, mimeType: imageData.mimeType }
          );

          const imageDescription = descriptionResponse.message;
          console.log('🖼️ Generated image description:', imageDescription);

          // Step 2: Save a descriptive message for the chat thread context
          const descriptiveMessage = await chatDatabase.saveMessage(
            currentConversation.id,
            `[Image: ${imageDescription}]`,
            false, // user message
            undefined,
            { 
              hasImage: true, 
              imageAttachmentId: imageAttachment.id,
              imageDescription: imageDescription,
              isDescriptiveText: true
            }
          );
          
          console.log('✅ Saved descriptive message:', descriptiveMessage?.id);

          // Step 3: Generate the main AI response with full context
          const conversationPrompt = "I just shared an image with you. What do you see? Tell me what interests you about it and ask me something about the image or the story behind it.";
          
          const aiResponse = await chatAiService.generateResponseWithImage(
            conversationPrompt,
            [...conversationHistory, { role: 'user' as const, content: `[Image: ${imageDescription}]` }],
            conversationCount,
            { base64: imageData.base64, mimeType: imageData.mimeType }
          );

          // Update image attachment with AI analysis
          await chatDatabase.updateImageAnalysis(
            imageAttachment.id,
            aiResponse.message,
            {
              model: aiResponse.usedModel,
              analyzedAt: new Date().toISOString(),
              promptUsed: conversationPrompt,
              imageDescription: imageDescription
            }
          );

          // Save AI response message
          const aiMessage = await chatDatabase.saveMessage(
            currentConversation.id,
            aiResponse.message,
            true,
            aiResponse.usedModel,
            { imageAnalysis: true, imageAttachmentId: imageAttachment.id }
          );

          if (aiMessage) {
            console.log('✅ Saved AI response:', aiMessage.id);
            const botMessage: Message = {
              id: aiMessage.id,
              text: aiResponse.message,
              isBot: true,
              timestamp: new Date(aiMessage.created_at)
            };
            setMessages(prev => [...prev, botMessage]);
          } else {
            console.error('❌ Failed to save AI message to database');
            // Still show the message even if database save fails
            const tempBotMessage: Message = {
              id: `temp_ai_${Date.now()}`,
              text: aiResponse.message,
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, tempBotMessage]);
          }

          // Update conversation history WITH image description for future context
          setConversationHistory([
            ...conversationHistory,
            { role: 'user', content: `[Image: ${imageDescription}]` },
            { role: 'assistant', content: aiResponse.message }
          ]);

        } catch (error) {
          console.error('❌ Error generating AI response for image:', error);
          
          // Add fallback message
          const fallbackMessage: Message = {
            id: `fallback_${Date.now()}`,
            text: 'I can see your image! Tell me more about it - what\'s the story behind this photo?',
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, fallbackMessage]);
        } finally {
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error('❌ Error processing image upload:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride ?? inputText;

    if (DEBUG) console.log('[handleSend] Called with:', {
      messageOverride: messageOverride ? messageOverride.substring(0, 50) : 'none',
      inputText: inputText.substring(0, 50),
      messageToSend: messageToSend.substring(0, 50),
      inputTextLength: inputText.length,
      isSending,
      trimmed: messageToSend.trim().length
    });

    if (DEBUG) console.log('[handleSend] State check:', {
      userId_state: userId,
      userId_ref: userIdRef.current,
      conversationId_ref: conversationIdRef.current,
      currentConversation_state: currentConversation?.id || 'null'
    });

    if (!messageToSend.trim() || isSending) {
      console.warn('[handleSend] Blocked send:', {
        noText: !messageToSend.trim(),
        alreadySending: isSending
      });
      return;
    }

    // Use refs for immediate access to latest values (avoids race conditions with React state)
    const effectiveUserId = userIdRef.current || userId;

    // Check if conversation exists and get or create it
    let activeConversation = currentConversation;
    if (!activeConversation && conversationIdRef.current) {
      // We have a conversation ID in the ref but state hasn't updated yet
      if (DEBUG) console.log('[handleSend] Using conversation from ref:', conversationIdRef.current);
      // Get conversation from database using the ref ID
      activeConversation = await chatDatabase.getOrCreateConversation(effectiveUserId);
    }

    if (!activeConversation) {
      console.warn('[handleSend] ⚠️  No currentConversation in state! Attempting recovery...');
      if (DEBUG) console.log('[handleSend] effectiveUserId:', effectiveUserId);

      // Try to initialize conversation using ref values
      if (effectiveUserId) {
        if (DEBUG) console.log('[handleSend] Creating conversation for user:', effectiveUserId);
        const conversation = await chatDatabase.getOrCreateConversation(effectiveUserId);
        if (conversation) {
          if (DEBUG) console.log('[handleSend] ✅ Created conversation:', conversation.id);
          setCurrentConversation(conversation);
          activeConversation = conversation; // Use the newly created conversation
        } else {
          console.error('[handleSend] ❌ Failed to create conversation');
          return;
        }
      } else {
        console.error('[handleSend] ❌ No userId available (state:', userId, ', ref:', userIdRef.current, ')');
        return;
      }
    }

    if (DEBUG) console.log('[handleSend] ✅ Ready to send - activeConversation:', activeConversation.id);

    // Content-based duplicate prevention (simpler and more reliable than time-based)
    const messageText = messageToSend.trim();
    const messageKey = `${activeConversation.id}_${messageText.toLowerCase()}`;
    
    // Notify parent window (test dashboard) if in iframe
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'cupido-message',
        sender: 'user',
        message: messageText,
        conversationId: activeConversation.id,
        timestamp: new Date().toISOString()
      }, '*');
    }

    if ((window as any).__pendingMessages?.has(messageKey)) {
      console.log('⚠️ Blocked duplicate: exact same message already being sent');
      return;
    }

    // Initialize pending messages set if needed
    if (!(window as any).__pendingMessages) {
      (window as any).__pendingMessages = new Set();
    }

    // Add to pending messages
    (window as any).__pendingMessages.add(messageKey);

    // Clear pending after message is processed (or 3s timeout for safety)
    setTimeout(() => {
      (window as any).__pendingMessages?.delete(messageKey);
    }, 3000);

    console.log(`📤 [${new Date().toISOString()}] Sending message:`, messageText);

    // Only clear input if we used the actual inputText (not an override)
    if (!messageOverride) {
      setInputText('');
    }
    setIsSending(true);
    isSendingRef.current = true; // Update ref immediately for test compatibility

    // Wrap everything in try/finally to ensure isSending always gets reset
    try {
      // Save user message to database FIRST (don't wait for profile extraction)
      if (activeConversation) {
        const savedUserMessage = await chatDatabase.saveMessage(
          activeConversation.id,
          messageText,
          false, // is_bot = false for user
          undefined, // no AI model for user messages
          { message_length: messageText.length }
        );

        // Always show the user message in UI immediately
        let userMessage: Message;

        if (!savedUserMessage) {
          console.error('❌ Failed to save user message to database - showing in UI anyway');
          // Create temporary message for UI
          userMessage = {
            id: `temp_user_${Date.now()}`,
            text: messageText,
            isBot: false,
            timestamp: new Date(),
          };
        } else {
          if (DEBUG) console.log('✅ User message saved to database:', savedUserMessage.id);
          userMessage = {
            id: savedUserMessage.id,
            text: messageText,
            isBot: false,
            timestamp: new Date(savedUserMessage.created_at),
          };
        }

        // Check if message already exists before adding (only check ID, not text)
        setMessages(prev => {
          const exists = prev.find(msg => msg.id === userMessage.id);
          if (exists) {
            if (DEBUG) console.log('⚠️ User message already exists, not adding duplicate');
            return prev;
          }
          if (DEBUG) console.log('✅ Adding user message to UI');
          return [...prev, userMessage];
        });

        // Add small delay to ensure UI renders before proceeding (prevents message disappearing)
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // User message is now visible - release the send button immediately
      setIsSending(false);
      isSendingRef.current = false;
      if (DEBUG) console.log('[handleSend] ✅ User message sent, isSending=false');

      // Extract profile information in background (non-blocking)
      // This happens async and doesn't delay the AI response
      const previousMessages = messages.filter(m => !m.isBot).map(m => m.text);
      if (DEBUG) console.log('[Profile Extraction] Starting background extraction...');
      userProfileService.extractProfileFromMessage(messageText, previousMessages)
        .then(profileUpdates => {
          if (Object.keys(profileUpdates).length > 0) {
            return userProfileService.updateProfile(profileUpdates).then(() => {
              if (DEBUG) console.log('[Profile Extraction] ✅ Profile updated:', profileUpdates);

              // If we just got the user's name, log it (keep this one as it's important)
              if (profileUpdates.name) {
                console.log('✅ User name collected:', profileUpdates.name);
              }
            });
          } else {
            if (DEBUG) console.log('[Profile Extraction] No updates extracted from message');
          }
        })
        .catch(error => {
          console.error('[Profile Extraction] Background extraction failed:', error);
        });

      // Generate response in background (completely non-blocking)
      // Don't await - let it run independently
      if (DEBUG) console.log('[MOBILE DEBUG] Starting generateResponse in background');
      generateResponse(messageText, activeConversation.id)
        .then(() => {
          if (DEBUG) console.log('[MOBILE DEBUG] generateResponse completed');
        })
        .catch(error => {
          console.error('[MOBILE DEBUG] generateResponse failed:', error);
        });
    } catch (error) {
      console.error('❌ [CRITICAL] Error in handleSend:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // If error occurred before we set isSending=false, reset it now
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  // Fixed positioning calculations
  const INPUT_AREA_HEIGHT = 70;
  const inputBottomPosition = 0; // Always at the bottom
  // Don't add tab bar height when keyboard is visible (tabs are hidden)
  const messagesBottomPadding = INPUT_AREA_HEIGHT + (keyboardVisible ? 0 : tabBarHeight) + 10;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (keyboardVisible ? 0 : 90) : 0}
    >
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
        testID="messages-scroll-view"
      >
        {messages.map((message, index) => {
          // Check if message has new image attachments
          if (message.imageAttachments && message.imageAttachments.length > 0) {
            return (
              <Fragment key={message.id}>
                {message.imageAttachments.map((attachment, imgIndex) => (
                  <ImageMessage
                    key={`${message.id}-img-${imgIndex}`}
                    imageAttachment={attachment}
                    isFromUser={!message.isBot}
                    message={imgIndex === 0 && message.text ? message.text : undefined} // Only show text on first image if not empty
                    timestamp={message.timestamp.toISOString()}
                    showMetadata={false}
                  />
                ))}
              </Fragment>
            );
          }
          
          // Legacy support for imageUri (existing images)
          if (message.imageUri) {
            return (
              <View
                key={message.id}
                testID={`message-${index}`}
                style={[
                  styles.messageContainer,
                  message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
                ]}
              >
                <View
                  testID={`message-bubble-${index}`}
                  style={[
                    styles.messageBubble,
                    message.isBot ? styles.botBubble : styles.userBubble,
                  ]}
                >
                  <View>
                    <Image
                      source={{ uri: message.imageUri }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                    {message.text && (
                      <Text
                        style={[
                          styles.messageText,
                          message.isBot ? styles.botText : styles.userText,
                        ]}
                      >
                        {message.text}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            );
          }
          
          // Regular text message
          return (
            <View
              key={message.id}
              testID={`message-${index}`}
              style={[
                styles.messageContainer,
                message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
              ]}
            >
              <View
                testID={`message-bubble-${index}`}
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                <Text
                  testID={`message-text-${index}`}
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
          );
        })}
        
        {isTyping && (
          <View style={styles.typingContainer} testID="typing-indicator">
            <Text style={styles.typingText}>typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed input area */}
      <View
        testID="input-wrapper"
        style={[
          styles.inputWrapper,
          {
            bottom: inputBottomPosition,
            height: INPUT_AREA_HEIGHT,
          }
        ]}
      >
        <View style={styles.inputContainer} testID="input-container">
          <ImageUpload
            onImageSelected={handleImageSelected}
            onError={(error) => Alert.alert('Image Error', error)}
            disabled={isSending}
            style={styles.imageUploadButton}
          />
          <TextInput
            testID="chat-input"
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share your thoughts..."
            placeholderTextColor="#999"
            multiline
            maxLength={10000}
            returnKeyType={Platform.OS === 'web' ? 'send' : 'default'}
            blurOnSubmit={false}
            onSubmitEditing={Platform.OS === 'web' ? () => handleSend() : undefined}
            onKeyPress={(e: any) => {
              // Handle Enter key on web (without Shift)
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                // Don't send if composing (IME) or if it's a repeated event
                if (e.nativeEvent.isComposing || e.nativeEvent.repeat) {
                  console.log('⚠️ Blocked Enter: composing or repeat event');
                  return;
                }
                e.preventDefault();
                // Prevent double-trigger from Enter key
                if ((window as any).__lastEnterPress && Date.now() - (window as any).__lastEnterPress < 100) {
                  console.log('⚠️ Blocked Enter: too soon after last Enter');
                  return;
                }
                (window as any).__lastEnterPress = Date.now();

                // Only send if not already sending and has text
                if (!isSending && inputText.trim()) {
                  console.log('⌨️ Enter key triggering send');
                  handleSend();
                } else {
                  console.log('⚠️ Blocked Enter: isSending or no text');
                }
              }
            }}
          />
          <Pressable
            testID="send-button"
            style={({ pressed }) => [
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed
            ]}
            onPress={Platform.OS === 'web' ? () => handleSend() : undefined}
            onLongPress={() => handleSend()}
            delayLongPress={250}
            disabled={!inputText.trim() || isSending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="send"
              size={20}
              color={(inputText.trim() && !isSending) ? '#007AFF' : '#C0C0C0'}
            />
          </Pressable>
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
  sendButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageUploadButton: {
    // ImageUpload component will handle its own styling
  },
});
