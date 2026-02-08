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
import { useNavigation } from '@react-navigation/native';
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

type SignUpStep1NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep1'>;

export default function SignUpStep1Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep1NavigationProp>();

  const [username, setUsername] = useState('');
  const [legalName, setLegalName] = useState('');
  const [focusedField, setFocusedField] = useState<'username' | 'legalName' | null>(null);
  const [usernameValid, setUsernameValid] = useState(false);

  // Responsive scaling
  const baseWidth = 402;
  const scale = Math.min(width / baseWidth, 1.2);
  const inputWidth = Math.min(313 * scale, width - 80);

  // Validate username (basic validation - at least 3 characters, alphanumeric)
  const validateUsername = (value: string) => {
    const isValid = value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value);
    setUsernameValid(isValid);
    return isValid;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    validateUsername(value);
  };

  const isFormValid = usernameValid && legalName.trim().length > 0;

  const handleNext = () => {
    if (isFormValid) {
      navigation.navigate('SignUpStep2', { username, name: legalName.trim() });
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
            <ProgressBar progress={1} totalSteps={5} />
            <Text style={styles.stepText}>Create Account{'\n'}1/5</Text>
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
            Set up your profile.
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
            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputField,
                  focusedField === 'username' && styles.inputFieldFocused,
                ]}
              >
                {(focusedField === 'username' || username) && (
                  <Text style={styles.inputLabel}>Username</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    (focusedField === 'username' || username) && styles.inputWithLabel,
                  ]}
                  placeholder={focusedField === 'username' || username ? '' : 'Enter Username'}
                  placeholderTextColor="#1e1e1e"
                  value={username}
                  onChangeText={handleUsernameChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameValid && (
                  <View style={styles.validIcon}>
                    <CheckIcon size={16} color="#4CAF50" />
                  </View>
                )}
              </View>
            </View>

            {/* Legal Name Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputField,
                  focusedField === 'legalName' && styles.inputFieldFocused,
                ]}
              >
                {(focusedField === 'legalName' || legalName) && (
                  <Text style={styles.inputLabel}>Legal Name(Full name)</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    (focusedField === 'legalName' || legalName) && styles.inputWithLabel,
                  ]}
                  placeholder={focusedField === 'legalName' || legalName ? '' : 'Enter Legal Name(Full name)'}
                  placeholderTextColor="#1e1e1e"
                  value={legalName}
                  onChangeText={setLegalName}
                  onFocus={() => setFocusedField('legalName')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
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
    gap: spacing.sm + spacing.xxs,
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
    marginTop: -8,
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
