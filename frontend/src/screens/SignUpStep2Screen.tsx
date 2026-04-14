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
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, font } from '../constants';
import { EditPencilIcon, PlusIcon } from '../components/icons';
import SignUpHeader from '../components/auth/SignUpHeader';
import AnimatedButton from '../components/auth/AnimatedButton';
import HelpLink from '../components/auth/HelpLink';

type SignUpStep2NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUpStep2'>;
type SignUpStep2RouteProp = RouteProp<AuthStackParamList, 'SignUpStep2'>;

export default function SignUpStep2Screen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SignUpStep2NavigationProp>();
  const route = useRoute<SignUpStep2RouteProp>();
  const { username, name, email } = route.params;

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const contentWidth = Math.min(354, width - 48);
  const profileSize = Math.min(220, width - 180);
  const cropSize = Math.min(280, width - 80);

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setTempImage(result.assets[0].uri);
      setIsCropping(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setTempImage(result.assets[0].uri);
      setIsCropping(true);
    }
  };

  const handleUploadPress = () => {
    Alert.alert('Upload Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
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

  const handleNext = () => {
    navigation.navigate('SignUpStep3', {
      username,
      name,
      email,
      profileImage: profileImage || undefined,
    });
  };

  const handleSkip = () => {
    navigation.navigate('SignUpStep3', {
      username,
      name,
      email,
      profileImage: undefined,
    });
  };

  const hasProfileImage = !!profileImage;

  // Cropping screen
  if (isCropping && tempImage) {
    return (
      <KeyboardAvoidingView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SignUpHeader step={2} totalSteps={5} width={contentWidth} />

          <View style={[styles.cropWrapper, { width: contentWidth, marginTop: 40 }]}>
            <View
              style={[
                styles.cropImageWrapper,
                { width: cropSize, height: cropSize, borderRadius: cropSize / 2 },
              ]}
            >
              <Image
                source={{ uri: tempImage }}
                style={{ width: cropSize, height: cropSize }}
                resizeMode="cover"
              />
            </View>

            <View style={styles.buttonRow}>
              <AnimatedButton
                style={[styles.actionButton, styles.backActionButton]}
                onPress={handleCropBack}
              >
                <Text style={styles.backActionButtonText}>Back</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={handleCropDone}
              >
                <Text style={styles.primaryActionButtonText}>Done</Text>
              </AnimatedButton>
            </View>

            <HelpLink context="step2" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SignUpHeader step={2} totalSteps={5} width={contentWidth} />

        <View style={[styles.body, { width: contentWidth }]}>
          <Text style={styles.heading}>Set profile picture.</Text>

          <View style={styles.pictureContainer}>
            {hasProfileImage ? (
              <View style={styles.profileImageWrapper}>
                <Image
                  source={{ uri: profileImage! }}
                  style={[
                    styles.profileImage,
                    { width: profileSize, height: profileSize, borderRadius: profileSize / 2 },
                  ]}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.editOverlay}
                  onPress={handleUploadPress}
                  activeOpacity={0.85}
                >
                  <EditPencilIcon size={12} color={colors.brandText} />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadPlaceholder,
                  { width: profileSize, height: profileSize, borderRadius: profileSize / 2 },
                ]}
                onPress={handleUploadPress}
                activeOpacity={0.8}
              >
                <PlusIcon size={48} color={colors.brandText} />
                <Text style={styles.uploadText}>Upload Picture</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.buttonRow}>
            <AnimatedButton
              style={[styles.actionButton, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </AnimatedButton>

            <AnimatedButton
              style={[
                styles.actionButton,
                hasProfileImage ? styles.primaryActionButton : styles.primaryActionButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!hasProfileImage}
            >
              <Text
                style={[
                  styles.primaryActionButtonText,
                  !hasProfileImage && styles.primaryActionButtonTextDisabled,
                ]}
              >
                Next  →
              </Text>
            </AnimatedButton>
          </View>

          <HelpLink context="step2" />
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
  pictureContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  uploadPlaceholder: {
    backgroundColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadText: {
    fontFamily: Platform.select({
      ios: font.medium,
      android: font.medium,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandText,
  },
  profileImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    backgroundColor: '#E5E5EA',
  },
  editOverlay: {
    position: 'absolute',
    bottom: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  editText: {
    fontFamily: Platform.select({
      ios: font.medium,
      android: font.medium,
      default: 'System',
    }),
    fontSize: 14,
    color: colors.brandText,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: colors.brandText,
  },
  skipButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  primaryActionButton: {
    backgroundColor: colors.brand,
  },
  primaryActionButtonDisabled: {
    backgroundColor: '#D4D4D4',
  },
  primaryActionButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandText,
  },
  primaryActionButtonTextDisabled: {
    color: colors.gray600,
  },
  backActionButton: {
    backgroundColor: colors.error,
  },
  backActionButtonText: {
    fontFamily: Platform.select({
      ios: font.semibold,
      android: font.semibold,
      default: 'System',
    }),
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  cropWrapper: {
    alignItems: 'center',
    gap: 32,
  },
  cropImageWrapper: {
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
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
