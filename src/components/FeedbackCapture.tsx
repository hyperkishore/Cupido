import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
// Platform-specific import will automatically use .web.ts for web and .ts for native
import { feedbackDatabase } from '../services/feedbackDatabase';
import { VoiceTextInput } from './VoiceTextInput';

interface FeedbackCaptureProps {
  visible: boolean;
  onClose: () => void;
  elementInfo: {
    componentId: string;
    componentType: string;
    bounds: { x: number; y: number; width: number; height: number };
    screenName: string;
  };
}

export const FeedbackCapture: React.FC<FeedbackCaptureProps> = ({
  visible,
  onClose,
  elementInfo,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<'ui' | 'ux' | 'bug' | 'feature' | 'content' | 'performance' | 'accessibility' | 'general'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Feedback Required', 'Please enter your feedback before submitting.');
      return;
    }

    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);

    try {
      console.log('Submitting feedback...', {
        screen_name: elementInfo.screenName,
        component_id: elementInfo.componentId,
        component_type: elementInfo.componentType,
        element_bounds: JSON.stringify(elementInfo.bounds),
        feedback_text: feedbackText.trim(),
        priority,
        category,
      });

      const feedbackId = await feedbackDatabase.addFeedback({
        screen_name: elementInfo.screenName,
        component_id: elementInfo.componentId,
        component_type: elementInfo.componentType,
        element_bounds: JSON.stringify(elementInfo.bounds),
        feedback_text: feedbackText.trim(),
        priority,
        category,
        user_agent: Platform.OS === 'web' ? (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown') : `${Platform.OS} ${Platform.Version}`,
      });

      console.log('Feedback submitted successfully with ID:', feedbackId);
      
      Alert.alert(
        'Feedback Submitted!',
        `Thank you for your feedback about the ${elementInfo.componentType}. It will help improve the app experience.`,
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', `Failed to submit feedback: ${error?.message || error}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedbackText('');
    setPriority('medium');
    setCategory('general');
    onClose();
  };

  const priorities = [
    { key: 'low', label: 'Low', color: '#34C759' },
    { key: 'medium', label: 'Medium', color: '#FF9500' },
    { key: 'high', label: 'High', color: '#FF6B6B' },
    { key: 'critical', label: 'Critical', color: '#FF3B30' },
  ];

  const categories = [
    { key: 'ui', label: 'UI Issue' },
    { key: 'ux', label: 'UX Problem' },
    { key: 'bug', label: 'Bug' },
    { key: 'feature', label: 'Feature Request' },
    { key: 'content', label: 'Content' },
    { key: 'performance', label: 'Performance' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'general', label: 'General' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Element Feedback</Text>
          <TouchableOpacity 
            onPress={handleSubmitFeedback} 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            disabled={isSubmitting}
          >
            <Text style={[styles.submitButtonText, isSubmitting && styles.submitButtonTextDisabled]}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.elementInfo}>
            <Text style={styles.elementInfoTitle}>Selected Element</Text>
            
            {/* Visual representation of the selected element */}
            <View style={styles.elementPreview}>
              <View 
                style={[
                  styles.elementVisualization,
                  {
                    width: Math.min(elementInfo.bounds.width * 0.3, 120),
                    height: Math.min(elementInfo.bounds.height * 0.3, 60),
                  }
                ]}
              >
                <Text style={styles.elementVisualizationText}>
                  {elementInfo.componentType}
                </Text>
              </View>
              <View style={styles.elementDetails}>
                <Text style={styles.elementInfoText}>
                  {elementInfo.componentType} in {elementInfo.screenName}
                </Text>
                <Text style={styles.elementInfoSubtext}>
                  ID: {elementInfo.componentId}
                </Text>
                <Text style={styles.elementDimensions}>
                  Size: {Math.round(elementInfo.bounds.width)}×{Math.round(elementInfo.bounds.height)}px
                </Text>
                <Text style={styles.elementPosition}>
                  Position: ({Math.round(elementInfo.bounds.x)}, {Math.round(elementInfo.bounds.y)})
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.priorityButton,
                    { borderColor: p.color },
                    priority === p.key && { backgroundColor: p.color }
                  ]}
                  onPress={() => setPriority(p.key as any)}
                >
                  <Text style={[
                    styles.priorityText,
                    priority === p.key && styles.priorityTextActive
                  ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[
                    styles.categoryButton,
                    category === c.key && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(c.key as any)}
                >
                  <Text style={[
                    styles.categoryText,
                    category === c.key && styles.categoryTextActive
                  ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Feedback</Text>
            <VoiceTextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Describe the issue or suggestion... You can type or use voice input"
              maxLength={1000}
              style={styles.feedbackInput}
            />
          </View>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  submitButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  elementInfo: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  elementInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  elementPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  elementVisualization: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    minHeight: 40,
  },
  elementVisualizationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  elementDetails: {
    flex: 1,
  },
  elementInfoText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  elementInfoSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  elementDimensions: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  elementPosition: {
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  priorityTextActive: {
    color: '#FFFFFF',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#000000',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  feedbackInput: {
    marginTop: 8,
  },
});