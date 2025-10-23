import React, { useState, memo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ImageUpload from './ImageUpload';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onImageSelected: (image: any) => void;
  isSending: boolean;
  placeholder?: string;
}

// Memoized to prevent re-renders from parent
export const ChatInput = memo(({ 
  onSendMessage, 
  onImageSelected,
  isSending,
  placeholder = "Share your thoughts..." 
}: ChatInputProps) => {
  // Local state - only this component re-renders on typing
  const [inputText, setInputText] = useState('');
  
  const handleSend = () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSending) return;
    
    onSendMessage(trimmedText);
    setInputText(''); // Clear after sending
  };
  
  const handleKeyPress = (e: any) => {
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
      }
    }
  };
  
  const isDisabled = !inputText.trim() || isSending;
  
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <ImageUpload
          onImageSelected={onImageSelected}
          onError={(error) => console.error('Image error:', error)}
          disabled={isSending}
          style={styles.imageUploadButton}
        />
        
        <TextInput
          testID="chat-input"
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          maxLength={10000}
          returnKeyType={Platform.OS === 'web' ? 'send' : 'default'}
          blurOnSubmit={false}
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          onKeyPress={handleKeyPress}
          editable={!isSending}
        />
        
        <Pressable
          testID="send-button"
          style={({ pressed }) => [
            styles.sendButton,
            isDisabled && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed
          ]}
          onPress={handleSend}
          disabled={isDisabled}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather 
            name={isSending ? "loader" : "send"} 
            size={20} 
            color={isDisabled ? '#ccc' : '#007AFF'} 
          />
        </Pressable>
      </View>
    </View>
  );
});

ChatInput.displayName = 'ChatInput';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 56,
  },
  imageUploadButton: {
    marginRight: 12,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    color: '#000',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
});

export default ChatInput;