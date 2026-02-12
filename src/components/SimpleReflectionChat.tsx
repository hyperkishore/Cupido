import React, { useState, useRef, useEffect, Fragment, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
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
import { ChatInput } from './ChatInput';
import { processImage, ImageProcessingResult } from '../utils/imageUtils';
// import { useMemoryManager } from '../utils/memoryManager'; // Removed as part of simplification
import { escapeHtml, sanitizeMessageContent } from '../utils/sanitizer';
import { log } from '../utils/logger';
import { validateChatMessage } from '../utils/validation';
import { normalizePhoneNumber } from '../utils/phoneNormalizer';
import { sessionManager } from '../services/sessionManager';
// REMOVED: Complex context strategy - keeping it simple
// import { conversationContext } from '../services/conversationContext';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  imageUri?: string; // Legacy support for existing images
  imageAttachments?: ImageAttachment[]; // New support for processed images
  isPending?: boolean; // For optimistic UI updates
  saveFailed?: boolean; // If database save failed
  metadata?: any; // Database metadata from chat_messages table
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
        log.debug(`Retrieved session from localStorage: ${key}`, { key, hasValue: !!value });
        return value;
      }
      return null;
    } catch (error) {
      log.warn('Failed to read session from web storage', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    log.warn('Failed to read session from AsyncStorage', { error: error instanceof Error ? error.message : String(error) });
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
        log.debug(`Saved session to localStorage: ${key}`, { key });
      }
    } catch (error) {
      log.warn('Failed to persist session to web storage', { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    log.warn('Failed to persist session to AsyncStorage', { error: error instanceof Error ? error.message : String(error) });
  }
};

interface SimpleReflectionChatProps {
  onKeyboardToggle?: (isVisible: boolean) => void;
}

const DEBUG = true; // Set to true for verbose logging during development
const DEFAULT_INPUT_AREA_HEIGHT = 70;

// Toast notification function (simple console log for now)
const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
  
  // In web, could use a toast library or show an alert
  if (Platform.OS === 'web' && type === 'error') {
    // For critical errors, show alert on web
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
  }
};

