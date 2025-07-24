import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Button, TextInput, Card } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { PromptService } from '../services/prompts';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { Prompt, Response } from '../types';
import { theme } from '../utils/theme';
import { DEMO_MODE } from '../config/demo';

export const PromptScreen: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const { isRecording, recordingUri, startRecording, stopRecording, clearRecording } = useVoiceRecording();

  useEffect(() => {
    loadTodaysPrompt();
  }, [user]);

  const loadTodaysPrompt = async () => {
    if (!user) return;

    try {
      const todaysPrompt = await PromptService.getTodaysPrompt(user.id);
      if (todaysPrompt) {
        setPrompt(todaysPrompt);
        setHasCompletedToday(false);
      } else {
        setHasCompletedToday(true);
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!user || !prompt) return;

    if (responseType === 'text' && !textResponse.trim()) {
      Alert.alert('Error', 'Please enter your response');
      return;
    }

    if (responseType === 'voice' && !recordingUri) {
      Alert.alert('Error', 'Please record your response');
      return;
    }

    setLoading(true);
    try {
      const content = responseType === 'text' ? textResponse : 'Voice response';
      const audioUrl = responseType === 'voice' ? recordingUri : undefined;

      await PromptService.submitResponse(
        user.id,
        prompt.id,
        content,
        responseType,
        audioUrl
      );

      Alert.alert('Success', 'Your response has been recorded!');
      setHasCompletedToday(true);
      setTextResponse('');
      clearRecording();
      
      updateUser({ streak: user.streak + 1 });
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    if (DEMO_MODE) {
      Alert.alert('Demo Mode', 'Voice playback would work in the full version!');
      return;
    }

    try {
      const { Audio } = await import('expo-av');
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  if (hasCompletedToday) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Card style={styles.completedCard}>
            <Text style={styles.completedTitle}>Well done!</Text>
            <Text style={styles.completedMessage}>
              You've completed today's reflection. Your streak is now {user?.streak || 0} days.
            </Text>
            <Text style={styles.completedSubMessage}>
              Come back tomorrow for your next self-discovery prompt.
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!prompt) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading today's prompt...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.streakText}>Day {user?.streak || 0}</Text>
          <Text style={styles.title}>Today's Reflection</Text>
        </View>

        <Card style={styles.promptCard}>
          {prompt.theme && (
            <View style={styles.themeContainer}>
              <Text style={styles.themeText}>{prompt.theme.replace(/_/g, ' ').toUpperCase()}</Text>
              {prompt.emotionalDepth && (
                <View style={[styles.depthIndicator, styles[`depth${prompt.emotionalDepth.charAt(0).toUpperCase() + prompt.emotionalDepth.slice(1)}`]]}>
                  <Text style={styles.depthText}>{prompt.emotionalDepth}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.promptText}>{prompt.question}</Text>
          {prompt.tone && (
            <Text style={styles.toneText}>Tone: {prompt.tone}</Text>
          )}
        </Card>

        <View style={styles.responseTypeContainer}>
          <TouchableOpacity
            style={[
              styles.responseTypeButton,
              responseType === 'text' && styles.responseTypeButtonActive
            ]}
            onPress={() => setResponseType('text')}
          >
            <Text style={[
              styles.responseTypeText,
              responseType === 'text' && styles.responseTypeTextActive
            ]}>
              Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.responseTypeButton,
              responseType === 'voice' && styles.responseTypeButtonActive
            ]}
            onPress={() => setResponseType('voice')}
          >
            <Text style={[
              styles.responseTypeText,
              responseType === 'voice' && styles.responseTypeTextActive
            ]}>
              Voice
            </Text>
          </TouchableOpacity>
        </View>

        {responseType === 'text' ? (
          <TextInput
            placeholder="Share your thoughts..."
            value={textResponse}
            onChangeText={setTextResponse}
            multiline
            numberOfLines={6}
            style={styles.textInput}
          />
        ) : (
          <View style={styles.voiceContainer}>
            <Button
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              onPress={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'secondary' : 'primary'}
              style={styles.recordButton}
            />
            
            {recordingUri && (
              <View style={styles.recordingActions}>
                <Button
                  title="Play Recording"
                  onPress={playRecording}
                  variant="outline"
                  size="small"
                />
                <Button
                  title="Clear"
                  onPress={clearRecording}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
          </View>
        )}

        <Button
          title={loading ? 'Submitting...' : 'Submit Response'}
          onPress={handleSubmitResponse}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  streakText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  promptCard: {
    marginBottom: theme.spacing.xl,
  },
  promptText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 24,
  },
  responseTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  responseTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
  },
  responseTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  responseTypeText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  responseTypeTextActive: {
    color: theme.colors.secondary,
  },
  textInput: {
    marginBottom: theme.spacing.xl,
  },
  voiceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  recordButton: {
    marginBottom: theme.spacing.md,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  completedCard: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  completedTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  completedMessage: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  completedSubMessage: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  themeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  depthIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  depthLow: {
    backgroundColor: '#E8F5E8',
  },
  depthMedium: {
    backgroundColor: '#FFF3CD',
  },
  depthHigh: {
    backgroundColor: '#F8D7DA',
  },
  depthText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text,
  },
  toneText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
});