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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, layout, screenPadding } from '../constants';

// Check icon component
function CheckIcon({ size = 16, color = '#4CAF50' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[checkStyles.check, { borderColor: color }]} />
    </View>
  );
}

const checkStyles = StyleSheet.create({
  check: {
    width: 8,
    height: 14,
    borderWidth: 2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
});

// X icon component
function XIcon({ size = 20, color = '#ff383c' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[xStyles.line1, { backgroundColor: color }]} />
      <View style={[xStyles.line2, { backgroundColor: color }]} />
    </View>
  );
}

const xStyles = StyleSheet.create({
  line1: {
    position: 'absolute',
    width: 2,
    height: 14,
    transform: [{ rotate: '45deg' }],
  },
  line2: {
    position: 'absolute',
    width: 2,
    height: 14,
    transform: [{ rotate: '-45deg' }],
  },
});

// Progress Bar component
function ProgressBar({ progress, totalSteps }: { progress: number; totalSteps: number }) {
  const percentage = (progress / totalSteps) * 100;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.bar}>
        <View style={[progressStyles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    width: 250,
    height: 8,
  },
  bar: {
    flex: 1,
    backgroundColor: '#e6dfd4',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#00c0e8',
    borderRadius: 8,
  },
});

type SignUpStep4NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep4'>;
type SignUpStep4RouteProp = RouteProp<AuthStackParamList, 'SignUpStep4'>;

export default function SignUpStep4Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep4NavigationProp>();
  const route = useRoute<SignUpStep4RouteProp>();
  const { username, name, profileImage, studentId, nationality, gender } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'password' | 'confirm' | null>(null);

  // Responsive scaling
  const baseWidth = 402;
  const scale = Math.min(width / baseWidth, 1.2);
  const inputWidth = Math.min(313 * scale, width - 80);

  // Password validation: at least 8 chars with letters, numbers, and symbols
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    return hasLetter && hasNumber && hasSymbol;
  };

  const isPasswordValid = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isPasswordValid && passwordsMatch;

  // Determine error states
  const showPasswordError = password.length > 0 && !isPasswordValid;
  const showConfirmError = confirmPassword.length > 0 && !passwordsMatch && isPasswordValid;

  const handleNext = () => {
    if (isFormValid) {
      navigation.navigate('SignUpStep5', {
        username,
        name,
        profileImage,
        studentId,
        nationality,
        gender,
        password,
      });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartOver = () => {
    navigation.navigate('Login');
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
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { width: inputWidth + 40 }]}>
          {/* Back Button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <ProgressBar progress={4} totalSteps={5} />
            <Text style={styles.stepText}>Create Account{'\n'}4/5</Text>
          </View>

          {/* Start Over Button */}
          <TouchableOpacity onPress={handleStartOver} style={styles.startOverButton}>
            <Text style={styles.startOverIcon}>↺</Text>
            <Text style={styles.startOverText}>start{'\n'}over</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontSize: Math.max(24, 30 * scale) }]}>
            CLUB.{'\n'}LMS
          </Text>
        </View>

        {/* Content Section */}
        <View style={[styles.contentContainer, { width: inputWidth }]}>
          {/* Heading */}
          <Text style={[styles.heading, { fontSize: Math.max(24, 30 * scale) }]}>
            Set up your password.
          </Text>

          {/* Help Link */}
          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Help?   </Text>
            <TouchableOpacity onPress={() => { /* TODO: Open user guide */ }}>
              <Text style={styles.guideLink}>Read user guide</Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
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
                  placeholderTextColor="#1e1e1e"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {password.length > 0 && (
                  <View style={styles.validIcon}>
                    {isPasswordValid ? (
                      <CheckIcon size={16} color="#4CAF50" />
                    ) : (
                      <XIcon size={20} color="#ff383c" />
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Password Requirements Hint */}
            <Text style={[styles.hintText, showPasswordError && styles.hintTextError]}>
              Must be at least 8 characters long with a mix of letters, numbers, and symbols.
            </Text>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputField,
                  focusedField === 'confirm' && styles.inputFieldFocused,
                ]}
              >
                {(focusedField === 'confirm' || confirmPassword) && (
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    (focusedField === 'confirm' || confirmPassword) && styles.inputWithLabel,
                  ]}
                  placeholder={focusedField === 'confirm' || confirmPassword ? '' : 'Confirm Password'}
                  placeholderTextColor="#1e1e1e"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {confirmPassword.length > 0 && isPasswordValid && (
                  <View style={styles.validIcon}>
                    {passwordsMatch ? (
                      <CheckIcon size={16} color="#4CAF50" />
                    ) : (
                      <XIcon size={20} color="#ff383c" />
                    )}
                  </View>
                )}
              </View>
              {showConfirmError && (
                <Text style={styles.errorText}>Passwords do not match.</Text>
              )}
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              isFormValid ? styles.nextButtonActive : styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={!isFormValid}
          >
            <Text style={[
              styles.nextButtonText,
              isFormValid ? styles.nextButtonTextActive : styles.nextButtonTextDisabled,
            ]}>
              Next  →
            </Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: screenPadding.horizontal,
  },
  backButton: {
    padding: spacing.sm,
  },
  backArrow: {
    fontSize: 24,
    color: colors.black,
    fontWeight: '300',
  },
  progressSection: {
    alignItems: 'center',
    flex: 1,
  },
  stepText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 10,
    color: colors.black,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  startOverButton: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  startOverIcon: {
    fontSize: 20,
    color: colors.black,
  },
  startOverText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 8,
    color: colors.black,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg + spacing.sm,
  },
  title: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
      default: 'System',
    }),
    color: colors.black,
    textAlign: 'center',
    lineHeight: 36,
  },
  contentContainer: {
    alignItems: 'flex-start',
  },
  heading: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Bold',
      android: 'OpenSans-Bold',
      default: 'System',
    }),
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  helpText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 12,
    color: colors.black,
  },
  guideLink: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Bold',
      android: 'OpenSans-Bold',
      default: 'System',
    }),
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.requested,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    width: '100%',
    marginBottom: screenPadding.horizontal,
  },
  inputWrapper: {
    marginTop: spacing.sm + spacing.xxs,
  },
  inputField: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: layout.borderRadius.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  inputFieldFocused: {
    borderColor: colors.black,
  },
  inputLabel: {
    position: 'absolute',
    top: 6,
    left: spacing.md,
    fontSize: 10,
    color: colors.gray900,
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    paddingRight: 30,
  },
  inputWithLabel: {
    paddingTop: spacing.sm + spacing.xxs,
  },
  validIcon: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
  },
  hintText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 8,
    color: colors.gray600,
    marginTop: spacing.xs,
    marginLeft: spacing.sm + spacing.xxs,
  },
  hintTextError: {
    color: colors.error,
  },
  errorText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 8,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm + spacing.xxs,
  },
  nextButton: {
    height: 40,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.sm + spacing.xxs,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  nextButtonActive: {
    backgroundColor: colors.success,
  },
  nextButtonText: {
    fontFamily: Platform.select({
      ios: 'OpenSans-Regular',
      android: 'OpenSans-Regular',
      default: 'System',
    }),
    fontSize: 16,
  },
  nextButtonTextDisabled: {
    color: colors.white,
  },
  nextButtonTextActive: {
    color: colors.white,
  },
});
