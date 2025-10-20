import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { promptService } from '../services/promptService';
import { PromptSelectorModal } from './PromptSelectorModal';

const packageJson = require('../../package.json');

export const VersionDisplay: React.FC = () => {
  const [promptVersion, setPromptVersion] = useState<string>('');
  const [promptName, setPromptName] = useState<string>('');
  const [showPromptSelector, setShowPromptSelector] = useState(false);

  useEffect(() => {
    loadPromptVersion();

    // Subscribe to prompt changes
    const unsubscribe = promptService.subscribeToPromptChanges(() => {
      loadPromptVersion();
    });

    return unsubscribe;
  }, []);

  const loadPromptVersion = async () => {
    try {
      const promptInfo = await promptService.getCurrentPromptInfo();
      if (promptInfo) {
        setPromptVersion(promptInfo.activeVersion);
        setPromptName(promptInfo.name);
      }
    } catch (error) {
      console.error('[VersionDisplay] Error loading prompt version:', error);
    }
  };

  const handlePress = () => {
    setShowPromptSelector(true);
  };

  const handlePromptSelected = async (promptId: string) => {
    // Reload prompt version after selection
    await loadPromptVersion();
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.container}>
          <Text style={styles.versionText}>
            V{packageJson.version}
            {promptVersion && (
              <Text>
                <Text style={styles.separator}> • </Text>
                <Text style={styles.promptVersion}>P{promptVersion}</Text>
              </Text>
            )}
          </Text>
          {promptName && (
            <Text style={styles.promptName} numberOfLines={1}>
              {promptName}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <PromptSelectorModal
        visible={showPromptSelector}
        onClose={() => setShowPromptSelector(false)}
        onPromptSelected={handlePromptSelected}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  separator: {
    color: '#C7C7CC',
  },
  promptVersion: {
    color: '#007AFF',
    fontWeight: '600',
  },
  promptName: {
    fontSize: 9,
    color: '#C7C7CC',
    marginTop: 2,
    maxWidth: 150,
  },
});
