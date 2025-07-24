import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PixelPerfectHomeScreen } from './src/screens/PixelPerfectHomeScreen';
import { PixelPerfectReflectScreen } from './src/screens/PixelPerfectReflectScreen';
import { PixelPerfectMatchesScreen } from './src/screens/PixelPerfectMatchesScreen';
import { PixelPerfectProfileScreen } from './src/screens/PixelPerfectProfileScreen';
import { PixelPerfectMessagesScreen } from './src/screens/PixelPerfectMessagesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [showMessages, setShowMessages] = useState(false);
  const [hasNotification] = useState(true);

  const HeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.headerIcon}
        onPress={() => setShowMessages(true)}
      >
        <Text style={styles.iconText}>♡</Text>
        {hasNotification && <View style={styles.notificationDot} />}
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIcon}>
        <Text style={styles.iconText}>☰</Text>
      </TouchableOpacity>
    </View>
  );

  if (showMessages) {
    return <PixelPerfectMessagesScreen onClose={() => setShowMessages(false)} />;
  }

  try {
    return (
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>Cupido</Text>
            <HeaderRight />
          </View>
          
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused }) => {
                let iconText = '○';
                
                if (route.name === 'Home') {
                  iconText = focused ? '⌂' : '⌂';
                } else if (route.name === 'Reflect') {
                  iconText = focused ? '☽' : '☽';
                } else if (route.name === 'Matches') {
                  iconText = focused ? '♥' : '♡';
                } else if (route.name === 'Profile') {
                  iconText = focused ? '●' : '○';
                }
                
                return <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{iconText}</Text>;
              },
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: '#000000',
              tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0.5,
                borderTopColor: '#C6C6C8',
                paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                paddingTop: 8,
                height: Platform.OS === 'ios' ? 83 : 60,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '500',
                marginTop: 4,
              },
            })}
          >
            <Tab.Screen name="Home" component={PixelPerfectHomeScreen} />
            <Tab.Screen name="Reflect" component={PixelPerfectReflectScreen} />
            <Tab.Screen name="Matches" component={PixelPerfectMatchesScreen} />
            <Tab.Screen name="Profile" component={PixelPerfectProfileScreen} />
          </Tab.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    );
  } catch (error) {
    // Fallback in case of any errors
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Cupido</Text>
        <Text style={styles.errorText}>Loading app...</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  logo: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerIcon: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    color: '#000000',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  tabIcon: {
    fontSize: 24,
    color: '#000000',
  },
  tabIconFocused: {
    color: '#007AFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 17,
    color: '#8E8E93',
  },
});