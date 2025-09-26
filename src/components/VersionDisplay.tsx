import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

// Calculate version based on commit count
// Starting at 1.0.0, increment by 0.0.1 for each commit
const calculateVersion = (commitCount: number): string => {
  if (commitCount === 0) return 'v1.0.0';
  
  // Calculate version components
  const major = Math.floor(commitCount / 100) + 1;  // Major version increments every 100 commits
  const minor = Math.floor((commitCount % 100) / 10);  // Minor version increments every 10 commits
  const patch = commitCount % 10;  // Patch version for remaining commits
  
  return `v${major}.${minor}.${patch}`;
};

export const VersionDisplay: React.FC = () => {
  // We have 23 commits so far, this will be 24 after this commit
  const CURRENT_COMMIT_COUNT = 24; // Will increment with each commit
  
  return (
    <Text style={styles.versionText}>
      {calculateVersion(CURRENT_COMMIT_COUNT)}
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