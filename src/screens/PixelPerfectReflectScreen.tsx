import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SimpleReflectionChat } from '../components/SimpleReflectionChat';
import { VersionDisplay } from '../components/VersionDisplay';
import { useNavigation } from '@react-navigation/native';
import { userProfileService } from '../services/userProfileService';

export const PixelPerfectReflectScreen = () => {
  const navigation = useNavigation();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Load user profile
    const loadProfile = async () => {
      await userProfileService.initialize();
      const name = userProfileService.getName();
      if (name) {
        setUserName(name);
      }
    };
    loadProfile();

    // Check for updates periodically
    const interval = setInterval(loadProfile, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Hide tab bar when keyboard is visible for better UX
    if (navigation && navigation.setOptions) {
      navigation.setOptions({
        tabBarStyle: isKeyboardVisible ? { display: 'none' } : undefined,
      });
    }
  }, [isKeyboardVisible, navigation]);

  const handleKeyboardToggle = (visible: boolean) => {
    setIsKeyboardVisible(visible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <VersionDisplay />
      </View>
      <View style={styles.chatContainer}>
        <SimpleReflectionChat onKeyboardToggle={handleKeyboardToggle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatContainer: {
    flex: 1,
  },
});