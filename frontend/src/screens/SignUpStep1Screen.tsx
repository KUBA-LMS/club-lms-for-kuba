import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, font, spacing } from '../constants';
import { CheckIcon, CloseIcon } from '../components/icons';
import SignUpHeader from '../components/auth/SignUpHeader';
import AnimatedButton from '../components/auth/AnimatedButton';
import HelpLink from '../components/auth/HelpLink';
import { authService } from '../services/auth';

type SignUpStep1NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep1'>;

type UsernameError =
  | null
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'leading_period'
  | 'trailing_period'
  | 'consecutive_periods';

function validateUsername(value: string): UsernameError {
  if (value.length === 0) return null;
  if (value.length < 3) return 'too_short';
  if (value.length > 30) return 'too_long';
  if (!/^[a-z0-9._]+$/.test(value)) return 'invalid_chars';
  if (value.startsWith('.')) return 'leading_period';
  if (value.endsWith('.')) return 'trailing_period';
  if (/\.{2,}/.test(value)) return 'consecutive_periods';
  return null;
}

function usernameErrorMessage(err: UsernameError): string {
  switch (err) {
    case 'too_short':
      return 'Username must be at least 3 characters.';
    case 'too_long':
      return 'Username must be 30 characters or fewer.';
    case 'invalid_chars':
      return 'Only lowercase letters, numbers, periods, and underscores are allowed.';
    case 'leading_period':
      return 'Username cannot start with a period.';
    case 'trailing_period':
      return 'Username cannot end with a period.';
    case 'consecutive_periods':
      return 'Username cannot contain consecutive periods.';
    default:
      return '';
  }
}

