import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  sender: string;
  preview: string;
  timestamp: string;
  isAnonymous: boolean;
}

interface MessagesScreenProps {
  onClose: () => void;
}

const MessagesScreen = ({ onClose }: MessagesScreenProps) => {
  const messages: Message[] = [
    {
      id: '1',
      sender: 'Anonymous Match',
      preview: "That's such an interesting perspective...",
      timestamp: '2m ago',
      isAnonymous: true,
    },
    {
      id: '2',
      sender: 'Alex',
      preview: 'I completely agree about that question',
      timestamp: '1h ago',
      isAnonymous: false,
    },
    {
      id: '3',
      sender: 'Anonymous Match',
      preview: 'Your authenticity score is inspiring!',
      timestamp: '3h ago',
      isAnonymous: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <TouchableOpacity key={message.id} style={styles.messageItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{message.sender}</Text>
                <Text style={styles.timestamp}>{message.timestamp}</Text>
              </View>
              {message.isAnonymous && (
                <Text style={styles.anonymousLabel}>Anonymous</Text>
              )}
              <Text style={styles.messagePreview}>{message.preview}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 50,
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 14,
    color: '#999999',
  },
  anonymousLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 20,
  },
});

export default MessagesScreen;