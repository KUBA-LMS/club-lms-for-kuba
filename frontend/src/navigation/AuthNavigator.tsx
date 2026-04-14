import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import SignUpStep1Screen from '../screens/SignUpStep1Screen';
import SignUpStep2Screen from '../screens/SignUpStep2Screen';
import SignUpStep3Screen from '../screens/SignUpStep3Screen';
import SignUpStep4Screen from '../screens/SignUpStep4Screen';
import SignUpStep5Screen from '../screens/SignUpStep5Screen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 320,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="SignUpStep1" component={SignUpStep1Screen} />
      <Stack.Screen name="SignUpStep2" component={SignUpStep2Screen} />
      <Stack.Screen name="SignUpStep3" component={SignUpStep3Screen} />
      <Stack.Screen name="SignUpStep4" component={SignUpStep4Screen} />
      <Stack.Screen name="SignUpStep5" component={SignUpStep5Screen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
}
