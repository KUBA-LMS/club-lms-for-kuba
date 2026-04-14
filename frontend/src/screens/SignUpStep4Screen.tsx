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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, font } from '../constants';
import { CheckIcon, CloseIcon, EyeIcon, EyeOffIcon } from '../components/icons';
import SignUpHeader from '../components/auth/SignUpHeader';
import AnimatedButton from '../components/auth/AnimatedButton';
import HelpLink from '../components/auth/HelpLink';

type SignUpStep4NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep4'>;
type SignUpStep4RouteProp = RouteProp<AuthStackParamList, 'SignUpStep4'>;

function validatePasswordRules(pwd: string) {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
  return hasLetter && hasNumber && hasSymbol;
}

export default function SignUpStep4Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep4NavigationProp>();
  const route = useRoute<SignUpStep4RouteProp>();
  const { username, name, email, profileImage, nationality, gender } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<'password' | 'confirm' | null>(null);

  const contentWidth = Math.min(354, width - 48);

  const isPasswordValid = validatePasswordRules(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isPasswordValid && passwordsMatch;

  const showPasswordError = password.length > 0 && !isPasswordValid;
  const showConfirmError = confirmPassword.length > 0 && !passwordsMatch && isPasswordValid;

  const handleNext = () => {
    if (isFormValid) {
      navigation.navigate('SignUpStep5', {
        username,
        name,
        email,
        profileImage,
        nationality,
        gender,
        password,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SignUpHeader step={4} totalSteps={5} width={contentWidth} />

        <View style={[styles.body, { width: contentWidth }]}>
          <Text style={styles.heading}>Set up your password.</Text>

          {/* Password */}
          <View style={styles.field}>
            <View
              style={[
                styles.inputField,
                focusedField === 'password' && styles.inputFieldActive,
                showPasswordError && styles.inputFieldError,
              ]}
            >
              {password.length > 0 && <Text style={styles.floatingLabel}>Enter Password</Text>}
              <TextInput
                style={[
                  styles.input,
                  password.length > 0 && styles.inputWithLabel,
                  { paddingRight: 56 },
                ]}
                placeholder={password.length > 0 ? '' : 'Enter Password'}
                placeholderTextColor={colors.gray500}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.trailingWrapper}>
                {password.length > 0 && (
                  isPasswordValid ? (
                    <CheckIcon size={18} color={colors.successDark} />
                  ) : (
                    <CloseIcon size={18} color={colors.error} />
                  )
                )}
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeIcon size={18} color={colors.gray700} />
                  ) : (
                    <EyeOffIcon size={18} color={colors.gray700} />
                  )}
                </Pressable>
              </View>
            </View>
            <Text style={[styles.hintText, showPasswordError && styles.errorText]}>
              Must be at least 8 characters with letters, numbers, and symbols.
            </Text>
          </View>

          {/* Confirm */}
          <View style={styles.field}>
            <View
              style={[
                styles.inputField,
                focusedField === 'confirm' && styles.inputFieldActive,
                showConfirmError && styles.inputFieldError,
              ]}
            >
              {confirmPassword.length > 0 && (
                <Text style={styles.floatingLabel}>Confirm Password</Text>
              )}
              <TextInput
                style={[
                  styles.input,
                  confirmPassword.length > 0 && styles.inputWithLabel,
                  { paddingRight: 56 },
                ]}
                placeholder={confirmPassword.length > 0 ? '' : 'Confirm Password'}
                placeholderTextColor={colors.gray500}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.trailingWrapper}>
                {confirmPassword.length > 0 && isPasswordValid && (
                  passwordsMatch ? (
                    <CheckIcon size={18} color={colors.successDark} />
                  ) : (
                    <CloseIcon size={18} color={colors.error} />
                  )
                )}
                <Pressable
                  onPress={() => setShowConfirm(!showConfirm)}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  {showConfirm ? (
                    <EyeIcon size={18} color={colors.gray700} />
                  ) : (
                    <EyeOffIcon size={18} color={colors.gray700} />
                  )}
                </Pressable>
              </View>
            </View>
            {passwordsMatch && (
              <Text style={styles.successText}>Passwords match.</Text>
            )}
            {showConfirmError && (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            )}
          </View>

          <AnimatedButton
            style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid}
          >
            <Text style={[styles.nextButtonText, !isFormValid && styles.nextButtonTextDisabled]}>
              Next  →
            </Text>
          </AnimatedButton>

          <HelpLink context="step4" />
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
  body: {
    alignItems: 'stretch',
    marginTop: 32,
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
    lineHeight: 36,
    marginBottom: 32,
  },
  field: {
    marginBottom: 14,
  },
  inputField: {
    minHeight: 48,
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
    fontSize: 14,
    color: colors.brandText,
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    paddingVertical: 14,
  },
  inputWithLabel: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  trailingWrapper: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    padding: 2,
  },
  hintText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.gray600,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  successText: {
    fontFamily: Platform.select({
      ios: font.medium,
      android: font.medium,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.successDark,
    marginTop: 6,
    marginLeft: 4,
  },
  nextButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  nextButtonDisabled: {
    backgroundColor: '#D4D4D4',
  },
  nextButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandText,
  },
  nextButtonTextDisabled: {
    color: colors.gray600,
  },
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
