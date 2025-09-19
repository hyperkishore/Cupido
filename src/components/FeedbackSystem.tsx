import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { theme } from '../design-system/tokens';
import { feedbackDatabase, FeedbackEntry } from '../services/feedbackDatabase';
import { useFeedback } from '../contexts/FeedbackContext';

interface FeedbackSystemProps {
  children: React.ReactNode;
  screenName: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({ children, screenName }) => {
  const { feedbackMode } = useFeedback();
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<'ui' | 'ux' | 'bug' | 'feature' | 'content' | 'performance' | 'accessibility' | 'general'>('general');

  useEffect(() => {
    if (!feedbackMode) {
      setSelectedElement(null);
      setShowFeedbackModal(false);
    }
  }, [feedbackMode]);

  const handleElementClick = (elementInfo: any) => {
    if (feedbackMode) {
      setSelectedElement(elementInfo);
      setShowFeedbackModal(true);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedElement || !feedbackText.trim()) {
      Alert.alert('Error', 'Please provide feedback text.');
      return;
    }

    try {
      const feedbackEntry: FeedbackEntry = {
        screen_name: screenName,
        component_id: selectedElement.id || 'unknown',
        component_type: selectedElement.type || 'View',
        element_bounds: JSON.stringify(selectedElement.bounds || {}),
        feedback_text: feedbackText.trim(),
        priority,
        category,
        status: 'pending',
        created_by: 'user',
        user_agent: Platform.OS,
      };

      await feedbackDatabase.addFeedback(feedbackEntry);
      
      Alert.alert(
        'Feedback Submitted! ✅',
        'Thank you for your feedback. It has been recorded successfully.',
        [{ text: 'OK', onPress: handleCloseFeedback }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
    setSelectedElement(null);
    setFeedbackText('');
    setPriority('medium');
    setCategory('general');
  };

  // Enhanced children with click handlers for feedback mode
  const enhanceChildrenForFeedback = (element: React.ReactNode, path: string = 'root'): React.ReactNode => {
    return React.Children.map(element, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const elementId = `${path}_${index}`;
      const elementType = typeof child.type === 'string' ? child.type : 'Component';
      
      // Add feedback click handler if in feedback mode
      const enhancedProps = {
        ...child.props,
        onPress: feedbackMode ? () => {
          handleElementClick({
            id: elementId,
            type: elementType,
            bounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be enhanced later
            path: path
          });
        } : child.props.onPress,
        style: [
          child.props.style,
          feedbackMode && styles.feedbackHighlight
        ],
        children: child.props.children ? 
          enhanceChildrenForFeedback(child.props.children, elementId) : 
          child.props.children,
      };

      return React.cloneElement(child, enhancedProps);
    });
  };

  return (
    <View style={styles.container}>
      {/* Feedback mode indicator */}
      {feedbackMode && (
        <View style={styles.feedbackIndicator}>
          <Text style={styles.feedbackIndicatorText}>
            🛠 Feedback Mode: Tap any element to give feedback
          </Text>
        </View>
      )}

      {/* Enhanced children */}
      {feedbackMode ? enhanceChildrenForFeedback(children) : children}

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseFeedback}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Give Feedback</Text>
              <TouchableOpacity onPress={handleCloseFeedback} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedElement && (
              <View style={styles.selectedElementInfo}>
                <Text style={styles.selectedElementText}>
                  Element: {selectedElement.type} on {screenName}
                </Text>
                <Text style={styles.elementPath}>Path: {selectedElement.path}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryButtons}>
                {['ui', 'ux', 'bug', 'feature'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat as any)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}>
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityButtons}>
                {['low', 'medium', 'high', 'critical'].map((prio) => (
                  <TouchableOpacity
                    key={prio}
                    style={[
                      styles.priorityButton,
                      priority === prio && styles.priorityButtonActive,
                    ]}
                    onPress={() => setPriority(prio as any)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === prio && styles.priorityButtonTextActive,
                    ]}>
                      {prio.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Your Feedback</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="What would you like to improve about this element?"
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseFeedback}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedbackIndicator: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  feedbackIndicatorText: {
    ...theme.typography.subhead,
    color: theme.colors.white,
    fontWeight: '600',
  },
  feedbackHighlight: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.title2,
    color: theme.colors.label,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.gray200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: theme.colors.label,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedElementInfo: {
    backgroundColor: theme.colors.secondarySystemBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  selectedElementText: {
    ...theme.typography.subhead,
    color: theme.colors.label,
    fontWeight: '500',
  },
  elementPath: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    marginTop: theme.spacing.xs,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.headline,
    color: theme.colors.label,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray200,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: theme.colors.white,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray200,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  priorityButtonText: {
    ...theme.typography.caption2,
    color: theme.colors.secondaryLabel,
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: theme.colors.white,
  },
  feedbackInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.secondarySystemBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray200,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.headline,
    color: theme.colors.secondaryLabel,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
  },
  submitButtonText: {
    ...theme.typography.headline,
    color: theme.colors.white,
    fontWeight: '600',
  },
});