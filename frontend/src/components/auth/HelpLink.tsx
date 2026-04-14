import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { colors, font } from '../../constants';

export type HelpContext =
  | 'login'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5';

const GUIDES: Record<HelpContext, { title: string; body: string }> = {
  login: {
    title: 'Signing in',
    body:
      'Enter the username or email you used when signing up, then your password. Tap "Sign up" below to create a new account, or "forgot password?" if you need a reset link.',
  },
  step1: {
    title: 'Set up your profile',
    body:
      'Username: 3-30 characters, lowercase letters, numbers, periods, and underscores only (like Instagram).\n\nLegal Name: the full name you want shown on your profile.\n\nEmail: used for login and important notifications.',
  },
  step2: {
    title: 'Set profile picture',
    body:
      'Tap the circle to take a photo or choose one from your library. You can preview, re-crop, and change it anytime. Tap "Skip" to add one later.',
  },
  step3: {
    title: 'Basic info',
    body:
      'Nationality helps us tailor content. Gender is optional — leave it blank or choose "Prefer not to say".',
  },
  step4: {
    title: 'Password',
    body:
      'Use at least 8 characters with a mix of letters, numbers, and symbols. Both fields must match before you can continue.',
  },
  step5: {
    title: 'Terms of use',
    body:
      'Tap each item to review it — agreeing is required to complete sign up. "Agree to all" accepts both at once.',
  },
};

interface HelpLinkProps {
  context: HelpContext;
  style?: any;
}

export default function HelpLink({ context, style }: HelpLinkProps) {
  const handlePress = () => {
    const guide = GUIDES[context];
    Alert.alert(guide.title, guide.body, [{ text: 'Got it' }]);
  };

  return (
    <View style={[styles.helpRow, style]}>
      <Text style={styles.helpText}>Help?   </Text>
      <TouchableOpacity onPress={handlePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.guideLink}>Read user guide</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  helpText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.brandText,
  },
  guideLink: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.brandText,
    textDecorationLine: 'underline',
  },
});
