import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { feedbackDatabase, FeedbackEntry } from '../services/feedbackDatabase';

interface FeedbackViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackViewer: React.FC<FeedbackViewerProps> = ({
  visible,
  onClose,
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFeedback();
    }
  }, [visible]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const feedback = await feedbackDatabase.getAllFeedback();
      setFeedbackList(feedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (id: number) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await feedbackDatabase.deleteFeedback(id);
              loadFeedback(); // Reload the list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete feedback');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#34C759';
      case 'medium': return '#FF9500';
      case 'high': return '#FF6B6B';
      case 'critical': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feedback Entries ({feedbackList.length})</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading feedback...</Text>
            </View>
          ) : feedbackList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No feedback entries yet</Text>
              <Text style={styles.emptySubtext}>
                Enable feedback mode (Cmd+Q) and long-press elements to provide feedback
              </Text>
            </View>
          ) : (
            feedbackList.map((feedback, index) => (
              <View key={feedback.id || index} style={styles.feedbackItem}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.feedbackMeta}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(feedback.priority || 'medium') },
                      ]}
                    />
                    <Text style={styles.componentText}>
                      {feedback.component_type} • {feedback.screen_name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteFeedback(feedback.id!)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.feedbackText}>{feedback.feedback_text}</Text>

                <View style={styles.feedbackFooter}>
                  <Text style={styles.categoryTag}>{feedback.category}</Text>
                  <Text style={styles.timestamp}>
                    {formatDate(feedback.timestamp || '')}
                  </Text>
                </View>

                {feedback.element_bounds && (
                  <View style={styles.technicalDetails}>
                    <Text style={styles.technicalText}>
                      ID: {feedback.component_id} • Bounds: {feedback.element_bounds}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  feedbackItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  componentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  deleteButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '300',
  },
  feedbackText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  technicalDetails: {
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
    paddingTop: 8,
    marginTop: 8,
  },
  technicalText: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
});