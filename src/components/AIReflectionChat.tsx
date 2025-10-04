import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppState, generateId } from '../contexts/AppStateContext';
import { reflectionAiService } from '../services/reflectionAiService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Parse retreat questions from markdown
const parseRetreatQuestions = () => {
  // Hardcode questions from retreat_questions_canvas.md
  const hardcodedQuestions = [
    // DIVE – Self-Discovery
    "What's a belief you've outgrown that once defined you?",
    "Which life decision are you proudest of — and why?",
    "When did you last feel completely outside your comfort zone?",
    "What unfinished dream still lingers in you?",
    "If your teenage self saw you now, what would surprise them most?",
    "What personal value have you never compromised on?",
    "When was the last time you changed your mind about something important?",
    "How do you know when you're truly at peace?",
    "What part of your identity feels misunderstood by others?",
    "Which habits serve you best — and which quietly sabotage you?",
    
    // SEEN – Healing & Deeper Relationships
    "What do you wish people asked you about more often?",
    "When was the last time you felt truly seen?",
    "What's one apology you wish you'd received?",
    "How do you show love when words fall short?",
    "What childhood wound still echoes in your adult life?",
    "When do you feel most vulnerable in relationships?",
    "What's a truth about yourself you find hard to share?",
    "Which relationship in your life has shaped you the most?",
    "What emotion do you hide most often from others?",
    "When did forgiveness change your life?",
    
    // Emotional Intelligence
    "How do you recognize when you're emotionally triggered?",
    "What emotional need do you struggle to express?",
    "When has empathy changed your perspective completely?",
    "How do you practice emotional self-care?",
    "What emotion do you find hardest to sit with?",
    
    // HOA (Hopes, Opportunities, Aspirations)
    "What opportunity are you most excited about right now?",
    "If you could master one new skill this year, what would it be?",
    "What legacy do you want to leave behind?",
    "What does success look like to you now versus five years ago?",
    "What adventure is calling your name?"
  ];
  
  return hardcodedQuestions;
};

const REFLECTION_QUESTIONS = parseRetreatQuestions();

interface AIReflectionChatProps {
  onKeyboardToggle?: (isVisible: boolean) => void;
}

export const AIReflectionChat: React.FC<AIReflectionChatProps> = ({ onKeyboardToggle }) => {
  const { dispatch } = useAppState();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [debugMode] = useState(false); // Set to true to see positioning debug info
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Start with a random question from the retreat questions
    const randomIndex = Math.floor(Math.random() * REFLECTION_QUESTIONS.length);
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      text: REFLECTION_QUESTIONS[randomIndex],
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setQuestionIndex(randomIndex);
  }, []);

  useEffect(() => {
    // Keyboard listeners
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        onKeyboardToggle?.(true);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        onKeyboardToggle?.(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [onKeyboardToggle]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const generateFollowUpQuestion = async (userResponse: string) => {
    try {
      setIsTyping(true);
      
      // Use the AI service to generate a contextual follow-up
      const aiResponse = await reflectionAiService.generateFollowUp(
        conversationContext.join('\n'),
        userResponse,
        REFLECTION_QUESTIONS[questionIndex]
      );
      
      if (aiResponse && aiResponse.followUpQuestion) {
        return aiResponse.followUpQuestion;
      }
    } catch (error) {
      console.log('AI service not available, using fallback questions');
    } finally {
      setIsTyping(false);
    }
    
    // Fallback: select next question from the list
    const nextIndex = (questionIndex + 1) % REFLECTION_QUESTIONS.length;
    setQuestionIndex(nextIndex);
    return REFLECTION_QUESTIONS[nextIndex];
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Update conversation context
    const newContext = [...conversationContext, `User: ${inputText.trim()}`];
    setConversationContext(newContext);

    // Save to app state
    dispatch({
      type: 'ADD_ANSWER',
      payload: {
        id: generateId(),
        questionId: `q${questionIndex}`,
        questionText: messages[messages.length - 1]?.text || '',
        text: inputText.trim(),
        category: 'Reflection',
        timestamp: new Date().toISOString(),
        hearts: 0,
        isLiked: false,
      },
    });

    // Clear input
    const userInput = inputText.trim();
    setInputText('');

    // Generate and add bot response
    setIsTyping(true);
    const followUpQuestion = await generateFollowUpQuestion(userInput);
    
    const botMessage: ChatMessage = {
      id: generateId(),
      text: followUpQuestion,
      isBot: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, botMessage]);
    setConversationContext([...newContext, `Coach: ${followUpQuestion}`]);
    setIsTyping(false);
  };

  const renderMessage = (message: ChatMessage) => {
    return (
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
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Calculate bottom padding for messages to not be hidden behind input
  const messagesBottomPadding = keyboardVisible 
    ? 70 // Space for input when keyboard is shown
    : tabBarHeight + 70; // Space for input + tab bar when keyboard is hidden

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.innerContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: messagesBottomPadding } // Dynamic padding based on keyboard state
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}
          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>Coach is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[
          styles.inputWrapper,
          {
            bottom: keyboardVisible ? 0 : tabBarHeight, // Position directly above tab bar
            paddingBottom: keyboardVisible 
              ? (Platform.OS === 'ios' ? 10 : 5)
              : 10, // Consistent padding
          }
        ]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Share your thoughts..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Feather 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#007AFF' : '#C0C0C0'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        {/* Debug overlay */}
        {debugMode && (
          <View style={styles.debugOverlay}>
            <Text style={styles.debugText}>TabBar Height: {tabBarHeight}px</Text>
            <Text style={styles.debugText}>Keyboard: {keyboardVisible ? `Yes (${keyboardHeight}px)` : 'No'}</Text>
            <Text style={styles.debugText}>Input Bottom: {keyboardVisible ? 0 : tabBarHeight}px</Text>
            <Text style={styles.debugText}>Msg Padding: {messagesBottomPadding}px</Text>
          </View>
        )}
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 9999,
  },
  debugText: {
    color: 'white',
    fontSize: 11,
    marginBottom: 2,
  },
});