export const SimpleReflectionChat: React.FC<SimpleReflectionChatProps> = ({ onKeyboardToggle }) => {
  const insets = useSafeAreaInsets();
  
  // FIXED: Guard against useBottomTabBarHeight throwing if used outside tab navigator
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (error) {
    // Not in a tab navigator context, use default
    tabBarHeight = Platform.OS === 'ios' ? 50 : 56; // Default tab bar heights
    console.log('Not in tab navigator context, using default tab bar height:', tabBarHeight);
  }
  
  const flatListRef = useRef<FlatList>(null);
  const { user: authUser, signOut, loading: authLoading } = useAuth(); // Get authenticated user, signOut, and loading from context
  // const memoryManager = useMemoryManager(); // Removed as part of simplification

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  // Message pagination constants
  const MESSAGE_PAGE_SIZE = 50; // Load 50 messages at a time
  const MAX_MESSAGES_IN_MEMORY = 100; // Keep max 100 messages in memory
  const TRIM_TO_MESSAGES = 75; // When trimming, keep 75 most recent
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Mobile browser detection (Platform.OS is always 'web' in browsers)
  const isMobileBrowser = Platform.OS === 'web' && typeof window !== 'undefined' && (
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768 || // Small screen
    ('ontouchstart' in window) // Touch support
  );
  
  // Debug logging for mobile detection  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      log.debug('Mobile Detection Debug', {
        component: 'SimpleReflectionChat',
        platform: Platform.OS,
        userAgent: navigator.userAgent,
        windowWidth: window.innerWidth,
        touchSupport: 'ontouchstart' in window,
        isMobileBrowser,
      });
    }
  }, [isMobileBrowser]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('typing...');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  // Removed conversationHistory state - we build context from messages array instead
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Simple conversation history limit - no complex context strategy needed
  const MAX_CONVERSATION_HISTORY = 20; // Keep last 20 messages (10 exchanges) for context

  // Utility: Deduplicate messages by ID (prevents React key warnings)
  const dedupeMessages = useCallback((msgs: Message[]): Message[] => {
    const seen = new Set<string>();
    return msgs.filter(msg => {
      if (seen.has(msg.id)) {
        if (DEBUG) console.log('⚠️ Filtered duplicate message:', msg.id);
        return false;
      }
      seen.add(msg.id);
      return true;
    });
  }, []);

  // Refs for test message handler to avoid race conditions
  const messagesRef = useRef<Message[]>([]);
  const isTypingRef = useRef(false);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const userIdRef = useRef<string>('');
  const isSendingRef = useRef(false);

  // Deduplication: Track recently processed test messages to prevent duplicates
  const processedTestMessagesRef = useRef<Set<string>>(new Set());
  
  // Realtime deduplication: Track locally inserted message IDs (platform-agnostic)
  const localMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Auto-scroll management: Only scroll when user is at bottom or just sent a message
  const shouldAutoScrollRef = useRef(true);
  
  // FIXED: Add guard to prevent race condition during scroll animation
  const isScrollingRef = useRef(false);
  const scrollAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // FIXED: Add platform-agnostic duplicate send prevention
  const pendingMessagesRef = useRef<Set<string>>(new Set());

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
    log.debug('[useEffect setupChat] Triggered', { authUserId: authUser?.id, authLoading, component: 'SimpleReflectionChat' });
    let unsubscribe: (() => void) | undefined;

    // Don't initialize chat until auth is fully loaded
    if (authLoading) {
      log.debug('[setupChat] Auth still loading, waiting...', { component: 'SimpleReflectionChat' });
      return;
    }

    const setupChat = async () => {
      log.debug('[setupChat] Starting chat setup', { component: 'SimpleReflectionChat' });
      // Clear existing messages when user changes
      setMessages([]);
      // Removed setConversationHistory - no longer needed
      setConversationCount(0);
      log.debug('[setupChat] Cleared existing messages', { component: 'SimpleReflectionChat' });

      log.debug('[setupChat] Calling initializeChat', { component: 'SimpleReflectionChat' });
      unsubscribe = await initializeChat();
      if (DEBUG) console.log('[setupChat] ✓ initializeChat returned, unsubscribe:', unsubscribe ? 'function' : 'undefined');
    };

    setupChat();

    return () => {
      if (DEBUG) console.log('[useEffect setupChat] Cleanup - calling unsubscribe');
      unsubscribe?.();
      
      // Clean up session manager on unmount
      import('../services/sessionManager').then(({ sessionManager }) => {
        sessionManager.cleanup();
      });
    };
  }, [authUser?.id, authLoading]); // Re-initialize when user changes or auth loading state changes

  // Forward console logs to parent dashboard
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (window.parent === window) return; // Not in iframe

    const forwardToParent = (level: string, args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // Only send messages to parent if we're in an iframe for testing
      if (window.parent !== window) {
        const targetOrigin = window.location.origin;
        window.parent.postMessage({
          type: 'app-console-log',
          level,
          message,
          timestamp: new Date().toISOString()
        }, targetOrigin);
      }
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
      // CRITICAL SECURITY: Validate message origin before processing
      if (event.origin !== window.location.origin) {
        console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
        return;
      }

      const { type, message } = event.data;

      switch (type) {
        case 'test-send-message':
          // Validate test message first
          const testMessageValidation = validateChatMessage(message);
          if (!testMessageValidation.isValid) {
            log.warn('Invalid test message rejected', {
              component: 'SimpleReflectionChat',
              errors: testMessageValidation.errors,
              messagePreview: message.substring(0, 50),
            });
            return;
          }

          const validatedTestMessage = testMessageValidation.sanitizedValue || message;

          // Deduplication: Use content-based key (simpler and more reliable than time-based)
          const conversationId = conversationIdRef.current || 'no-conversation';
          const messageKey = `${conversationId}_${validatedTestMessage.trim().toLowerCase()}`;

          if (processedTestMessagesRef.current.has(messageKey)) {
            log.warn('Duplicate test message blocked', { 
            component: 'SimpleReflectionChat',
            messagePreview: validatedTestMessage.substring(0, 50) 
          });
            return; // Skip duplicate
          }

          // Mark this message as processed
          processedTestMessagesRef.current.add(messageKey);

          // Clean up after 5 seconds (prevents memory leak for long test sessions)
          setTimeout(() => {
            processedTestMessagesRef.current.delete(messageKey);
          }, 5000);

          // Simulate sending a message from test dashboard
          log.debug('Received test message command', { 
            component: 'SimpleReflectionChat',
            message: validatedTestMessage.substring(0, 100) 
          });
          console.log('[TEST] Current state:', {
            isSending,
            messageLength: validatedTestMessage?.length
          });

          // Directly call handleSend with the validated message (no state involved)
          console.log('[TEST] Calling handleSend directly with message...');
          handleSend(validatedTestMessage);
          break;

        case 'test-clear-session':
          // Clear session for testing new user flow
          log.info('Clearing session for new user test', { 
            component: 'SimpleReflectionChat',
            action: 'test-clear-session' 
          });
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
            const targetOrigin = window.location.origin;
            window.parent.postMessage({
              type: 'test-state-response',
              state
            }, targetOrigin);
          }
          break;
          
        case 'simulator-response':
          // Handle simulator responses from the test dashboard
          const { message: simResponse, personaName } = event.data;
          if (!simResponse) break;
          
          log.debug(`[SIMULATOR] Received response from ${personaName || 'simulator'}`, { responseLength: simResponse.length, component: 'SimpleReflectionChat' });
          
          // Add the simulator response as an AI message
          const newBotMessage: Message = {
            id: `${Date.now()}-simulator`,
            text: simResponse,
            isBot: true,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, newBotMessage]);
          messagesRef.current = [...messagesRef.current, newBotMessage];
          
          // Save to database if conversation exists
          if (currentConversation) {
            try {
              await chatDatabase.saveMessage(
                currentConversation.id,
                simResponse,
                true, // is_bot
                undefined, // no AI model for test
                { simulatorPersona: personaName }
              );
            } catch (error) {
              log.error('[SIMULATOR] Error saving message', error instanceof Error ? error : new Error(String(error)), { component: 'SimpleReflectionChat' });
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
    log.debug('[initializeChat] Starting initialization', { component: 'SimpleReflectionChat' });
    log.debug('[initializeChat] authUser check', { hasAuthUser: !!authUser, authUserId: authUser?.id, component: 'SimpleReflectionChat' });

    try {
      setIsLoading(true);

      // Initialize user profile service
      if (DEBUG) console.log('[initializeChat] Step 1: Initializing user profile service...');
      try {
        await userProfileService.initialize();
        if (DEBUG) console.log('[initializeChat] ✓ User profile service initialized');
      } catch (error) {
        console.error('[initializeChat] Failed to initialize user profile service:', error);
        // Continue anyway - this shouldn't block chat
      }

      // Use authenticated user or generate demo user
      let sessionUserId: string;
      let userName: string;

      if (authUser) {
        if (DEBUG) console.log('[initializeChat] Step 2a: Using authenticated user path...');
        
        // FIXED: Fallback to user.id (UUID) if phone number is missing
        const normalizedPhone = authUser.phoneNumber ? normalizePhoneNumber(authUser.phoneNumber) : null;
        
        if (!normalizedPhone) {
          // Use UUID as fallback for chat identity
          console.warn('⚠️ No phone number available, using UUID for chat identity');
          sessionUserId = authUser.id; // Fallback to UUID - FIXED: use authUser, not user
        } else {
          sessionUserId = normalizedPhone;
        }
        userName = authUser.displayName || `User ${sessionUserId.slice(-6)}`;
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
        console.error('[initializeChat] Debug info:', { sessionUserId, userName, authUser: !!authUser });
        // Set loading to false even on failure
        setIsLoading(false);
        return;
      }

      if (DEBUG) console.log('[initializeChat] Step 4: Setting userId state...');
      if (DEBUG) console.log('[initializeChat] User object from DB:', JSON.stringify(user));
      setUserId(user.id);
      // CRITICAL: Update ref immediately for test compatibility (don't wait for useEffect)
      userIdRef.current = user.id;
      if (DEBUG) console.log('[initializeChat] ✅ User ID set in state AND ref:', user.id);

      // Initialize session manager for single-window enforcement (AFTER getting user UUID)
      if (authUser) {
        await sessionManager.initialize(user.id, () => {
          // Force logout callback - another window has taken over
          console.log('🚪 Another window is active, logging out...');
          showToast('Logged in from another window', 'info');
          signOut(); // Use the signOut function from auth context
        });
        if (DEBUG) console.log('[initializeChat] ✅ Session manager initialized with UUID:', user.id);
      }

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

      // Load chat history (initial page size for snappy load)
      const history = await chatDatabase.getChatHistory(conversation.id, 50);
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

            // Check if this message has image attachments
            const metadata = msg.metadata as any;
            if (metadata?.hasImage) {
              const storageStrategy = metadata?.storageStrategy;
              const inlineImage = metadata?.inlineImage;

              if (storageStrategy === 'inline' && inlineImage?.base64) {
                baseMessage.imageAttachments = [{
                  id: metadata?.imageAttachmentId || `inline_${msg.id}`,
                  conversation_id: conversation.id,
                  user_id: user.id,
                  image_data: inlineImage.base64,
                  mime_type: inlineImage.mimeType || 'image/jpeg',
                  file_size: inlineImage.compressedSize || inlineImage.fileSize || 0,
                  width: inlineImage.width,
                  height: inlineImage.height,
                  created_at: msg.created_at,
                  metadata: {
                    storageStrategy: 'inline',
                    fileName: inlineImage.fileName,
                    originalSize: inlineImage.originalSize,
                    compressedSize: inlineImage.compressedSize,
                    imageDescription: inlineImage.description,
                    aiAnalysis: inlineImage.aiAnalysis,
                    analyzedAt: inlineImage.analyzedAt,
                  }
                } as ImageAttachment];

                if (!metadata?.isDescriptiveText) {
                  baseMessage.text = '';
                }
              } else {
                // Create placeholder for lazy loading - don't block chat initialization
                baseMessage.imageAttachments = [{
                  id: metadata?.imageAttachmentId || `placeholder_${msg.id}`,
                  conversation_id: conversation.id,
                  user_id: user.id,
                  image_data: '', // Empty - will be loaded on demand
                  mime_type: 'image/jpeg', // Default
                  file_size: 0,
                  created_at: msg.created_at,
                  metadata: { 
                    isPlaceholder: true, 
                    messageId: msg.id,
                    attachmentId: metadata?.imageAttachmentId 
                  }
                } as ImageAttachment];
                
                // Hide message text for image messages unless it's descriptive
                if (!metadata?.isDescriptiveText) {
                  baseMessage.text = '';
                }
                
                console.log('📋 Created image placeholder for message:', msg.id);
              }
            }

            return baseMessage;
          })
        );
        
        setMessages(dedupeMessages(uiMessages));
        setConversationCount(history.filter(msg => !msg.is_bot).length);
        
        // No longer need to maintain conversationHistory state
        // Context is built directly from messages array when needed
        if (DEBUG) console.log('✅ Loaded messages from database:', history.length, 'messages');
      } else {
        // Start with a greeting if no history
        // First-ever session gets a curated reflection prompt; returning users get casual greetings
        const isFirstSession = conversationCount === 0;

        const firstSessionGreetings = [
          "Welcome to your reflection space! Let\u2019s start \u2014 what\u2019s one thing about you that people are always surprised to learn?",
          "Hey, welcome! Here\u2019s your first reflection: what\u2019s something you believe deeply that most people around you don\u2019t?",
          "Welcome! Let\u2019s dive in \u2014 if you could have dinner with anyone, living or not, who would it be and why?",
        ];

        const returningGreetings = [
          "Hey! How's your day going?",
          "Hi there! What's been happening with you lately?",
          "Hey! Good to see you here. What's on your mind?",
          "Hi! How are you feeling today?",
          "Hey! What's been the best part of your week so far?",
        ];

        const greetings = isFirstSession ? firstSessionGreetings : returningGreetings;
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
      
      // Setup real-time subscription with deduplication
      // Clear previous IDs when initializing new chat
      localMessageIdsRef.current.clear();
      
      // Store reference globally for dev inspection (optional, web only)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        (window as any).__localChatMessageIds = localMessageIdsRef.current;
      }

      // Subscribe to real-time messages
      const unsubscribe = chatDatabase.subscribeToMessages(
        conversation.id,
        (newMessage) => {
          // Skip if we inserted this message locally
          if (localMessageIdsRef.current.has(newMessage.id)) {
            if (DEBUG) console.log('[Realtime] Skipping local message:', newMessage.id);
            return;
          }
          
          // Add to messages if not already present (additional safety check)
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) {
              if (DEBUG) console.log('[Realtime] Message already exists:', newMessage.id);
              return prev;
            }
            
            // Add new message from another window/device
            const message: Message = {
              id: newMessage.id,
              text: newMessage.content,
              isBot: newMessage.is_bot,
              timestamp: new Date(newMessage.created_at),
              metadata: newMessage.metadata
            };
            
            console.log('📨 New message from another window:', message.text?.substring(0, 50));
            return [...prev, message];
          });
        }
      );

      if (DEBUG) console.log('[initializeChat] ✅ Initialization complete - returning unsubscribe function');
      return unsubscribe;
    } catch (error) {
      log.error('Chat initialization failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'SimpleReflectionChat',
        function: 'initializeChat',
        errorDetails: JSON.stringify(error),
      });
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

  // Scroll to bottom helper
  const scrollToBottom = (animated: boolean = true) => {
    if (flatListRef.current && messages.length > 0) {
      // FIXED: Set guard to prevent onScroll from overwriting shouldAutoScrollRef
      isScrollingRef.current = true;
      
      // Clear any existing timeout
      if (scrollAnimationTimeoutRef.current) {
        clearTimeout(scrollAnimationTimeoutRef.current);
      }
      
      flatListRef.current.scrollToEnd({ animated });
      
      // Reset guard after animation completes (estimate 300ms for animation)
      scrollAnimationTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollAnimationTimeoutRef.current = null;
      }, animated ? 300 : 50);
    }
  };

  // Handle new messages and auto-scroll
  useEffect(() => {
    // Don't interfere while loading older messages
    if (isLoadingOlderMessages) {
      return;
    }
    
    const prevCount = messagesRef.current.length;
    const currentCount = messages.length;
    
    // Check if new messages were added (not prepended)
    if (currentCount > prevCount && prevCount > 0) {
      // New message arrived
      if (isAtBottom) {
        // Auto-scroll if at bottom
        setTimeout(() => scrollToBottom(false), 100);
      } else {
        // Show new message indicator if not at bottom
        setHasNewMessages(true);
      }
    }
    
    // Initial load - ensure we're at bottom
    if (messages.length === 1 || prevCount === 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
    
    // Update ref for tracking
    messagesRef.current = messages;
  }, [messages.length, isLoadingOlderMessages, isAtBottom]);

  // Scroll to bottom on initial load - more aggressive for web
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      // Web needs multiple attempts for initial scroll
      if (Platform.OS === 'web') {
        // Immediate attempt
        scrollToBottom(false);
        
        // After short delay
        const shortTimeout = setTimeout(() => {
          scrollToBottom(false);
        }, 250);
        
        // Final attempt after rendering settles
        const longTimeout = setTimeout(() => {
          scrollToBottom(false);
        }, 800);
        
        return () => {
          clearTimeout(shortTimeout);
          clearTimeout(longTimeout);
        };
      } else {
        // Native: single delayed scroll
        const initialScrollTimeout = setTimeout(() => {
          scrollToBottom(false);
        }, 500);
        
        return () => clearTimeout(initialScrollTimeout);
      }
    }
  }, [isLoading]);
  
  // Scroll after keyboard appears/disappears (only if user is at bottom)
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScrollRef.current) {
      const keyboardTimeout = setTimeout(() => {
        scrollToBottom(true);
      }, 300);

      return () => clearTimeout(keyboardTimeout);
    }
  }, [keyboardVisible, messages.length]);

  // Auto-scroll when typing indicator appears (only if user is at bottom)
  useEffect(() => {
    if (isTyping && shouldAutoScrollRef.current) {
      // Immediately scroll to show typing indicator
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }
  }, [isTyping]);

  // Simple cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts
      // Note: memoryManager was removed as part of simplification
    };
  }, []);

  // Message pagination and memory management
  const trimMessagesIfNeeded = (messagesList: Message[]): Message[] => {
    if (messagesList.length <= MAX_MESSAGES_IN_MEMORY) {
      return messagesList;
    }
    
    log.perf('Message trimming', performance.now(), { 
      totalMessages: messagesList.length,
      trimTo: TRIM_TO_MESSAGES 
    });
    
    // FIXED: Before trimming, check if we should maintain scroll position
    const wasAtBottom = shouldAutoScrollRef.current;
    
    // Keep the most recent messages and preserve any pending saves
    const pendingMessages = messagesList.filter(msg => msg.isPending);
    const savedMessages = messagesList.filter(msg => !msg.isPending);
    
    // Take most recent saved messages
    const recentSaved = savedMessages.slice(-TRIM_TO_MESSAGES);
    
    // Combine pending and recent saved
    const trimmed = [...recentSaved, ...pendingMessages];
    
    if (DEBUG) {
      log.perf('Message trimming completed', performance.now(), { before: messagesList.length, after: trimmed.length });
    }
    
    // FIXED: If we were at bottom before trim, stay at bottom after
    if (wasAtBottom) {
      // Schedule scroll to bottom after React processes the state change
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
    
    return trimmed;
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasMoreMessages || !currentConversation) {
      return;
    }

    setIsLoadingOlderMessages(true);
    
    try {
      // Get oldest message timestamp for pagination
      const oldestMessage = messages[0];
      const beforeTimestamp = oldestMessage?.timestamp;
      
      // Load older messages from database
      const olderMessages = await chatDatabase.getChatHistory(
        currentConversation.id, 
        MESSAGE_PAGE_SIZE,
        beforeTimestamp?.toISOString()
      );
      
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      
      // Convert to UI format
      const uiOlderMessages: Message[] = olderMessages.map(msg => ({
        id: msg.id,
        text: msg.content,
        isBot: msg.is_bot,
        timestamp: new Date(msg.created_at),
      }));
      
      // Prepend older messages (with deduplication)
      setMessages(prev => dedupeMessages([...uiOlderMessages, ...prev]));
      
      // Check if we got less than requested (means we hit the end)
      if (olderMessages.length < MESSAGE_PAGE_SIZE) {
        setHasMoreMessages(false);
      }
      
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const generateResponse = async (userMessage: string, conversationId?: string) => {
    log.debug('[generateResponse] called', { messageLength: userMessage.length, component: 'SimpleReflectionChat' });
    if (DEBUG) console.log('[MOBILE DEBUG] conversationId passed:', conversationId);
    setIsTyping(true);

    // Define activeConversationId in function scope so it's available in catch block
    const activeConversationId = conversationId || currentConversation?.id;

    try {
      // SIMPLE APPROACH: Build context from the last N messages in the UI
      // No complex context assembly, no caching, no summaries - just the last N messages
      const recentMessages = messages.slice(-30); // Last 30 messages for better context
      const simpleHistory = recentMessages
        .filter(m => !m.isPending && !m.imageUri && !m.imageAttachments && m.text) // Exclude pending messages, images, and empty text
        .map(m => ({
          role: m.isBot ? 'assistant' : 'user' as 'user' | 'assistant',
          content: m.text
        }));
      
      // Add debug to catch context issues
      if (simpleHistory.length === 0 && messages.length > 0) {
        console.warn('⚠️ WARNING: No valid messages for context despite having messages in UI');
        console.warn('Messages in UI:', messages.length, 'Valid for context:', simpleHistory.length);
      }
      
      if (DEBUG) {
        console.log('📋 SIMPLE CONTEXT - Messages being sent to AI:', {
          historyCount: simpleHistory.length,
          currentUserMessage: userMessage.substring(0, 50) + '...',
          lastHistoryMessage: simpleHistory[simpleHistory.length - 1]?.content?.substring(0, 50) + '...'
        });
      }

      // Ensure we have at least some context - add a system message if needed
      const contextForAI = simpleHistory.length > 0 ? simpleHistory : [
        { 
          role: 'system' as const, 
          content: 'You are continuing an ongoing conversation. The user knows who you are. Do not introduce yourself.'
        }
      ];
      
      // Call AI service with simple conversation history built from messages
      const aiResponsePromise = chatAiService.generateResponse(
        userMessage,
        contextForAI, // Use the context with fallback
        conversationCount
      );

      // Timeout wrapper to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT: Response took longer than 30s')), 30000)
      );

      const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);
      log.debug('[generateResponse] AI Response received', { hasResponse: !!aiResponse, component: 'SimpleReflectionChat' });

      // No artificial delay - users want fast responses

      // Save bot message to database
      if (DEBUG) console.log('🔍 Active conversation ID for saving bot message:', activeConversationId);

      if (activeConversationId) {
        if (DEBUG) console.log('AI Response received:', {
          message: aiResponse.message,
          model: aiResponse.usedModel,
          shouldAskQuestion: aiResponse.shouldAskQuestion
        });

        // SIMPLE: Save message without complex token tracking
        const savedBotMessage = await chatDatabase.saveMessage(
          activeConversationId,
          aiResponse.message,
          true, // is_bot
          aiResponse.usedModel,
          {
            response_time: Date.now(),
            conversation_count: conversationCount + 1,
            shouldAskQuestion: aiResponse.shouldAskQuestion
          }
        );

        // Track locally saved bot message ID
        if (savedBotMessage?.id) {
          localMessageIdsRef.current.add(savedBotMessage.id);
        }

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
      
      // No need to maintain conversationHistory state - we build it from messages
      
      // Force auto-scroll when receiving bot response
      shouldAutoScrollRef.current = true;
      
      // Ensure we scroll to bottom after bot response with stronger scheduling
      requestAnimationFrame(() => {
        scrollToBottom(true);
        // Double-ensure scroll happens after content size change
        setTimeout(() => scrollToBottom(true), 50);
      });

    } catch (error) {
      log.error('Failed to generate AI response', error instanceof Error ? error : new Error(String(error)), {
        component: 'SimpleReflectionChat',
        function: 'generateResponse',
        userMessage: userMessage.substring(0, 50),
        conversationId,
      });
      
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
      setTypingMessage('typing...');
    }
  };

  // Helper function to add a placeholder message that can be updated later
  const addPlaceholderMessage = (text: string, isBot: boolean = true): string => {
    const placeholderId = `placeholder_${Date.now()}`;
    const placeholderMessage: Message = {
      id: placeholderId,
      text: text,
      isBot: isBot,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, placeholderMessage]);
    return placeholderId;
  };

  // Helper function to update a placeholder message
  const updatePlaceholderMessage = (messageId: string, newText: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, text: newText, timestamp: new Date() }
          : msg
      )
    );
  };

  // CRITICAL FIX: Create thumbnail for metadata storage to prevent massive base64 in JSONB
  const createThumbnailForMetadata = async (imageData: any): Promise<{thumbnail: string, fullImageId: string}> => {
    try {
      // Web-only thumbnail creation
      if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
        // On native, return the original image data
        const fullImageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        return { thumbnail: imageData, fullImageId };
      }
      
      // Create small thumbnail for metadata storage (target: ~10KB max)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new (window as any).Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate thumbnail dimensions (max 150px either direction)
          const maxDimension = 150;
          const ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
          
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Draw compressed thumbnail
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert to low quality JPEG for maximum compression
          const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.3); // 30% quality
          
          // Store full image in IndexedDB with unique ID
          const fullImageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Store in IndexedDB for persistence across refreshes
          if ('indexedDB' in window) {
            try {
              const dbRequest = indexedDB.open('CupidoImageCache', 1);
              dbRequest.onupgradeneeded = () => {
                const db = dbRequest.result;
                if (!db.objectStoreNames.contains('images')) {
                  db.createObjectStore('images', { keyPath: 'id' });
                }
              };
              dbRequest.onsuccess = () => {
                const db = dbRequest.result;
                const transaction = db.transaction(['images'], 'readwrite');
                const store = transaction.objectStore('images');
                store.add({
                  id: fullImageId,
                  base64: imageData.base64,
                  mimeType: imageData.mimeType,
                  width: imageData.width,
                  height: imageData.height,
                  originalSize: imageData.originalSize,
                  compressedSize: imageData.compressedSize,
                  fileName: imageData.fileName,
                  createdAt: new Date().toISOString()
                });
              };
            } catch (dbError) {
              console.warn('IndexedDB storage failed, thumbnail only:', dbError);
            }
          }
          
          const thumbnailSize = Math.ceil((thumbnailBase64.length * 3) / 4);
          
          if (DEBUG) {
            console.log('🖼️ Created thumbnail for metadata storage:', {
              originalSize: imageData.originalSize || imageData.compressedSize,
              thumbnailSize,
              compressionRatio: ((imageData.originalSize || imageData.compressedSize) / thumbnailSize).toFixed(1) + 'x',
              fullImageId
            });
          }
          
          resolve({ 
            thumbnail: thumbnailBase64, 
            fullImageId 
          });
        };
        
        img.onerror = () => reject(new Error('Failed to load image for thumbnail creation'));
        img.src = imageData.base64;
      });
    } catch (error) {
      console.error('Thumbnail creation failed, using original (RISK: large metadata):', error);
      // Emergency fallback - at least truncate if too large
      const originalSize = Math.ceil((imageData.base64.length * 3) / 4);
      if (originalSize > 100000) { // 100KB limit for emergency fallback
        console.warn('⚠️ CRITICAL: Image too large for metadata, using placeholder');
        return {
          thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+',
          fullImageId: `large_img_${Date.now()}`
        };
      }
      return {
        thumbnail: imageData.base64,
        fullImageId: `fallback_${Date.now()}`
      };
    }
  };

  // PERFORMANCE: Optimize image storage to reduce memory usage
  const optimizeImageForStorage = async (imageData: any): Promise<{data: string, type: 'base64' | 'blob' | 'url'}> => {
    try {
      // For small images, keep as base64 for speed
      if (imageData.compressedSize && imageData.compressedSize < 50000) { // 50KB threshold
        return { data: imageData.base64, type: 'base64' };
      }
      
      // For larger images, try to create object URL to save memory
      if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
        try {
          // Convert base64 to blob
          const base64Data = imageData.base64.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: imageData.mimeType });
          
          // Create object URL (much more memory efficient)
          const objectUrl = URL.createObjectURL(blob);
          
          if (DEBUG) {
            log.perf('Image storage optimization', performance.now(), { originalSize: imageData.compressedSize, storageType: 'blob', component: 'SimpleReflectionChat' });
          }
          
          return { data: objectUrl, type: 'blob' };
        } catch (blobError) {
          console.warn('Failed to create blob URL, using base64:', blobError);
        }
      }
      
      // Fallback to base64
      return { data: imageData.base64, type: 'base64' };
    } catch (error) {
      console.error('Image optimization failed:', error);
      return { data: imageData.base64, type: 'base64' };
    }
  };

  // UTILITY: Retrieve full image from IndexedDB cache
  const getFullImageFromCache = async (fullImageId: string): Promise<string | null> => {
    try {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not available, cannot retrieve full image');
        return null;
      }

      return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('CupidoImageCache', 1);
        
        dbRequest.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction(['images'], 'readonly');
          const store = transaction.objectStore('images');
          const getRequest = store.get(fullImageId);
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result && result.base64) {
              resolve(result.base64);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => resolve(null);
        };
      });
    } catch (error) {
      console.error('Error retrieving full image from cache:', error);
      return null;
    }
  };

  // PERFORMANCE: Lazy load images to reduce initial memory usage
  const createLazyImageReference = (imageId: string, metadata: any): ImageAttachment => {
    return {
      id: imageId,
      width: metadata.width || 200,
      height: metadata.height || 200,
      image_data: '', // Empty - will be loaded on demand
      mime_type: metadata.mimeType || 'image/jpeg',
      file_size: metadata.compressedSize || 0,
      metadata: {
        ...metadata,
        lazy: true, // Mark for lazy loading
        storageType: 'external'
      }
    };
  };

  const handleImageSelected = async (imageData: ImageProcessingResult) => {
    if (!currentConversation) {
      log.error('No current conversation for image upload', undefined, { component: 'SimpleReflectionChat' });
      return;
    }

    try {
      console.log('📸 Processing image upload:', {
        fileName: imageData.fileName,
        dimensions: `${imageData.width}x${imageData.height}`,
        originalSize: imageData.originalSize,
        compressedSize: imageData.compressedSize
      });

      const attachmentMetadata = {
        width: imageData.width,
        height: imageData.height,
        fileName: imageData.fileName,
        originalSize: imageData.originalSize,
        compressedSize: imageData.compressedSize
      };

      const inlineMessageMetadata = {
        hasImage: true,
        storageStrategy: 'inline' as const,
        inlineImage: {
          base64: imageData.base64, // Store full image in metadata for inline storage
          mimeType: imageData.mimeType,
          width: imageData.width,
          height: imageData.height,
          fileName: imageData.fileName,
          originalSize: imageData.originalSize,
          compressedSize: imageData.compressedSize,
        }
      };

      let imageAttachment: ImageAttachment | null = null;
      let storageStrategy: 'attachment' | 'inline' = 'attachment';

      try {
        imageAttachment = await chatDatabase.saveImageAttachment(
          currentConversation.id,
          userId,
          imageData.base64,
          imageData.mimeType,
          undefined,
          attachmentMetadata
        );
      } catch (error: any) {
        const combinedMessage = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
        const missingTable =
          error?.code === '42P01' ||
          error?.code === 'PGRST201' ||
          error?.code === 'PGRST204' ||
          combinedMessage.includes('image_attachments') && combinedMessage.includes('does not exist');

        if (missingTable) {
          log.warn('External image storage unavailable - using inline fallback', { storageStrategy: 'inline', component: 'SimpleReflectionChat' });
          storageStrategy = 'inline';
        } else {
          throw error;
        }
      }

      if (!imageAttachment && storageStrategy === 'attachment') {
        throw new Error('Failed to save image attachment');
      }

      if (storageStrategy === 'attachment' && imageAttachment) {
        const userMessage = await chatDatabase.saveMessage(
          currentConversation.id,
          'Image uploaded',
          false,
          undefined,
          { hasImage: true, imageAttachmentId: imageAttachment.id }
        );

        const messageId = userMessage?.id || `temp_image_${Date.now()}`;

        if (userMessage) {
          await chatDatabase.updateImageAttachment(imageAttachment.id, {
            message_id: userMessage.id
          });
        }

        // Use the actual image attachment with data
        const messageWithImage: Message = {
          id: messageId,
          text: '',
          isBot: false,
          timestamp: userMessage ? new Date(userMessage.created_at) : new Date(),
          imageAttachments: [imageAttachment] // Use actual attachment with image data
        };

        setMessages(prev => [...prev, messageWithImage]);
        
        // Add placeholder AFTER the image is shown
        const placeholderId = addPlaceholderMessage('📷 Got your photo—give me a moment to look closely...');

        setTimeout(() => {
          processImageInBackground(imageData, imageAttachment, placeholderId, {
            messageId: userMessage?.id,
            storageStrategy: 'attachment',
            persisted: Boolean(userMessage)
          });
        }, 100);
      } else {
        const inlineAttachmentId = `inline_${Date.now()}`;
        // PERFORMANCE: For inline storage, just use the full image data directly
        // The thumbnailData was only created when attachment succeeded
        
        const inlineAttachment: ImageAttachment = {
          id: inlineAttachmentId,
          conversation_id: currentConversation.id,
          user_id: userId,
          image_data: imageData.base64, // Use full image for inline storage
          mime_type: imageData.mimeType,
          file_size: imageData.compressedSize,
          width: imageData.width,
          height: imageData.height,
          created_at: new Date().toISOString(),
          metadata: {
            storageStrategy: 'inline',
            fileName: imageData.fileName,
            originalSize: imageData.originalSize,
            compressedSize: imageData.compressedSize,
          }
        };

        const inlineMessage: DBChatMessage | null = await chatDatabase.saveMessage(
          currentConversation.id,
          'Image uploaded',
          false,
          undefined,
          {
            ...inlineMessageMetadata,
            imageAttachmentId: inlineAttachmentId
          }
        );

        const finalMessageId = inlineMessage?.id || inlineAttachmentId;
        const finalTimestamp = inlineMessage ? new Date(inlineMessage.created_at) : new Date();

        const messageWithImage: Message = {
          id: finalMessageId,
          text: '',
          isBot: false,
          timestamp: finalTimestamp,
          imageAttachments: [{
            ...inlineAttachment,
            id: inlineAttachmentId,
          }]
        };

        setMessages(prev => [...prev, messageWithImage]);
        
        // Add placeholder AFTER the image is shown
        const placeholderId = addPlaceholderMessage('📷 Got your photo—give me a moment to look closely...');

        setTimeout(() => {
          processImageInBackground(imageData, inlineAttachment, placeholderId, {
            messageId: finalMessageId,
            storageStrategy: 'inline',
            baseMetadata: {
              ...inlineMessageMetadata,
              imageAttachmentId: inlineAttachmentId
            },
            persisted: Boolean(inlineMessage)
          });
        }, 100);
      }
    } catch (error) {
      log.error('Image upload processing failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'SimpleReflectionChat',
        function: 'handleImageSelected',
        imageFileName: imageData?.fileName,
      });
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    }
  };

  // Background image processing function  
  const processImageInBackground = async (
    imageData: ImageProcessingResult,
    imageAttachment: ImageAttachment,
    placeholderId: string,
    options?: {
      messageId?: string;
      storageStrategy?: 'attachment' | 'inline';
      baseMetadata?: any;
      persisted?: boolean;
    }
  ) => {
    try {
      // Show progress to user
      updatePlaceholderMessage(placeholderId, '📷 Analyzing your image...');
      const inferredStrategy = (imageAttachment.metadata as any)?.storageStrategy === 'inline' ? 'inline' : 'attachment';
      const storageStrategy = options?.storageStrategy || inferredStrategy;
      const linkedMessageId = options?.messageId;
      let inlineMetadata = options?.baseMetadata;

      if (storageStrategy === 'inline' && !inlineMetadata) {
        // CRITICAL FIX: Use thumbnail for metadata to prevent massive JSONB storage
        const thumbnailData = await createThumbnailForMetadata(imageData);
        
        inlineMetadata = {
          hasImage: true,
          storageStrategy: 'inline' as const,
          imageAttachmentId: imageAttachment.id,
          inlineImage: {
            thumbnail: thumbnailData.thumbnail, // Small thumbnail (~10KB) instead of full base64
            fullImageId: thumbnailData.fullImageId, // Reference to IndexedDB stored full image
            mimeType: imageAttachment.mime_type,
            width: imageAttachment.width,
            height: imageAttachment.height,
            fileName: (imageAttachment.metadata as any)?.fileName,
            originalSize: (imageAttachment.metadata as any)?.originalSize,
            compressedSize: (imageAttachment.metadata as any)?.compressedSize,
            compressionNote: 'Full image stored in IndexedDB, thumbnail in metadata for performance'
          }
        };
      }
      const canPersistInline = storageStrategy === 'inline' && !!linkedMessageId && !!inlineMetadata && !!options?.persisted;

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

          if (storageStrategy === 'inline' && linkedMessageId && inlineMetadata) {
            inlineMetadata = {
              ...inlineMetadata,
              imageAttachmentId: imageAttachment.id,
              inlineImage: {
                ...(inlineMetadata.inlineImage || {}),
                description: imageDescription,
                // Note: Keep thumbnail/fullImageId from original metadata, don't overwrite
              }
            };
            if (canPersistInline) {
              await chatDatabase.updateMessageMetadata(linkedMessageId, inlineMetadata);
            }
            setMessages(prev => prev.map(msg => 
              msg.id === linkedMessageId
                ? {
                    ...msg,
                    imageAttachments: msg.imageAttachments?.map(att =>
                      att.id === imageAttachment.id
                        ? {
                            ...att,
                            metadata: {
                              ...(att.metadata || {}),
                              imageDescription: imageDescription
                            }
                          }
                        : att
                    )
                  }
                : msg
            ));
          }

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

          // Step 3: Generate the main AI response with trimmed context for better performance
          setTypingMessage('Typing...');
          const conversationPrompt = "I just shared an image with you. What do you see? Tell me what interests you about it and ask me something about the image or the story behind it.";
          
          // Trim conversation history for image requests to improve performance and reduce payload
          // Build trimmed history from messages for image context
          const recentMessages = messages.slice(-10); // Last 10 messages for context
          const trimmedHistory = recentMessages
            .filter(m => !m.isPending && !m.imageUri && !m.imageAttachments)
            .map(m => ({
              role: m.isBot ? 'assistant' : 'user' as 'user' | 'assistant',
              content: m.text
            }))
          
          const aiResponse = await chatAiService.generateResponseWithImage(
            conversationPrompt,
            [...trimmedHistory, { role: 'user' as const, content: `[Image: ${imageDescription}]` }],
            conversationCount,
            { base64: imageData.base64, mimeType: imageData.mimeType }
          );

          // Update image attachment with AI analysis
          if (storageStrategy === 'attachment') {
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
          } else if (storageStrategy === 'inline' && linkedMessageId && inlineMetadata) {
            const analyzedAt = new Date().toISOString();
            inlineMetadata = {
              ...inlineMetadata,
              imageAttachmentId: imageAttachment.id,
              inlineImage: {
                ...(inlineMetadata.inlineImage || {}),
                description: inlineMetadata.inlineImage?.description || imageDescription,
                aiAnalysis: aiResponse.message,
                analyzedAt,
                // Note: Preserve thumbnail/fullImageId, never store full base64 in metadata
              }
            };
            if (canPersistInline) {
              await chatDatabase.updateMessageMetadata(linkedMessageId, inlineMetadata);
            }
            setMessages(prev => prev.map(msg => 
              msg.id === linkedMessageId
                ? {
                    ...msg,
                    imageAttachments: msg.imageAttachments?.map(att =>
                      att.id === imageAttachment.id
                        ? {
                            ...att,
                            metadata: {
                              ...(att.metadata || {}),
                              imageDescription: inlineMetadata.inlineImage?.description || imageDescription,
                              aiAnalysis: aiResponse.message,
                              analyzedAt
                            }
                          }
                        : att
                    )
                  }
                : msg
            ));
          }

          // Save AI response message
          const aiMessage = await chatDatabase.saveMessage(
            currentConversation.id,
            aiResponse.message,
            true,
            aiResponse.usedModel,
            { imageAnalysis: true, imageAttachmentId: imageAttachment.id }
          );

          // Log the saved message but don't add to UI (we update placeholder instead)
          if (aiMessage) {
            console.log('✅ Saved AI response:', aiMessage.id);
          } else {
            console.error('❌ Failed to save AI message to database (but continuing with placeholder)');
          }

          // Update placeholder with actual response
          updatePlaceholderMessage(placeholderId, aiResponse.message);
          
          // SIMPLE: Update conversation history with image context
          // No need to maintain conversationHistory state - we build it from messages

        } catch (error) {
          log.error('Error generating AI response for image', error, { component: 'SimpleReflectionChat' });
          
          // Update placeholder with friendly fallback
          const friendlyFallback = error?.message?.includes('TIMEOUT') 
            ? "I couldn't finish analyzing your photo, but I'd love to hear the story behind it! Tell me more about what's happening here."
            : "I can see your image! Tell me more about it - what's the story behind this photo?";
          
          updatePlaceholderMessage(placeholderId, friendlyFallback);
        }
    } catch (error) {
      log.error('Error in background image processing', error, { component: 'SimpleReflectionChat' });
      updatePlaceholderMessage(placeholderId, "Something went wrong analyzing your image, but I'd love to hear about it! What's happening in this photo?");
    }
  };

  const handleSend = async (messageText: string) => {
    const messageToSend = messageText;

    if (DEBUG) console.log('[handleSend] Called with:', {
      messageToSend: messageToSend.substring(0, 50),
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
      log.warn('Message send blocked', {
        component: 'SimpleReflectionChat',
        reason: !messageToSend.trim() ? 'empty_message' : 'already_sending',
        messageLength: messageToSend.length,
      });
      return;
    }

    // Validate and sanitize the message
    const messageValidation = validateChatMessage(messageToSend);
    if (!messageValidation.isValid) {
      log.warn('Invalid message rejected', {
        component: 'SimpleReflectionChat',
        errors: messageValidation.errors,
        messagePreview: messageToSend.substring(0, 50),
      });
      Alert.alert('Invalid Message', messageValidation.errors.join('\n'));
      return;
    }

    const validatedMessage = messageValidation.sanitizedValue || messageToSend;

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
    const trimmedMessage = validatedMessage.trim();
    const messageKey = `${activeConversation.id}_${trimmedMessage.toLowerCase()}`;
    
    // FIXED: Platform-agnostic duplicate prevention (works on both web and native)
    if (pendingMessagesRef.current.has(messageKey)) {
      console.log('⚠️ Blocked duplicate: exact same message already being sent');
      return;
    }
    
    // Add to pending messages
    pendingMessagesRef.current.add(messageKey);
    
    // Clear pending after message is processed (or 3s timeout for safety)
    setTimeout(() => {
      pendingMessagesRef.current.delete(messageKey);
    }, 3000);
    
    // Notify parent window (test dashboard) if in iframe
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      const targetOrigin = window.location.origin;
      window.parent.postMessage({
        type: 'cupido-message',
        sender: 'user',
        message: trimmedMessage,
        conversationId: activeConversation.id,
        timestamp: new Date().toISOString()
      }, targetOrigin);
    }

    // Also maintain web-specific tracking for backwards compatibility with test dashboard
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Initialize pending messages set if needed
      if (!(window as any).__pendingMessages) {
        (window as any).__pendingMessages = new Set();
      }
      // Add to window for test dashboard visibility
      (window as any).__pendingMessages.add(messageKey);
      setTimeout(() => {
        (window as any).__pendingMessages?.delete(messageKey);
      }, 3000);
    }

    log.userAction('message_sent', { component: 'SimpleReflectionChat', messageLength: trimmedMessage.length });

    setIsSending(true);
    isSendingRef.current = true; // Update ref immediately for test compatibility

    // OPTIMISTIC UI: Show message immediately
    const optimisticUserMessage: Message = {
      id: `temp_user_${Date.now()}`,
      text: trimmedMessage,
      isBot: false,
      timestamp: new Date(),
      isPending: true, // Mark as pending save
    };

    // Add to UI immediately for instant response
    setMessages(prev => trimMessagesIfNeeded([...prev, optimisticUserMessage]));
    
    // Release send button immediately
    setIsSending(false);
    isSendingRef.current = false;
    
    // Force auto-scroll when user sends a message
    shouldAutoScrollRef.current = true;
    
    // Scroll to bottom after adding user message with stronger scheduling
    requestAnimationFrame(() => {
      scrollToBottom(true);
      // Double-ensure scroll happens after content size change
      setTimeout(() => scrollToBottom(true), 50);
    });

    // Save user message to database in background (non-blocking)
    if (activeConversation) {
      chatDatabase.saveMessage(
        activeConversation.id,
        trimmedMessage,
        false, // is_bot = false for user
        undefined, // no AI model for user messages
        { 
          message_length: trimmedMessage.length
        }
      ).then(savedUserMessage => {
        // Update the optimistic message with real database ID
        if (savedUserMessage) {
          // Track this message ID as locally created
          if (savedUserMessage.id) {
            localMessageIdsRef.current.add(savedUserMessage.id);
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticUserMessage.id 
              ? { ...msg, id: savedUserMessage.id, isPending: false }
              : msg
          ));
        } else {
          // Mark as failed but keep in UI
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticUserMessage.id 
              ? { ...msg, isPending: false, saveFailed: true }
              : msg
          ));
          console.error('❌ Failed to save user message to database');
        }
      }).catch(error => {
        // Handle save errors gracefully
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticUserMessage.id 
            ? { ...msg, isPending: false, saveFailed: true }
            : msg
        ));
        console.error('Error saving user message:', error);
      });
    }

    try {
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
      generateResponse(trimmedMessage, activeConversation.id)
        .then(() => {
          if (DEBUG) console.log('[MOBILE DEBUG] generateResponse completed');
        })
        .catch(error => {
          console.error('[MOBILE DEBUG] generateResponse failed:', error);
        });
    } catch (error) {
      log.error('Critical error in message send', error instanceof Error ? error : new Error(String(error)), {
        component: 'SimpleReflectionChat',
        function: 'handleSend',
        messageText: messageText?.substring(0, 50),
        conversationId: activeConversation?.id,
        userId: effectiveUserId,
      });

      // If error occurred before we set isSending=false, reset it now
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  // FIXED: Use constant padding to prevent scroll position shifts
  // Since ChatInput is not overlayed (it's a sibling), we need minimal padding
  const messagesBottomPadding = Platform.OS === 'web' 
    ? 10  // Minimal padding for web
    : 20; // Small padding for native to account for safe areas

  // Render function for FlatList virtualization - memoized to prevent re-renders
  const renderMessage = useCallback(({ item: message, index }: { item: Message; index: number }) => {
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
    
    // Regular text message with optimistic UI indicators
    return (
      <View
        key={message.id}
        testID={`message-${index}`}
        style={[
          styles.messageContainer,
          message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
          message.isPending && styles.pendingMessage,
          message.saveFailed && styles.failedMessage,
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
          {message.isPending && (
            <Text style={styles.pendingIndicator}>Saving...</Text>
          )}
          {message.saveFailed && (
            <Text style={styles.failedIndicator}>Failed to save</Text>
          )}
        </View>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  }, []);

  // FIXED: Calculate dynamic keyboard offset based on actual header/tab heights
  const calculateKeyboardOffset = () => {
    if (Platform.OS === 'ios') {
      // Account for safe area, header, and tab bar
      const headerHeight = 44; // Standard iOS header height
      const offset = insets.top + headerHeight + (keyboardVisible ? 0 : tabBarHeight);
      return offset;
    }
    return 0; // Android handles this better automatically
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={calculateKeyboardOffset()}
    >
      {/* Messages area - Virtualized with FlatList for performance */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: messagesBottomPadding } // paddingBottom for normal list
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="messages-scroll-view"
        inverted={false} // Back to normal non-inverted list
        // Add keyboard avoiding behavior
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={21}
        getItemLayout={undefined} // Let FlatList calculate dynamically for variable heights
        // Pagination for loading older messages (pull-to-refresh)
        refreshing={isLoadingOlderMessages}
        onRefresh={hasMoreMessages ? loadOlderMessages : undefined}
        // ListHeaderComponent appears at top (for older messages)
        ListHeaderComponent={
          isLoadingOlderMessages ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading older messages...</Text>
            </View>
          ) : !hasMoreMessages && messages.length > MESSAGE_PAGE_SIZE ? (
            <View style={styles.endOfHistoryContainer}>
              <Text style={styles.endOfHistoryText}>You've reached the beginning of this conversation</Text>
            </View>
          ) : null
        }
        // ListFooterComponent appears at bottom (for typing indicator)
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer} testID="typing-indicator">
              <Text style={styles.typingText}>{typingMessage}</Text>
            </View>
          ) : null
        }
        onScroll={(event) => {
          // Track scroll position for new message indicator
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          // Account for padding in bottom detection
          const scrollPosition = contentOffset.y + layoutMeasurement.height;
          const contentBottom = contentSize.height - messagesBottomPadding;
          const atBottom = scrollPosition >= contentBottom - 20; // 20px threshold
          
          setIsAtBottom(atBottom);
          
          // FIXED: Only update shouldAutoScrollRef if we're not in a scroll animation
          // This prevents the race condition where onScroll fires during scrollToEnd animation
          if (!isScrollingRef.current) {
            shouldAutoScrollRef.current = atBottom;
          }
          
          // Clear new message indicator if scrolled to bottom
          if (atBottom && hasNewMessages) {
            setHasNewMessages(false);
          }
          
          // Show scroll button when not at bottom
          setShowScrollButton(!atBottom);
        }}
        scrollEventThrottle={16}
        onContentSizeChange={(_, contentHeight) => {
          // Auto-scroll when content size changes and we should auto-scroll
          if (shouldAutoScrollRef.current) {
            scrollToBottom(false);
          }
        }}
      />

      {/* New message indicator or scroll button */}
      {(showScrollButton || hasNewMessages) && (
        <Pressable 
          style={[
            styles.scrollToBottomButton,
            hasNewMessages && styles.newMessageButton
          ]}
          onPress={() => {
            scrollToBottom(true);
            setHasNewMessages(false);
          }}
        >
          {hasNewMessages ? (
            <View style={styles.newMessageContent}>
              <Text style={styles.newMessageText}>New message</Text>
              <Feather name="chevron-down" size={16} color="#FFF" />
            </View>
          ) : (
            <Feather name="arrow-down" size={20} color="#FFF" />
          )}
        </Pressable>
      )}

      {/* Separate ChatInput component - only re-renders on typing */}
      <ChatInput
        onSendMessage={handleSend}
        onImageSelected={handleImageSelected}
        isSending={isSending}
        placeholder="Share your thoughts..."
      />
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
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: DEFAULT_INPUT_AREA_HEIGHT,
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
  // Optimistic UI styles
  pendingMessage: {
    opacity: 0.7,
  },
  failedMessage: {
    opacity: 0.8,
  },
  pendingIndicator: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  failedIndicator: {
    fontSize: 10,
    color: '#ff6b6b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Pagination styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  endOfHistoryContainer: {
    padding: 15,
    alignItems: 'center',
  },
  endOfHistoryText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    minWidth: 50,
    height: 50,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newMessageButton: {
    backgroundColor: '#34C759',
    minWidth: 120,
  },
  newMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newMessageText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
