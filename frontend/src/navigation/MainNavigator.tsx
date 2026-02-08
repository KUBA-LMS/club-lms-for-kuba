import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from './types';
import HomeScreen from '../screens/main/HomeScreen';
import { HomeIcon, CalendarIcon, ChatIcon, UserIcon } from '../components/icons';

// Placeholder screens
function EventsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Events</Text>
    </View>
  );
}

function ChatScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Chat</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Profile</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => {
          switch (route.name) {
            case 'Home':
              return <HomeIcon color={color} />;
            case 'Events':
              return <CalendarIcon color={color} />;
            case 'Chat':
              return <ChatIcon color={color} />;
            case 'Profile':
              return <UserIcon color={color} />;
            default:
              return <HomeIcon color={color} />;
          }
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
    fontSize: 24,
    color: '#8E8E93',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: 80,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabel: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
    fontSize: 10,
    marginTop: 4,
  },
});
