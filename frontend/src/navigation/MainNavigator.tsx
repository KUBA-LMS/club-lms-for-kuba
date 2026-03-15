import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import OnePassScreen from '../screens/main/OnePassScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import CreateGroupChatScreen from '../screens/main/CreateGroupChatScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EventDetailScreen from '../screens/main/EventDetailScreen';
import { AdminCreateEventScreen, AdminUploadPosterScreen, AccessControlScreen, AdminHubScreen, AdminHubSubgroupDetailScreen, AdminHubMemberDetailScreen } from '../screens/admin';
import { useWebSocketConnection } from '../hooks/useWebSocket';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  useWebSocketConnection();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
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
      <Stack.Screen name="AdminHub" component={AdminHubScreen} />
      <Stack.Screen name="AdminHubSubgroupDetail" component={AdminHubSubgroupDetailScreen} />
      <Stack.Screen name="AdminHubMemberDetail" component={AdminHubMemberDetailScreen} />
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
