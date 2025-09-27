// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { theme } from '../design-system/tokens';
import { feedbackDatabase, FeedbackEntry } from '../services/feedbackDatabase';

interface FeedbackOverlayProps {
  visible: boolean;
  onClose: () => void;
  screenName: string;
  children: React.ReactNode;
}

interface HighlightedElement {
  id: string;
  type: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export const SimpleFeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  visible,
  onClose,
  screenName,
  children,
}) => {
  const [highlightedElement, setHighlightedElement] = useState<HighlightedElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HighlightedElement | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<'ui' | 'ux' | 'bug' | 'feature' | 'content' | 'performance' | 'accessibility' | 'general'>('general');

  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setHighlightedElement(null);
      setSelectedElement(null);
    }
  }, [visible]);

  const handleElementHover = (element: HighlightedElement) => {
    if (visible) {
      setHighlightedElement(element);
    }
  };

  const handleElementClick = (element: HighlightedElement) => {
    if (visible) {
      setSelectedElement(element);
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
        component_id: selectedElement.id,
        component_type: selectedElement.type,
        element_bounds: JSON.stringify(selectedElement.bounds),
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

  const renderHighlight = () => {
    if (!highlightedElement || !visible) return null;

    return (
      <View
        style={[
          styles.highlight,
          {
            left: highlightedElement.bounds.x,
            top: highlightedElement.bounds.y,
            width: highlightedElement.bounds.width,
            height: highlightedElement.bounds.height,
          },
        ]}
      >
        <View style={styles.highlightLabel}>
          <Text style={styles.highlightLabelText}>
            {highlightedElement.type} - Click to give feedback
          </Text>
        </View>
      </View>
    );
  };

  // Enhanced children with feedback capabilities
  const enhanceChildrenWithFeedback = (element: React.ReactNode, path: string = ''): React.ReactNode => {
    if (!visible) return element;

    return React.Children.map(element, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const elementId = `${path}_${index}`;
      const elementType = child.type?.displayName || child.type?.name || 'View';
      
      // Create enhanced props with hover and click handlers
      const enhancedProps = {
        ...child.props,
        onMouseEnter: () => {
          if (child.props.onMouseEnter) child.props.onMouseEnter();
          // For React Native, we'll use onLayout to get element bounds
        },
        onLayout: (event: any) => {
          if (child.props.onLayout) child.props.onLayout(event);
          if (visible) {
            const { x, y, width, height } = event.nativeEvent.layout;
            const elementInfo = {
              id: elementId,
              type: elementType,
              bounds: { x, y, width, height },
            };
            handleElementHover(elementInfo);
          }
        },
        onPress: () => {
          if (child.props.onPress && !visible) {
            child.props.onPress();
          } else if (visible && highlightedElement) {
            handleElementClick(highlightedElement);
          }
        },
        style: [
          child.props.style,
          visible && styles.feedbackEnabled,
        ],
        children: child.props.children ? 
          enhanceChildrenWithFeedback(child.props.children, elementId) : 
          child.props.children,
      };

      return React.cloneElement(child, enhancedProps);
    });
  };

  if (!visible) return <>{children}</>;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <View style={styles.contentContainer}>
          {enhanceChildrenWithFeedback(children)}
          {renderHighlight()}
        </View>

        {/* Feedback Mode Indicator */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>
            🛠 Feedback Mode: Hover over elements to highlight, click to give feedback
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIndicator}>
            <Text style={styles.closeIndicatorText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Simple Feedback Modal */}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  feedbackEnabled: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 4,
    zIndex: 1000,
  },
  highlightLabel: {
    position: 'absolute',
    top: -30,
    left: 0,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1001,
  },
  highlightLabelText: {
    ...theme.typography.caption1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  indicatorText: {
    ...theme.typography.subhead,
    color: theme.colors.white,
    flex: 1,
  },
  closeIndicator: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIndicatorText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    color: theme.colors.secondaryLabel,
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