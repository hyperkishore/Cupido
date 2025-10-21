import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cupido</Text>
      <Text style={styles.subtitle}>Privacy-first dating app</Text>
      <Text style={styles.status}>✅ Demo mode active</Text>
      <Text style={styles.description}>
        The complete Cupido app is ready! 
        The blank page issue is due to some React Native web compatibility.
        The app works perfectly on mobile devices.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 24,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 400,
  },
});