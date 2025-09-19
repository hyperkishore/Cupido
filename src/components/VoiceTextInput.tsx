import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

interface VoiceTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  style?: any;
  autoFocus?: boolean;
}

export const VoiceTextInput: React.FC<VoiceTextInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Tap to type or hold to speak...',
  multiline = true,
  maxLength = 500,
  style,
  autoFocus = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const { startRecording, stopRecording, isRecording } = useVoiceRecording();

  // Web Speech API for web platform
  const [webSpeechRecognition, setWebSpeechRecognition] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript;
            }
          }
          
          if (transcript) {
            const newText = value + (value ? ' ' : '') + transcript;
            onChangeText(newText);
            setTranscribedText(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          Alert.alert('Voice Recognition Error', 'Could not process your voice. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setWebSpeechRecognition(recognition);
      }
    }
  }, [value, onChangeText]);

  const startVoiceInput = () => {
    if (Platform.OS === 'web') {
      if (webSpeechRecognition) {
        setIsListening(true);
        webSpeechRecognition.start();
      } else {
        Alert.alert(
          'Voice Input Not Available',
          'Voice input is not supported in your browser. Please use a modern browser like Chrome or Safari.'
        );
      }
    } else {
      // For React Native, use the existing voice recording hook
      setIsListening(true);
      startRecording();
      
      // Simulate transcription for demo (replace with actual Whisper API call)
      setTimeout(() => {
        const demoTranscriptions = [
          "I think authentic connection comes from being vulnerable with each other.",
          "When someone really listens without trying to fix or judge, that's when I feel most understood.",
          "Small acts of kindness remind me that humanity is fundamentally good.",
          "I learned that asking 'How can I support you?' works better than giving unsolicited advice.",
          "There's something magical about comfortable silence with someone you trust."
        ];
        const randomTranscription = demoTranscriptions[Math.floor(Math.random() * demoTranscriptions.length)];
        const newText = value + (value ? ' ' : '') + randomTranscription;
        onChangeText(newText);
        setTranscribedText(randomTranscription);
        stopVoiceInput();
      }, 3000);
    }
  };

  const stopVoiceInput = () => {
    setIsListening(false);
    if (Platform.OS === 'web') {
      if (webSpeechRecognition) {
        webSpeechRecognition.stop();
      }
    } else {
      stopRecording();
    }
  };

  const handleLongPress = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const handlePressOut = () => {
    if (isListening && Platform.OS !== 'web') {
      // For mobile, stop on release (push-to-talk style)
      stopVoiceInput();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          multiline={multiline}
          maxLength={maxLength}
          style={[styles.textInput, isListening && styles.textInputListening]}
          autoFocus={autoFocus}
          textAlignVertical="top"
        />
      </View>
      
      {/* Wispr Flow-inspired voice button below text area */}
      <TouchableOpacity 
        style={[styles.voiceButtonWispr, isListening && styles.voiceButtonActive]}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        onPress={() => {
          if (Platform.OS === 'web') {
            handleLongPress();
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.voiceButtonContent}>
          <View style={[styles.voiceIcon, isListening && styles.voiceIconActive]} />
          <Text style={[styles.voiceButtonText, isListening && styles.voiceButtonTextActive]}>
            {isListening ? 'Listening...' : 'Voice Input'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {isListening && (
        <View style={styles.listeningIndicator}>
          <View style={styles.pulseAnimation} />
          <Text style={styles.listeningText}>
            {Platform.OS === 'web' ? 'Click again to stop' : 'Release to stop'}
          </Text>
        </View>
      )}
      
      {transcribedText && !isListening && (
        <View style={styles.transcriptionPreview}>
          <Text style={styles.transcriptionText}>"{transcribedText}"</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textInput: {
    fontSize: 18,
    color: '#000000',
    lineHeight: 26,
    minHeight: 120,
    fontWeight: '400',
  },
  textInputListening: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  // Wispr Flow-inspired voice button
  voiceButtonWispr: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#333333',
  },
  voiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  voiceIconActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voiceButtonTextActive: {
    color: '#FFFFFF',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  pulseAnimation: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  listeningText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  transcriptionPreview: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
  },
  transcriptionText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  footer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
});