// @ts-nocheck
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useAppMode } from '../contexts/AppModeContext';
import { AuthScreen } from '../screens/AuthScreen';
import { PromptScreen } from '../screens/PromptScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DigestScreen } from '../screens/DigestScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { DemoLoader } from '../components/DemoLoader';
import { theme } from '../utils/theme';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const { mode } = useAppMode();

  if (loading) {
    return <DemoLoader />;
  }

  // In demo mode, bypass authentication
  if (mode === 'demo') {
    // Demo mode - no authentication required
    // The chat components will handle demo user creation
  } else if (!user) {
    // Local mode requires authentication
    return <AuthScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Reflect"
        component={PromptScreen}
        options={{
          title: 'Daily Reflection',
          tabBarLabel: 'Reflect',
          tabBarIcon: ({ color }) => (
            <TabIcon name="✨" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Your Matches',
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color }) => (
            <TabIcon name="💫" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Digest"
        component={DigestScreen}
        options={{
          title: 'Weekly Digest',
          tabBarLabel: 'Digest',
          tabBarIcon: ({ color }) => (
            <TabIcon name="📊" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Your Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon name="👤" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <Text style={{ fontSize: 24, color }}>{name}</Text>
);