export default function SignUpStep1Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep1NavigationProp>();

  const [username, setUsername] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<'username' | 'legalName' | 'email' | null>(null);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'error';
  const [usernameAvailability, setUsernameAvailability] = useState<Availability>('idle');
  const [emailAvailability, setEmailAvailability] = useState<Availability>('idle');
  const usernameReqSeq = useRef(0);
  const emailReqSeq = useRef(0);

  const contentWidth = Math.min(354, width - 48);

  const usernameError = useMemo(() => validateUsername(username), [username]);
  const emailError = useMemo(() => {
    if (email.length === 0) return null;
    // TLD must be at least 2 characters; disallow spaces and multiple @.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (email.length > 255) return 'Email is too long.';
    return null;
  }, [email]);

  const usernameFormatValid = username.length > 0 && usernameError === null;
  const emailFormatValid = email.length > 0 && emailError === null;
  // Trim so whitespace-only input is rejected even if the user pastes spaces.
  const legalNameValid = legalName.trim().length > 0 && legalName.trim().length <= 100;

  // Block submit unless the backend confirmed availability. Transient network
  // errors still allow submit — the signup endpoint re-checks authoritatively.
  const usernameReady =
    usernameFormatValid &&
    (usernameAvailability === 'available' || usernameAvailability === 'error');
  const emailReady =
    emailFormatValid && (emailAvailability === 'available' || emailAvailability === 'error');

  const isFormValid = usernameReady && legalNameValid && emailReady;

  const showUsernameFormatError = usernameTouched && usernameError !== null;
  const showUsernameTaken = usernameFormatValid && usernameAvailability === 'taken';
  const showEmailFormatError = emailTouched && emailError !== null;
  const showEmailTaken = emailFormatValid && emailAvailability === 'taken';

  // Debounced availability checks. Stale responses discarded via sequence refs.
  useEffect(() => {
    if (!usernameFormatValid) {
      setUsernameAvailability('idle');
      return;
    }
    setUsernameAvailability('checking');
    const seq = ++usernameReqSeq.current;
    const handle = setTimeout(async () => {
      try {
        const result = await authService.checkUsername(username);
        if (seq !== usernameReqSeq.current) return;
        setUsernameAvailability(result.available ? 'available' : 'taken');
      } catch {
        if (seq !== usernameReqSeq.current) return;
        setUsernameAvailability('error');
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [username, usernameFormatValid]);

  useEffect(() => {
    if (!emailFormatValid) {
      setEmailAvailability('idle');
      return;
    }
    setEmailAvailability('checking');
    const seq = ++emailReqSeq.current;
    const handle = setTimeout(async () => {
      try {
        const result = await authService.checkEmail(email);
        if (seq !== emailReqSeq.current) return;
        setEmailAvailability(result.available ? 'available' : 'taken');
      } catch {
        if (seq !== emailReqSeq.current) return;
        setEmailAvailability('error');
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [email, emailFormatValid]);

  const handleNext = () => {
    if (isFormValid) {
      navigation.navigate('SignUpStep2', {
        username: username.trim(),
        name: legalName.trim(),
        email: email.trim(),
      });
    }
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
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SignUpHeader step={1} totalSteps={5} width={contentWidth} />

        <View style={[styles.body, { width: contentWidth }]}>
          <Text style={styles.heading}>Set up your profile.</Text>

          {/* Username */}
          <View style={styles.field}>
            <View
              style={[
                styles.inputField,
                focusedField === 'username' && styles.inputFieldActive,
                (showUsernameFormatError || showUsernameTaken) && styles.inputFieldError,
              ]}
            >
              {username.length > 0 && <Text style={styles.floatingLabel}>Enter Username</Text>}
              <TextInput
                style={[styles.input, username.length > 0 && styles.inputWithLabel]}
                placeholder={username.length > 0 ? '' : 'Enter Username'}
                placeholderTextColor={colors.gray500}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  if (!usernameTouched) setUsernameTouched(true);
                }}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
              <View style={styles.trailingIcon} pointerEvents="none">
                {usernameFormatValid && usernameAvailability === 'checking' && (
                  <ActivityIndicator size="small" color={colors.gray600} />
                )}
                {usernameFormatValid && usernameAvailability === 'available' && (
                  <CheckIcon size={18} color={colors.successDark} />
                )}
                {usernameFormatValid && usernameAvailability === 'taken' && (
                  <CloseIcon size={18} color={colors.error} />
                )}
              </View>
            </View>
            {showUsernameFormatError && (
              <Text style={styles.errorText}>{usernameErrorMessage(usernameError)}</Text>
            )}
            {!showUsernameFormatError && showUsernameTaken && (
              <Text style={styles.errorText}>That username is already taken. Try another.</Text>
            )}
            {!showUsernameFormatError && usernameAvailability === 'available' && (
              <Text style={styles.successText}>Username is available.</Text>
            )}
          </View>

          {/* Legal name */}
          <View style={styles.field}>
            <View
              style={[
                styles.inputField,
                focusedField === 'legalName' && styles.inputFieldActive,
              ]}
            >
              {legalName.length > 0 && (
                <Text style={styles.floatingLabel}>Enter Legal Name (Full name)</Text>
              )}
              <TextInput
                style={[styles.input, legalName.length > 0 && styles.inputWithLabel]}
                placeholder={legalName.length > 0 ? '' : 'Enter Legal Name (Full name)'}
                placeholderTextColor={colors.gray500}
                value={legalName}
                onChangeText={setLegalName}
                onFocus={() => setFocusedField('legalName')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={100}
              />
              {legalNameValid && (
                <View style={styles.trailingIcon}>
                  <CheckIcon size={18} color={colors.successDark} />
                </View>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <View
              style={[
                styles.inputField,
                focusedField === 'email' && styles.inputFieldActive,
                (showEmailFormatError || showEmailTaken) && styles.inputFieldError,
              ]}
            >
              {email.length > 0 && <Text style={styles.floatingLabel}>Enter Email</Text>}
              <TextInput
                style={[styles.input, email.length > 0 && styles.inputWithLabel]}
                placeholder={email.length > 0 ? '' : 'Enter Email'}
                placeholderTextColor={colors.gray500}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                maxLength={255}
                textContentType="emailAddress"
              />
              <View style={styles.trailingIcon} pointerEvents="none">
                {emailFormatValid && emailAvailability === 'checking' && (
                  <ActivityIndicator size="small" color={colors.gray600} />
                )}
                {emailFormatValid && emailAvailability === 'available' && (
                  <CheckIcon size={18} color={colors.successDark} />
                )}
                {emailFormatValid && emailAvailability === 'taken' && (
                  <CloseIcon size={18} color={colors.error} />
                )}
              </View>
            </View>
            {showEmailFormatError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}
            {!showEmailFormatError && showEmailTaken && (
              <Text style={styles.errorText}>
                That email is already registered. Try logging in instead.
              </Text>
            )}
            {!showEmailFormatError && emailAvailability === 'available' && (
              <Text style={styles.successText}>Email is available.</Text>
            )}
          </View>

          {/* Next */}
          <AnimatedButton
            style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid}
          >
            <Text style={[styles.nextButtonText, !isFormValid && styles.nextButtonTextDisabled]}>
              Next  →
            </Text>
          </AnimatedButton>

          <HelpLink context="step1" />
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
    paddingRight: 30,
    paddingVertical: 14,
  },
  inputWithLabel: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  trailingIcon: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
