import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

interface MessagesScreenProps {
  onClose: () => void;
}

export const PixelPerfectMessagesScreen = ({ onClose }: MessagesScreenProps) => {
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
        {/* Anonymous Match Message */}
        <TouchableOpacity style={styles.messageItem}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>Anonymous Match</Text>
              <Text style={styles.timestamp}>2m ago</Text>
            </View>
            <Text style={styles.messagePreview}>
              That's such an interesting perspective...
            </Text>
            <Text style={styles.anonymousLabel}>Anonymous</Text>
          </View>
        </TouchableOpacity>

        {/* Alex Message */}
        <TouchableOpacity style={styles.messageItem}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>Alex</Text>
              <Text style={styles.timestamp}>1h ago</Text>
            </View>
            <Text style={styles.messagePreview}>
              I completely agree about that question
            </Text>
          </View>
        </TouchableOpacity>

        {/* Anonymous Match Message 2 */}
        <TouchableOpacity style={styles.messageItem}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>Anonymous Match</Text>
              <Text style={styles.timestamp}>3h ago</Text>
            </View>
            <Text style={styles.messagePreview}>
              Your authenticity score is inspiring!
            </Text>
            <Text style={styles.anonymousLabel}>Anonymous</Text>
          </View>
        </TouchableOpacity>
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 44,
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  messageContent: {
    flex: 1,
    paddingTop: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 15,
    color: '#8E8E93',
  },
  messagePreview: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 2,
  },
  anonymousLabel: {
    fontSize: 13,
    color: '#007AFF',
  },
});