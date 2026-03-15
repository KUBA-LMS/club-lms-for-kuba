import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, layout, screenPadding } from '../constants';

// User icon placeholder component
function UserIcon({ size = 100, color = '#000000' }: { size?: number; color?: string }) {
  const headSize = size * 0.25;
  const bodyWidth = size * 0.5;
  const bodyHeight = size * 0.3;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Head */}
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          borderWidth: 2,
          borderColor: color,
          marginBottom: 4,
        }}
      />
      {/* Body */}
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderTopLeftRadius: bodyWidth / 2,
          borderTopRightRadius: bodyWidth / 2,
          borderWidth: 2,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
}

// Upload icon component
function UploadIcon({ size = 15, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: 1.5, height: size * 0.4, backgroundColor: color }} />
        <View
          style={{
            position: 'absolute',
            top: size * 0.2,
            width: size * 0.3,
            height: size * 0.3,
            borderTopWidth: 1.5,
            borderLeftWidth: 1.5,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    </View>
  );
}

// Edit icon component
function EditIcon({ size = 12, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.25,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

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

type SignUpStep2NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep2'>;
type SignUpStep2RouteProp = RouteProp<AuthStackParamList, 'SignUpStep2'>;

export default function SignUpStep2Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep2NavigationProp>();
  const route = useRoute<SignUpStep2RouteProp>();
  const { username, name } = route.params;

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  // Responsive scaling
  const baseWidth = 402;
  const scale = Math.min(width / baseWidth, 1.2);
  const inputWidth = Math.min(313 * scale, width - 80);

  // Profile picture size
  const profileSize = Math.min(170 * scale, width - 120);

  const handleUploadPress = () => {
    // TODO: Implement image picker
    // For now, simulate selecting an image
    Alert.alert(
      'Upload Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => simulateImageSelection() },
        { text: 'Choose from Library', onPress: () => simulateImageSelection() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const simulateImageSelection = () => {
    // Simulate image selection - in real app, use expo-image-picker
    setTempImage('https://picsum.photos/300/300');
    setIsCropping(true);
  };

  const handleCropDone = () => {
    setProfileImage(tempImage);
    setTempImage(null);
    setIsCropping(false);
  };

  const handleCropBack = () => {
    setTempImage(null);
    setIsCropping(false);
  };

  const handleEditPress = () => {
    handleUploadPress();
  };

  const handleNext = () => {
    navigation.navigate('SignUpStep3', {
      username,
      name,
      profileImage: profileImage || undefined,
    });
  };

  const handleSkip = () => {
    navigation.navigate('SignUpStep3', {
      username,
      name,
      profileImage: undefined,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartOver = () => {
    navigation.navigate('Login');
  };

  const hasProfileImage = !!profileImage;

  // Cropping mode UI
  if (isCropping && tempImage) {
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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>

            <View style={styles.progressSection}>
              <ProgressBar progress={2} totalSteps={5} />
              <Text style={styles.stepText}>Create Account{'\n'}2/5</Text>
            </View>

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

          {/* Crop Area */}
          <View style={styles.cropContainer}>
            <Image
              source={{ uri: tempImage }}
              style={[styles.cropImage, { width: 300 * scale, height: 300 * scale }]}
              resizeMode="cover"
            />
            {/* Crop overlay */}
            <View
              style={[
                styles.cropOverlay,
                {
                  width: 300 * scale,
                  height: 300 * scale,
                  borderRadius: 150 * scale,
                },
              ]}
            />
          </View>

          {/* Crop Buttons */}
          <View style={[styles.buttonRow, { width: inputWidth }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.backActionButton]}
              onPress={handleCropBack}
              activeOpacity={0.8}
            >
              <Text style={styles.backActionButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={handleCropDone}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            <ProgressBar progress={2} totalSteps={5} />
            <Text style={styles.stepText}>Create Account{'\n'}2/5</Text>
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
            Set profile picture.
          </Text>

          {/* Help Link */}
          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Help?   </Text>
            <TouchableOpacity onPress={() => { /* TODO: Open user guide */ }}>
              <Text style={styles.guideLink}>Read user guide</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Picture Area */}
          <View style={styles.profileContainer}>
            {hasProfileImage ? (
              <View style={styles.profileImageWrapper}>
                <Image
                  source={{ uri: profileImage }}
                  style={[
                    styles.profileImage,
                    { width: profileSize, height: profileSize, borderRadius: profileSize / 2 },
                  ]}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                  <EditIcon size={12} color="#000000" />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadPlaceholder, { width: profileSize, height: profileSize }]}
                onPress={handleUploadPress}
                activeOpacity={0.7}
              >
                <UserIcon size={profileSize * 0.6} color="#000000" />
                <View style={styles.uploadTextRow}>
                  <UploadIcon size={15} color="#000000" />
                  <Text style={styles.uploadText}>upload picture</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                hasProfileImage ? styles.nextButtonActive : styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!hasProfileImage}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  hasProfileImage ? styles.nextButtonTextActive : styles.nextButtonTextDisabled,
                ]}
              >
                Next  →
              </Text>
            </TouchableOpacity>
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
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 11,
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
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 11,
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
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
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
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 12,
    color: colors.black,
  },
  guideLink: {
    fontFamily: Platform.select({
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'System',
    }),
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.requested,
    textDecorationLine: 'underline',
  },
  profileContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xl + spacing.md,
    marginTop: screenPadding.horizontal,
  },
  uploadPlaceholder: {
    backgroundColor: colors.gray100,
    borderRadius: layout.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm + spacing.xxs,
    gap: spacing.xs,
  },
  uploadText: {
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 13,
    color: colors.black,
  },
  profileImageWrapper: {
    alignItems: 'center',
  },
  profileImage: {
    backgroundColor: colors.gray100,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.xs,
    marginTop: -30,
    gap: spacing.xs,
  },
  editText: {
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 15,
    color: colors.black,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: colors.black,
  },
  skipButtonText: {
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 16,
    color: colors.white,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  nextButtonActive: {
    backgroundColor: colors.success,
  },
  nextButtonText: {
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
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
  backActionButton: {
    backgroundColor: colors.error,
  },
  backActionButtonText: {
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 16,
    color: colors.white,
  },
  doneButton: {
    backgroundColor: colors.black,
  },
  doneButtonText: {
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'System',
    }),
    fontSize: 16,
    color: colors.white,
  },
  cropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl + spacing.md,
    marginTop: screenPadding.horizontal,
  },
  cropImage: {
    backgroundColor: colors.gray100,
  },
  cropOverlay: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
});
