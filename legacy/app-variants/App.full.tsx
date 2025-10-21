import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './src/contexts/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="dark" backgroundColor={theme.colors.background} />
        </NavigationContainer>
      </ChatProvider>
    </AuthProvider>
  );
}