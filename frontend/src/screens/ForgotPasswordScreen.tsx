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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth';
import { ArrowBackIcon } from '../components/icons';
import { colors, font, spacing } from '../constants';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'If an account exists with that email, a password reset link has been sent. Check your inbox.'
            : 'Enter the email address associated with your account and we\'ll send you a link to reset your password.'}
        </Text>

        {!sent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.gray400}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.submitBtnText}>Back to Login</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 28,
    color: colors.black,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.gray500,
    lineHeight: 22,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.black,
    marginBottom: 20,
  },
  submitBtn: {
    height: 54,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: colors.gray700,
  },
  submitBtnText: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.white,
  },
});
