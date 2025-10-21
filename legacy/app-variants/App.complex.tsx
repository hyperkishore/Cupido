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
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReflectScreen } from './src/screens/ReflectScreen';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import MessagesScreen from './src/screens/MessagesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [showMessages, setShowMessages] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);

  const HeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.headerIcon}
        onPress={() => setShowMessages(true)}
      >
        <Ionicons name="heart-outline" size={24} color="#000" />
        {hasNotification && <View style={styles.notificationDot} />}
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIcon}>
        <Ionicons name="menu" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  if (showMessages) {
    return <MessagesScreen onClose={() => setShowMessages(false)} />;
  }

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
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Reflect') {
                iconName = focused ? 'moon' : 'moon-outline';
              } else if (route.name === 'Matches') {
                iconName = focused ? 'heart' : 'heart-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person-circle' : 'person-circle-outline';
              }
              
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#000000',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
              paddingBottom: Platform.OS === 'ios' ? 20 : 10,
              paddingTop: 10,
              height: Platform.OS === 'ios' ? 85 : 65,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Reflect" component={ReflectScreen} />
          <Tab.Screen name="Matches" component={MatchesScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
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
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logo: {
    fontSize: 32,
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
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});