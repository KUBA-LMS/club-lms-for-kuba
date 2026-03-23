import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { ApiError } from '../types/auth';
import { colors, font, spacing, layout, screenPadding } from '../constants';

// Eye icon component for password visibility toggle
function EyeOffIcon({ size = 16, color = '#1e1e1e' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[eyeStyles.line, { backgroundColor: color }]} />
      <View style={[eyeStyles.circle, { borderColor: color }]} />
      <View style={[eyeStyles.slash, { backgroundColor: color }]} />
    </View>
  );
}

const eyeStyles = StyleSheet.create({
  line: {
    position: 'absolute',
    width: 12,
    height: 1.5,
    borderRadius: 1,
  },
  circle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  slash: {
    position: 'absolute',
    width: 14,
    height: 1.5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  // Responsive scaling
  const baseWidth = 402;
  const scale = Math.min(width / baseWidth, 1.2);
  const inputWidth = Math.min(313 * scale, width - 80);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      await login({ username_or_email: email.trim(), password });
      // Navigation to main screen will be handled by App.tsx based on auth state
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert('Login Failed', apiError.detail || 'Please check your credentials');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpStep1');
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    Alert.alert('Info', 'Password reset feature coming soon');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontSize: Math.max(36, 50 * scale) }]}>
            CLUB.{'\n'}LMS
          </Text>
        </View>

        {/* Welcome Section */}
        <View style={[styles.welcomeContainer, { width: inputWidth }]}>
          <Text style={[styles.welcomeText, { fontSize: Math.max(24, 30 * scale) }]}>
            WELCOME.
          </Text>
          <View style={styles.signupRow}>
            <Text style={styles.newUserText}>New User?   </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signupLink}>Sign up now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields */}
        <View style={[styles.inputContainer, { width: inputWidth }]}>
          {/* Email/ID Input */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.inputField,
                focusedField === 'email' && styles.inputFieldFocused,
              ]}
            >
              {(focusedField === 'email' || email) && (
                <Text style={styles.inputLabel}>Enter ID or Email</Text>
              )}
              <TextInput
                style={[
                  styles.input,
                  (focusedField === 'email' || email) && styles.inputWithLabel,
                ]}
                placeholder={focusedField === 'email' || email ? '' : 'Enter ID or Email'}
                placeholderTextColor={colors.gray400}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.inputField,
                focusedField === 'password' && styles.inputFieldFocused,
              ]}
            >
              {(focusedField === 'password' || password) && (
                <Text style={styles.inputLabel}>Enter Password</Text>
              )}
              <TextInput
                style={[
                  styles.input,
                  (focusedField === 'password' || password) && styles.inputWithLabel,
                ]}
                placeholder={focusedField === 'password' || password ? '' : 'Enter Password'}
                placeholderTextColor={colors.gray400}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <EyeOffIcon size={16} color="#1e1e1e" />
              </Pressable>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, { width: inputWidth }, isLoading && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.signInButtonText}>Sign in</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  title: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
      default: 'System',
    }),
    color: colors.black,
    textAlign: 'center',
    lineHeight: 60,
  },
  welcomeContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newUserText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.black,
  },
  signupLink: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    gap: spacing.sm + spacing.xxs,
    marginBottom: screenPadding.horizontal,
  },
  inputWrapper: {
    marginTop: spacing.sm + spacing.xxs,
  },
  inputField: {
    height: 54,
    backgroundColor: colors.gray50,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  inputFieldFocused: {
    backgroundColor: '#EBEBF0',
  },
  inputLabel: {
    position: 'absolute',
    top: 8,
    left: spacing.md,
    fontSize: 11,
    color: colors.gray500,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    paddingRight: 30,
  },
  inputWithLabel: {
    paddingTop: spacing.sm + spacing.xxs,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.gray500,
  },
  signInButton: {
    height: 54,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm + spacing.xxs,
  },
  signInButtonDisabled: {
    backgroundColor: colors.gray700,
  },
  signInButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.2,
  },
});
