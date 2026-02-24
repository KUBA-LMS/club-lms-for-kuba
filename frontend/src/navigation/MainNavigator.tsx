import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from './types';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import OnePassScreen from '../screens/main/OnePassScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import CreateGroupChatScreen from '../screens/main/CreateGroupChatScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EventDetailScreen from '../screens/main/EventDetailScreen';
import { AdminCreateEventScreen, AdminUploadPosterScreen, AccessControlScreen } from '../screens/admin';
import CustomTabBar from '../components/navigation/CustomTabBar';
import { useWebSocketConnection } from '../hooks/useWebSocket';

// Placeholder screens
function ExploreScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Explore</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Groups" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  useWebSocketConnection();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="OnePass"
        component={OnePassScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="CreateGroupChat" component={CreateGroupChatScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="AdminCreateEvent" component={AdminCreateEventScreen} />
      <Stack.Screen name="AdminUploadPoster" component={AdminUploadPosterScreen} />
      <Stack.Screen name="AccessControl" component={AccessControlScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
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
});
