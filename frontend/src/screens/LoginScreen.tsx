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
import { colors, font, spacing } from '../constants';
import { EyeIcon, EyeOffIcon, ClubXLogo } from '../components/icons';
import AnimatedButton from '../components/auth/AnimatedButton';

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
  const [loginError, setLoginError] = useState(false);

  const contentWidth = Math.min(354, width - 48);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError(true);
      return;
    }

    try {
      setLoginError(false);
      await login({ username_or_email: email.trim(), password });
    } catch (error) {
      const apiError = error as ApiError;
      setLoginError(true);
      Alert.alert(
        'Login Failed',
        apiError.detail || 'Please check your credentials',
        [
          { text: 'Try Again', style: 'cancel' },
          { text: 'Sign Up', onPress: () => navigation.navigate('SignUpStep1') },
        ]
      );
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpStep1');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const emailHasValue = email.length > 0;
  const passwordHasValue = password.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <ClubXLogo height={44} />
        </View>

        {/* Body */}
        <View style={[styles.body, { width: contentWidth }]}>
          {/* Heading */}
          <Text style={styles.heading}>WELCOME</Text>

          {/* Inputs */}
          <View style={styles.inputsContainer}>
            {/* ID / Email */}
            <View
              style={[
                styles.inputField,
                (focusedField === 'email' || loginError) && styles.inputFieldActive,
                loginError && styles.inputFieldError,
              ]}
            >
              {emailHasValue && <Text style={styles.floatingLabel}>Enter ID or Email</Text>}
              <TextInput
                style={[styles.input, emailHasValue && styles.inputWithLabel]}
                placeholder={emailHasValue ? '' : 'Enter ID or Email'}
                placeholderTextColor={colors.gray500}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (loginError) setLoginError(false);
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            {/* Password */}
            <View
              style={[
                styles.inputField,
                (focusedField === 'password' || loginError) && styles.inputFieldActive,
                loginError && styles.inputFieldError,
              ]}
            >
              {passwordHasValue && <Text style={styles.floatingLabel}>Enter Password</Text>}
              <TextInput
                style={[styles.input, passwordHasValue && styles.inputWithLabel, { paddingRight: 36 }]}
                placeholder={passwordHasValue ? '' : 'Enter Password'}
                placeholderTextColor={colors.gray500}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (loginError) setLoginError(false);
                }}
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
                {showPassword ? (
                  <EyeIcon size={18} color={colors.gray700} />
                ) : (
                  <EyeOffIcon size={18} color={colors.gray700} />
                )}
              </Pressable>
            </View>

            {/* Forgot Password link */}
            {loginError && (
              <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword}>
                <Text style={styles.forgotLinkText}>forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <AnimatedButton
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.brandText} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </AnimatedButton>

            <Text style={styles.orText}>or</Text>

            <AnimatedButton
              style={styles.secondaryButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Sign up</Text>
            </AnimatedButton>

            {!loginError && (
              <TouchableOpacity style={styles.forgotLinkBottom} onPress={handleForgotPassword}>
                <Text style={styles.forgotLinkBottomText}>forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  body: {
    alignItems: 'stretch',
  },
  heading: {
    fontFamily: Platform.select({
      ios: font.bold,
      android: font.bold,
      default: 'System',
    }),
    fontSize: 28,
    fontWeight: '700',
    color: colors.brandText,
    lineHeight: 42,
    marginBottom: 24,
  },
  inputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputFieldActive: {
    borderColor: colors.brandText,
  },
  inputFieldError: {
    borderColor: colors.error,
  },
  floatingLabel: {
    position: 'absolute',
    top: 4,
    left: 16,
    fontSize: 10,
    color: colors.gray600,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.brandText,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
  },
  inputWithLabel: {
    paddingTop: 14,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotLink: {
    marginTop: -8,
    alignSelf: 'flex-start',
  },
  forgotLinkText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.error,
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    height: 46,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandText,
  },
  orText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 16,
    color: colors.brandText,
  },
  secondaryButton: {
    backgroundColor: colors.brandText,
    borderRadius: 8,
    height: 46,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  forgotLinkBottom: {
    marginTop: 8,
  },
  forgotLinkBottomText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.gray500,
  },
});
