import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { StreamChatService } from '../services/streamChat';
import { theme } from '../utils/theme';
import { DEMO_MODE } from '../config/demo';

interface ChatScreenProps {
  matchId: string;
  otherUserId: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ matchId, otherUserId }) => {
  const { chatClient, isConnected } = useChat();
  const { user } = useAuth();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && chatClient && user) {
      initializeChannel();
    }
  }, [isConnected, chatClient, user, matchId]);

  const initializeChannel = async () => {
    try {
      // Try to get existing channel or create new one
      let channelInstance;
      
      try {
        channelInstance = await StreamChatService.getChannel(matchId);
      } catch (error) {
        // Channel doesn't exist, create it
        channelInstance = await StreamChatService.createChannel(
          matchId,
          user!.id,
          otherUserId
        );
      }

      // Add moderation rules
      await StreamChatService.addModerationRules(matchId);

      setChannel(channelInstance);
    } catch (error) {
      console.error('Error initializing channel:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const customMessageTheme = {
    messageSimple: {
      content: {
        container: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          marginVertical: theme.spacing.xs,
        },
        textContainer: {
          backgroundColor: 'transparent',
        },
        text: {
          color: theme.colors.text,
          fontSize: 16,
          lineHeight: 24,
        },
      },
    },
    messageInput: {
      container: {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        padding: theme.spacing.md,
      },
      inputBox: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.text,
        fontSize: 16,
      },
    },
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (DEMO_MODE) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Private Chat</Text>
          <Text style={styles.headerSubtitle}>
            Your conversation is private and secure
          </Text>
        </View>
        
        <View style={styles.demoMessage}>
          <Text style={styles.demoMessageText}>
            Chat functionality is available in the full version. 
            In demo mode, you can experience the Q&A room feature instead.
          </Text>
        </View>
      </View>
    );
  }

  if (!isConnected || !chatClient || !channel) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to connect to chat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Private Chat</Text>
        <Text style={styles.headerSubtitle}>
          Your conversation is private and secure
        </Text>
      </View>
      
      <View style={styles.demoMessage}>
        <Text style={styles.demoMessageText}>
          Stream Chat integration would be implemented here in production.
        </Text>
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
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  messageList: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  sendButtonText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  demoMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  demoMessageText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});