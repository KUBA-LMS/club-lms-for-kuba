import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { ApiError, GenderType } from '../types/auth';
import { colors, font, spacing, layout, screenPadding } from '../constants';
import { CheckIcon } from '../components/icons';

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
    width: 180,
    height: 4,
  },
  bar: {
    flex: 1,
    backgroundColor: '#EBEBF0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 4,
  },
});

type SignUpStep5NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep5'>;
type SignUpStep5RouteProp = RouteProp<AuthStackParamList, 'SignUpStep5'>;

const TERMS_OF_SERVICE_URL = 'https://robust-haumea-616.notion.site/Terms-of-Service-32c78b1d4e7780b1af86e186f61ccde4';
const PRIVACY_POLICY_URL = 'https://robust-haumea-616.notion.site/Privacy-Policy-32c78b1d4e7780e6910ae55ba43b39dd';

export default function SignUpStep5Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep5NavigationProp>();
  const route = useRoute<SignUpStep5RouteProp>();
  const { signUp, isLoading } = useAuth();
  const { username, name, email, profileImage, studentId, nationality, gender, password } = route.params;

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Responsive scaling
  const baseWidth = 402;
  const scale = Math.min(width / baseWidth, 1.2);
  const inputWidth = Math.min(313 * scale, width - 80);

  const isFormValid = termsAgreed && privacyAgreed;

  const handleTermsPress = async () => {
    try {
      await Linking.openURL(TERMS_OF_SERVICE_URL);
      setTermsAgreed(true);
    } catch (error) {
      console.warn('Failed to open Terms of Service URL');
      setTermsAgreed(true);
    }
  };

  const handlePrivacyPress = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
      setPrivacyAgreed(true);
    } catch (error) {
      console.warn('Failed to open Privacy Policy URL');
      setPrivacyAgreed(true);
    }
  };

  const handleAgreeToAll = () => {
    setTermsAgreed(true);
    setPrivacyAgreed(true);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartOver = () => {
    navigation.navigate('Login');
  };

  const handleComplete = async () => {
    if (!isFormValid) return;

    try {
      // Clean up data - only include non-empty values
      const signUpData: any = {
        username,
        legal_name: name,
        email,
        password,
      };

      // Only add optional fields if they have values
      if (profileImage) signUpData.profile_image = profileImage;
      if (studentId) signUpData.student_id = studentId;
      if (nationality) signUpData.nationality = nationality;
      if (gender && ['male', 'female', 'other'].includes(gender)) {
        signUpData.gender = gender as GenderType;
      }

      await signUp(signUpData);

      Alert.alert(
        'Success',
        'Account created successfully! Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            },
          },
        ]
      );
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert('Sign Up Failed', apiError.detail || 'Please try again later');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { width: inputWidth + 40 }]}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={isLoading}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <ProgressBar progress={5} totalSteps={5} />
          <Text style={styles.stepText}>Create Account{'\n'}5/5</Text>
        </View>

        {/* Start Over Button */}
        <TouchableOpacity onPress={handleStartOver} style={styles.startOverButton} disabled={isLoading}>
          <Text style={styles.startOverIcon}>↺</Text>
          <Text style={styles.startOverText}>start{'\n'}over</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { fontSize: Math.max(20, 24 * scale) }]}>
          CLUB.{'\n'}LMS
        </Text>
      </View>

      {/* Content Section */}
      <View style={[styles.contentContainer, { width: inputWidth }]}>
        {/* Heading */}
        <Text style={[styles.heading, { fontSize: Math.max(24, 30 * scale) }]}>
          Agree to terms of use.
        </Text>

        {/* Help Link */}
        <View style={styles.helpRow}>
          <Text style={styles.helpText}>Help?   </Text>
          <TouchableOpacity onPress={() => { /* TODO: Open user guide */ }}>
            <Text style={styles.guideLink}>Read user guide</Text>
          </TouchableOpacity>
        </View>

        {/* Agreement Items */}
        <View style={styles.agreementContainer}>
          {/* Terms of Service */}
          <TouchableOpacity
            style={styles.agreementItem}
            onPress={handleTermsPress}
            activeOpacity={0.7}
          >
            <Text style={styles.agreementText}>[Required] View Terms of Service</Text>
            <CheckIcon size={16} color={termsAgreed ? '#1C1C1E' : colors.gray300} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.agreementItem}
            onPress={handlePrivacyPress}
            activeOpacity={0.7}
          >
            <Text style={styles.agreementText}>[Required] View Privacy Policy</Text>
            <CheckIcon size={16} color={privacyAgreed ? '#1C1C1E' : colors.gray300} />
          </TouchableOpacity>

          {/* Agree to All Button */}
          <View style={styles.agreeAllContainer}>
            <TouchableOpacity
              style={styles.agreeAllButton}
              onPress={handleAgreeToAll}
              activeOpacity={0.7}
            >
              <Text style={styles.agreeAllText}>Agree to all</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            isFormValid && !isLoading ? styles.completeButtonActive : styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          activeOpacity={0.8}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.completeButtonText}>Complete Sign up</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    fontSize: 22,
    color: colors.black,
    fontWeight: '300',
  },
  progressSection: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  stepText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 11,
    color: colors.gray500,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  startOverButton: {
    alignItems: 'center',
    padding: spacing.xs,
    gap: 3,
  },
  startOverIcon: {
    fontSize: 17,
    color: colors.gray500,
  },
  startOverText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 10,
    color: colors.gray500,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: Platform.select({
      ios: 'PorterSansBlock',
      android: 'porter-sans-inline-block',
      default: 'System',
    }),
    color: colors.black,
    textAlign: 'center',
    lineHeight: 30,
  },
  contentContainer: {
    alignItems: 'flex-start',
  },
  heading: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
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
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 12,
    color: colors.black,
  },
  guideLink: {
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
  agreementContainer: {
    width: '100%',
    marginBottom: screenPadding.horizontal,
  },
  agreementItem: {
    height: 54,
    backgroundColor: colors.gray50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + spacing.xxs,
  },
  agreementText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 15,
    color: colors.gray900,
  },
  agreeAllContainer: {
    alignItems: 'flex-end',
    marginTop: spacing.sm + spacing.xxs,
  },
  agreeAllButton: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: layout.borderRadius.xs,
  },
  agreeAllText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 11,
    color: colors.white,
  },
  completeButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.lg,
  },
  completeButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  completeButtonActive: {
    backgroundColor: '#1C1C1E',
  },
  completeButtonText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 16,
    color: colors.white,
  },
});
