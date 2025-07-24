import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Button, TextInput, Card } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { QARoomService } from '../services/qaRoom';
import { QARoom, QAMessage } from '../types';
import { theme } from '../utils/theme';

interface QARoomScreenProps {
  roomId: string;
}

export const QARoomScreen: React.FC<QARoomScreenProps> = ({ roomId }) => {
  const { user } = useAuth();
  const [room, setRoom] = useState<QARoom | null>(null);
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'question' | 'answer'>('question');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestion, setSuggestedQuestion] = useState('');

  useEffect(() => {
    loadRoom();
    const interval = setInterval(loadRoom, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const roomData = await QARoomService.getQARoom(roomId);
      if (roomData) {
        setRoom(roomData);
        setMessages(roomData.messages);
      }
    } catch (error) {
      console.error('Error loading room:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      await QARoomService.sendMessage(roomId, user.id, newMessage, messageType);
      setNewMessage('');
      await loadRoom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const suggestQuestion = async () => {
    try {
      const question = await QARoomService.suggestQuestion(roomId);
      setSuggestedQuestion(question);
    } catch (error) {
      console.error('Error suggesting question:', error);
    }
  };

  const useSuggestedQuestion = () => {
    setNewMessage(suggestedQuestion);
    setMessageType('question');
    setSuggestedQuestion('');
  };

  const revealIdentities = async () => {
    try {
      const canReveal = await QARoomService.canRevealIdentities(roomId);
      if (!canReveal) {
        Alert.alert('Not Ready', 'You need to exchange more messages before revealing identities.');
        return;
      }

      Alert.alert(
        'Reveal Identities',
        'Are you sure you want to reveal identities? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reveal',
            onPress: async () => {
              await QARoomService.revealIdentities(roomId);
              await loadRoom();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error revealing identities:', error);
      Alert.alert('Error', 'Failed to reveal identities');
    }
  };

  const getMessageDisplayName = (message: QAMessage) => {
    if (room?.revealedAt) {
      return message.userId === user?.id ? 'You' : 'Match';
    }
    return message.userId === user?.id ? 'You' : 'Anonymous';
  };

  const getOtherUserName = () => {
    if (!room || !user) return 'Anonymous';
    if (room.revealedAt) {
      return 'Your Match';
    }
    return 'Anonymous Match';
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Anonymous Q&A</Text>
        <Text style={styles.subtitle}>
          Chat with {getOtherUserName()}
        </Text>
        {!room.revealedAt && (
          <TouchableOpacity onPress={revealIdentities} style={styles.revealButton}>
            <Text style={styles.revealButtonText}>Reveal Identities</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            item.userId === user?.id ? styles.myMessage : styles.theirMessage
          ]}>
            <Text style={styles.messageAuthor}>
              {getMessageDisplayName(item)}
            </Text>
            <Text style={[
              styles.messageType,
              item.type === 'question' ? styles.questionType : styles.answerType
            ]}>
              {item.type === 'question' ? 'Question' : 'Answer'}
            </Text>
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <View style={styles.messageTypeContainer}>
          <TouchableOpacity
            style={[
              styles.messageTypeButton,
              messageType === 'question' && styles.messageTypeButtonActive
            ]}
            onPress={() => setMessageType('question')}
          >
            <Text style={[
              styles.messageTypeText,
              messageType === 'question' && styles.messageTypeTextActive
            ]}>
              Question
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.messageTypeButton,
              messageType === 'answer' && styles.messageTypeButtonActive
            ]}
            onPress={() => setMessageType('answer')}
          >
            <Text style={[
              styles.messageTypeText,
              messageType === 'answer' && styles.messageTypeTextActive
            ]}>
              Answer
            </Text>
          </TouchableOpacity>
        </View>

        {messageType === 'question' && (
          <View style={styles.suggestionContainer}>
            <Button
              title="Suggest Question"
              onPress={suggestQuestion}
              variant="outline"
              size="small"
            />
            {suggestedQuestion && (
              <Card variant="minimal" style={styles.suggestionCard}>
                <Text style={styles.suggestionText}>{suggestedQuestion}</Text>
                <Button
                  title="Use This Question"
                  onPress={useSuggestedQuestion}
                  size="small"
                />
              </Card>
            )}
          </View>
        )}

        <TextInput
          placeholder={`Type your ${messageType}...`}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          title={loading ? 'Sending...' : `Send ${messageType}`}
          onPress={sendMessage}
          disabled={loading || !newMessage.trim()}
          style={styles.sendButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  revealButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  revealButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  messageContainer: {
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  myMessage: {
    backgroundColor: theme.colors.surface,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  theirMessage: {
    backgroundColor: theme.colors.secondary,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageAuthor: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  messageType: {
    ...theme.typography.small,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  questionType: {
    color: theme.colors.primary,
  },
  answerType: {
    color: theme.colors.textSecondary,
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  messageTime: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  messageTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  messageTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
  },
  messageTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  messageTypeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
  },
  messageTypeTextActive: {
    color: theme.colors.secondary,
  },
  suggestionContainer: {
    marginBottom: theme.spacing.md,
  },
  suggestionCard: {
    marginTop: theme.spacing.sm,
  },
  suggestionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  sendButton: {},
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});