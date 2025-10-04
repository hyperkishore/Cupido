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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppState, generateId } from '../contexts/AppStateContext';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Sample reflection questions
const REFLECTION_QUESTIONS = [
  "Welcome! I'm here to help you reflect on your day. What's been on your mind lately?",
  "That's interesting. How did that make you feel?",
  "What do you think you learned from that experience?",
  "Is there anything you would do differently next time?",
  "What are you most grateful for today?",
  "How has this shaped your perspective?",
  "What small step could you take tomorrow based on this reflection?",
  "That sounds meaningful. Can you tell me more about why it matters to you?",
];

export const SimpleChatInterface = () => {
  const { dispatch } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add initial welcome message
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      text: REFLECTION_QUESTIONS[0],
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

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
    setInputText('');

    // Add bot response after a short delay
    setTimeout(() => {
      const nextIndex = (questionIndex + 1) % REFLECTION_QUESTIONS.length;
      const botMessage: ChatMessage = {
        id: generateId(),
        text: REFLECTION_QUESTIONS[nextIndex === 0 ? 1 : nextIndex],
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setQuestionIndex(nextIndex);
    }, 1000);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>

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
    paddingBottom: 20,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
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
});