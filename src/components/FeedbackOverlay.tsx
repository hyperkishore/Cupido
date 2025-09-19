import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { theme } from '../design-system/tokens';
import { feedbackDatabase, FeedbackEntry } from '../services/feedbackDatabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SelectedElement {
  id: string;
  type: string;
  bounds: { x: number; y: number; width: number; height: number };
  screenName: string;
}

interface FeedbackOverlayProps {
  visible: boolean;
  onClose: () => void;
  screenName: string;
  children: React.ReactNode;
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  visible,
  onClose,
  screenName,
  children,
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<'ui' | 'ux' | 'bug' | 'feature' | 'content' | 'performance' | 'accessibility' | 'general'>('general');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Selection area state
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const selectionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (selectionMode) {
      Animated.timing(selectionOpacity, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(selectionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectionMode]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => selectionMode,
    onMoveShouldSetPanResponder: () => selectionMode,
    
    onPanResponderGrant: (evt) => {
      if (!selectionMode) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setSelectionStart({ x: locationX, y: locationY });
      setSelectionEnd({ x: locationX, y: locationY });
      setIsSelecting(true);
    },
    
    onPanResponderMove: (evt) => {
      if (!selectionMode || !isSelecting) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setSelectionEnd({ x: locationX, y: locationY });
    },
    
    onPanResponderRelease: (evt) => {
      if (!selectionMode || !isSelecting) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setSelectionEnd({ x: locationX, y: locationY });
      
      if (selectionStart) {
        const bounds = {
          x: Math.min(selectionStart.x, locationX),
          y: Math.min(selectionStart.y, locationY),
          width: Math.abs(locationX - selectionStart.x),
          height: Math.abs(locationY - selectionStart.y),
        };
        
        // Only proceed if selection area is meaningful (at least 10x10)
        if (bounds.width > 10 && bounds.height > 10) {
          const elementId = `selected_area_${Date.now()}`;
          setSelectedElement({
            id: elementId,
            type: 'Selected Area',
            bounds,
            screenName,
          });
          
          setSelectionMode(false);
          setShowFeedbackForm(true);
        }
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    },
  });

  const handleStartSelection = () => {
    setSelectionMode(true);
    setSelectedElement(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedElement || !feedbackText.trim()) {
      Alert.alert('Error', 'Please select an element and provide feedback text.');
      return;
    }

    try {
      const feedbackEntry: FeedbackEntry = {
        screen_name: selectedElement.screenName,
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
        'Feedback Submitted',
        'Your feedback has been recorded successfully!',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectionMode(false);
    setSelectedElement(null);
    setFeedbackText('');
    setPriority('medium');
    setCategory('general');
    setShowFeedbackForm(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    onClose();
  };

  const getSelectionStyle = () => {
    if (!selectionStart || !selectionEnd) return {};
    
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      width,
      height,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      borderStyle: 'dashed' as const,
    };
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {/* Main content with selection capability */}
        <View style={styles.contentContainer} {...panResponder.panHandlers}>
          {children}
          
          {/* Selection overlay */}
          {selectionMode && (
            <Animated.View style={[styles.selectionOverlay, { opacity: selectionOpacity }]} />
          )}
          
          {/* Current selection indicator */}
          {isSelecting && selectionStart && selectionEnd && (
            <View style={getSelectionStyle()} />
          )}
        </View>

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>Feedback Mode</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {!selectionMode && !showFeedbackForm && (
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Press Ctrl+Q to toggle feedback mode. Click "Select Element" to choose an area to provide feedback on.
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={handleStartSelection}
              >
                <Text style={styles.selectButtonText}>Select Element</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {selectionMode && (
            <View style={styles.selectionInstructions}>
              <Text style={styles.instructionText}>
                Drag to select the area you want to provide feedback on
              </Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSelection}
              >
                <Text style={styles.cancelButtonText}>Cancel Selection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Feedback Form Modal */}
        <Modal
          visible={showFeedbackForm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFeedbackForm(false)}
        >
          <View style={styles.formOverlay}>
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Provide Feedback</Text>
                <TouchableOpacity
                  onPress={() => setShowFeedbackForm(false)}
                  style={styles.formCloseButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedElement && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedInfoText}>
                    Selected: {selectedElement.type} on {selectedElement.screenName}
                  </Text>
                  <Text style={styles.boundsText}>
                    Position: {Math.round(selectedElement.bounds.x)}, {Math.round(selectedElement.bounds.y)} | 
                    Size: {Math.round(selectedElement.bounds.width)}×{Math.round(selectedElement.bounds.height)}
                  </Text>
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                  {['ui', 'ux', 'bug', 'feature', 'content', 'performance', 'accessibility', 'general'].map((cat) => (
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
                <View style={styles.priorityContainer}>
                  {['low', 'medium', 'high', 'critical'].map((prio) => (
                    <TouchableOpacity
                      key={prio}
                      style={[
                        styles.priorityButton,
                        priority === prio && styles.priorityButtonActive,
                        prio === 'critical' && styles.criticalButton,
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
                <Text style={styles.label}>Feedback</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Describe the issue or suggestion..."
                  multiline
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelFormButton}
                  onPress={() => setShowFeedbackForm(false)}
                >
                  <Text style={styles.cancelFormButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitFeedback}
                >
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  controlTitle: {
    ...theme.typography.headline,
    color: theme.colors.label,
    fontWeight: '600',
  },
  closeButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.full,
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.label,
    fontWeight: '600',
  },
  instructions: {
    alignItems: 'center',
  },
  instructionText: {
    ...theme.typography.subhead,
    color: theme.colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  selectButtonText: {
    ...theme.typography.headline,
    color: theme.colors.white,
    fontWeight: '600',
  },
  selectionInstructions: {
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  cancelButtonText: {
    ...theme.typography.headline,
    color: theme.colors.white,
    fontWeight: '600',
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  formContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    ...theme.typography.title2,
    color: theme.colors.label,
    fontWeight: '600',
  },
  formCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.full,
  },
  selectedInfo: {
    backgroundColor: theme.colors.secondarySystemBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  selectedInfoText: {
    ...theme.typography.subhead,
    color: theme.colors.label,
    fontWeight: '500',
  },
  boundsText: {
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
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray200,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: theme.colors.white,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray200,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  criticalButton: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  priorityButtonText: {
    ...theme.typography.footnote,
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
    minHeight: 120,
    textAlignVertical: 'top',
    color: theme.colors.label,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelFormButton: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray200,
    alignItems: 'center',
  },
  cancelFormButtonText: {
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