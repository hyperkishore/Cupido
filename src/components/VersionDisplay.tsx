import React from 'react';
import { Text, StyleSheet } from 'react-native';

const packageJson = require('../../package.json');

export const VersionDisplay: React.FC = () => {
  return (
    <Text style={styles.versionText}>
      v{packageJson.version}
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