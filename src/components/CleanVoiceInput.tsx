import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';

interface CleanVoiceInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const CleanVoiceInput: React.FC<CleanVoiceInputProps> = ({
  value,
  onChangeText,
  placeholder = "Your thoughts...",
  maxLength = 500,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API for web platforms
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update text with final transcript
        if (finalTranscript) {
          const cleanTranscript = finalTranscript.trim();
          const newText = value + (value ? ' ' : '') + cleanTranscript;
          console.log('Voice input - new text:', newText, 'length:', newText.length);
          if (newText.length <= maxLength) {
            onChangeText(newText);
          }
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [value, onChangeText, maxLength]);

  const handleVoiceToggle = () => {
    if (!recognition) {
      Alert.alert(
        'Voice input not supported',
        'Speech recognition is not available in this browser.'
      );
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleTextChange = (text: string) => {
    if (text.length <= maxLength) {
      onChangeText(text);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            isListening && styles.textInputListening
          ]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          autoFocus
        />
        
        {/* Wispr Flow style voice button */}
        <TouchableOpacity 
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive
          ]}
          onPress={handleVoiceToggle}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.voiceIcon,
            isListening && styles.voiceIconActive
          ]}>
            🎤
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice status indicator */}
      {isListening && (
        <View style={styles.listeningIndicator}>
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>Listening...</Text>
        </View>
      )}

      {/* Character count */}
      <Text style={styles.characterCount}>
        {value.length}/{maxLength}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    paddingRight: 60, // Space for voice button
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textInputListening: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  voiceButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceButtonActive: {
    backgroundColor: '#007AFF',
    transform: [{ scale: 1.1 }],
  },
  voiceIcon: {
    fontSize: 16,
  },
  voiceIconActive: {
    fontSize: 16,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
    opacity: 0.8,
  },
  listeningText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
  },
});