import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const VersionDisplay: React.FC = () => {
  return (
    <Text style={styles.versionText}>
      v1.0.0
    </Text>
  );
};

const styles = StyleSheet.create({
  versionText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});