import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { DEMO_MODE } from '../config/demo';

export const useVoiceRecording = () => {
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (recording) {
        setRecording(null);
      }
    };
  }, [recording]);

  const startRecording = async () => {
    if (DEMO_MODE) {
      // Demo mode simulation
      setIsRecording(true);
      setRecordingUri(null);
      return;
    }

    try {
      // In production, use expo-av
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingUri(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (DEMO_MODE) {
      // Demo mode simulation
      setIsRecording(false);
      const mockUri = 'demo://recording.m4a';
      setRecordingUri(mockUri);
      setRecording(null);
      return mockUri;
    }

    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      return null;
    }
  };

  const clearRecording = () => {
    setRecordingUri(null);
    setRecording(null);
    setIsRecording(false);
  };

  return {
    isRecording,
    recordingUri,
    startRecording,
    stopRecording,
    clearRecording,
  };
};