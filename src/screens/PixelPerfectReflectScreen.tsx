import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SimpleReflectionChat } from '../components/SimpleReflectionChat';
import { useNavigation } from '@react-navigation/native';
import { userProfileService } from '../services/userProfileService';
import { VersionDisplay } from '../components/VersionDisplay';

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
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
              {userName ? `${userName}'s Reflection` : 'Daily Reflection'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {userName ? `Hey ${userName}, let's explore your thoughts` : 'Explore your thoughts deeply'}
            </Text>
          </View>
          <VersionDisplay />
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
});