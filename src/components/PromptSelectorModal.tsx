import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { promptService, PromptInfo } from '../services/promptService';

interface PromptSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onPromptSelected?: (promptId: string) => void;
}

export const PromptSelectorModal: React.FC<PromptSelectorModalProps> = ({
  visible,
  onClose,
  onPromptSelected
}) => {
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPrompts();
    }
  }, [visible]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      // Only show cupido-tagged prompts in the main app selector
      const cupidoPrompts = promptService.getCupidoPrompts();
      const currentId = await promptService.getSelectedPromptId();

      setPrompts(cupidoPrompts);
      setSelectedPromptId(currentId);
    } catch (error) {
      console.error('[PromptSelector] Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = async (promptId: string) => {
    try {
      setLoading(true);
      const promptName = await promptService.setSelectedPromptId(promptId);

      if (promptName) {
        setSelectedPromptId(promptId);
        console.log('[PromptSelector] ✅ Switched to:', promptName);

        if (onPromptSelected) {
          onPromptSelected(promptId);
        }

        // Close modal after brief delay
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } catch (error) {
      console.error('[PromptSelector] Error selecting prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'conversation': '#34C759',
      'reflection': '#5E5CE6',
      'matching': '#FF9F0A',
      'profile': '#FF375F',
      'custom': '#8E8E93'
    };
    return colors[category || 'custom'] || '#8E8E93';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Select AI Prompt</Text>
                {prompts.length > 0 && selectedPromptId && (
                  <Text style={styles.headerSubtitle}>
                    Current: {prompts.find(p => p.id === selectedPromptId)?.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Prompts List */}
            {loading && prompts.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading prompts...</Text>
              </View>
            ) : (
              <ScrollView style={styles.promptsList} showsVerticalScrollIndicator={false}>
                {prompts.map((prompt) => {
                  const isSelected = prompt.id === selectedPromptId;
                  const categoryColor = getCategoryColor(prompt.category);

                  return (
                    <TouchableOpacity
                      key={prompt.id}
                      style={[
                        styles.promptItem,
                        isSelected && styles.promptItemSelected,
                        isSelected && { borderLeftWidth: 4, borderLeftColor: '#007AFF' }
                      ]}
                      onPress={() => handleSelectPrompt(prompt.id)}
                      disabled={loading}
                    >
                      <View style={styles.promptItemContent}>
                        <View style={styles.promptItemHeader}>
                          <Text style={styles.promptItemName}>{prompt.name}</Text>
                          {isSelected && (
                            <Feather name="check" size={20} color="#007AFF" />
                          )}
                        </View>

                        <View style={styles.promptItemMeta}>
                          {prompt.category && (
                            <View style={[
                              styles.categoryBadge,
                              { backgroundColor: `${categoryColor}20` }
                            ]}>
                              <Text style={[
                                styles.categoryBadgeText,
                                { color: categoryColor }
                              ]}>
                                {prompt.category}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.versionBadge}>
                            v{prompt.activeVersion}
                          </Text>
                        </View>

                        {prompt.description && (
                          <Text
                            style={styles.promptItemDescription}
                            numberOfLines={2}
                          >
                            {prompt.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8E8E93',
  },
  promptsList: {
    maxHeight: 400,
  },
  promptItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  promptItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  promptItemContent: {
    gap: 8,
  },
  promptItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptItemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  promptItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  versionBadge: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  promptItemDescription: {
    fontSize: 14,
    color: '#6C6C70',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
