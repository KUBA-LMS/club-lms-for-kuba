import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { ApiError, GenderType } from '../types/auth';
import { colors, font } from '../constants';
import { uploadImage } from '../services/upload';
import { userService } from '../services/user';
import { CheckIcon } from '../components/icons';
import SignUpHeader from '../components/auth/SignUpHeader';
import AnimatedButton from '../components/auth/AnimatedButton';

type SignUpStep5NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep5'>;
type SignUpStep5RouteProp = RouteProp<AuthStackParamList, 'SignUpStep5'>;

export default function SignUpStep5Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep5NavigationProp>();
  const route = useRoute<SignUpStep5RouteProp>();
  const { signUp, login, isLoading } = useAuth();
  const { username, name, email, profileImage, nationality, gender, password } = route.params;

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const contentWidth = Math.min(354, width - 48);
  const isFormValid = termsAgreed && privacyAgreed;

  const handleTermsPress = () => {
    navigation.navigate('TermsOfService');
    setTermsAgreed(true);
  };

  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPolicy');
    setPrivacyAgreed(true);
  };

  const handleAgreeToAll = () => {
    setTermsAgreed(true);
    setPrivacyAgreed(true);
  };

  const handleComplete = async () => {
    if (!isFormValid) return;
    try {
      const signUpData: any = {
        username,
        legal_name: name,
        email,
        password,
      };
      if (nationality) signUpData.nationality = nationality;
      if (gender && ['male', 'female', 'other'].includes(gender.toLowerCase())) {
        signUpData.gender = gender.toLowerCase() as GenderType;
      }

      await signUp(signUpData);

      if (profileImage) {
        try {
          await login({ username_or_email: email, password });
          const uploadedUrl = await uploadImage(profileImage);
          await userService.updateProfile({ profile_image: uploadedUrl });
        } catch {
          // Account is created; profile image upload failure is non-fatal.
        }
      }

      Alert.alert(
        'Success',
        'Account created successfully! Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
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
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SignUpHeader step={5} totalSteps={5} width={contentWidth} />

      <View style={[styles.body, { width: contentWidth }]}>
        <Text style={styles.heading}>Agree to terms of use.</Text>

        <View style={styles.agreementContainer}>
          <AnimatedButton
            style={styles.agreementItem}
            onPress={handleTermsPress}
            disabled={isLoading}
          >
            <Text style={styles.agreementText}>[Required] View Terms of Service</Text>
            <CheckIcon size={18} color={termsAgreed ? colors.successDark : '#D4D4D4'} />
          </AnimatedButton>

          <AnimatedButton
            style={styles.agreementItem}
            onPress={handlePrivacyPress}
            disabled={isLoading}
          >
            <Text style={styles.agreementText}>[Required] View Privacy Policy</Text>
            <CheckIcon size={18} color={privacyAgreed ? colors.successDark : '#D4D4D4'} />
          </AnimatedButton>

          <AnimatedButton
            onPress={handleAgreeToAll}
            disabled={isLoading}
            style={styles.agreeAllRow}
          >
            <CheckIcon size={18} color={isFormValid ? colors.successDark : '#D4D4D4'} />
            <Text style={styles.agreeAllText}>Agree to all</Text>
          </AnimatedButton>
        </View>

        <AnimatedButton
          style={[styles.completeButton, !isFormValid && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.brandText} />
          ) : (
            <Text
              style={[styles.completeButtonText, !isFormValid && styles.completeButtonTextDisabled]}
            >
              Complete Sign up
            </Text>
          )}
        </AnimatedButton>
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
  agreementContainer: {
    gap: 12,
    marginBottom: 8,
  },
  agreementItem: {
    height: 54,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  agreementText: {
    fontFamily: Platform.select({
      ios: font.regular,
      android: font.regular,
      default: 'System',
    }),
    fontSize: 14,
    color: colors.brandText,
  },
  agreeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingVertical: 4,
  },
  agreeAllText: {
    fontFamily: Platform.select({
      ios: font.medium,
      android: font.medium,
      default: 'System',
    }),
    fontSize: 14,
    color: colors.brandText,
  },
  completeButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  completeButtonDisabled: {
    backgroundColor: '#D4D4D4',
  },
  completeButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandText,
  },
  completeButtonTextDisabled: {
    color: colors.gray600,
  },
});
