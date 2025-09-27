import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

interface MinimalChatInputProps {
  onSendMessage: (message: {
    text: string;
    imageUri?: string;
    fileUri?: string;
    location?: { latitude: number; longitude: number };
    audioUri?: string;
  }) => void;
  placeholder?: string;
}

export const MinimalChatInput: React.FC<MinimalChatInputProps> = ({
  onSendMessage,
  placeholder = "Share your thoughts...",
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [attachments, setAttachments] = useState<{
    imageUri?: string;
    fileUri?: string;
    location?: { latitude: number; longitude: number };
    audioUri?: string;
  }>({});
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Handle microphone recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant audio recording permission.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // Simulate transcription - in production, use a speech-to-text API
        const transcribedText = "Voice message transcribed...";
        setInputText(transcribedText);
        setAttachments({ ...attachments, audioUri: uri });
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Handle image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachments({ ...attachments, imageUri: result.assets[0].uri });
    }
    setShowAttachmentMenu(false);
  };

  // Handle file picker
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setAttachments({ ...attachments, fileUri: result.uri });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
    setShowAttachmentMenu(false);
  };

  // Handle location
  const shareLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant location access.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setAttachments({
      ...attachments,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    });
    setShowAttachmentMenu(false);
  };

  // Toggle attachment menu
  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
    Animated.timing(fadeAnim, {
      toValue: showAttachmentMenu ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Handle send
  const handleSend = () => {
    if (inputText.trim() || Object.keys(attachments).length > 0) {
      onSendMessage({
        text: inputText.trim(),
        ...attachments,
      });
      setInputText('');
      setAttachments({});
    }
  };

  // Remove attachment
  const removeAttachment = (type: string) => {
    const newAttachments = { ...attachments };
    delete newAttachments[type as keyof typeof attachments];
    setAttachments(newAttachments);
  };

  return (
    <View style={styles.container}>
      {/* Attachment preview */}
      {Object.keys(attachments).length > 0 && (
        <View style={styles.attachmentPreview}>
          {attachments.imageUri && (
            <View style={styles.attachmentItem}>
              <Image source={{ uri: attachments.imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAttachment('imageUri')}
              >
                <Feather name="x" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
          {attachments.fileUri && (
            <View style={styles.attachmentChip}>
              <Feather name="file" size={14} color="#666" />
              <Text style={styles.attachmentText}>File attached</Text>
              <TouchableOpacity onPress={() => removeAttachment('fileUri')}>
                <Feather name="x" size={14} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          {attachments.location && (
            <View style={styles.attachmentChip}>
              <Feather name="map-pin" size={14} color="#666" />
              <Text style={styles.attachmentText}>Location</Text>
              <TouchableOpacity onPress={() => removeAttachment('location')}>
                <Feather name="x" size={14} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Attachment menu */}
      {showAttachmentMenu && (
        <Animated.View
          style={[
            styles.attachmentMenu,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={styles.menuItem} onPress={pickImage}>
            <View style={styles.menuIcon}>
              <Feather name="image" size={20} color="#000" />
            </View>
            <Text style={styles.menuText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={pickDocument}>
            <View style={styles.menuIcon}>
              <Feather name="file" size={20} color="#000" />
            </View>
            <Text style={styles.menuText}>File</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={shareLocation}>
            <View style={styles.menuIcon}>
              <Feather name="map-pin" size={20} color="#000" />
            </View>
            <Text style={styles.menuText}>Location</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        {/* Attachment button */}
        <TouchableOpacity
          style={styles.attachButton}
          onPress={toggleAttachmentMenu}
        >
          <Feather name="paperclip" size={20} color="#666" />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          style={[styles.textInput, isRecording && styles.textInputRecording]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isRecording ? "Listening..." : placeholder}
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={!isRecording}
        />

        {/* Microphone button */}
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Animated.View
            style={{
              transform: [{ scale: isRecording ? pulseAnim : 1 }],
            }}
          >
            <Feather
              name="mic"
              size={20}
              color={isRecording ? "#FFF" : "#666"}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Send button */}
        {(inputText.trim() || Object.keys(attachments).length > 0) && (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Feather name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attachmentPreview: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  attachmentItem: {
    position: 'relative',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  attachmentText: {
    fontSize: 12,
    color: '#666',
  },
  attachmentMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItem: {
    alignItems: 'center',
    gap: 4,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 36,
    color: '#000',
  },
  textInputRecording: {
    backgroundColor: '#FFF3F3',
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});