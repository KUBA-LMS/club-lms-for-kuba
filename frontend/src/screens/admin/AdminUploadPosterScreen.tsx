import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminUploadPoster'>;

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke="#000000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ImagePlaceholderIcon({ color = '#C0C0C0' }: { color?: string }) {
  return (
    <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AdminUploadPosterScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [posterUri, setPosterUri] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPosterUri(result.assets[0].uri);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    route.params?.onPosterSelected?.(posterUri ?? undefined);
    navigation.goBack();
  }, [navigation, posterUri, route.params]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>OPTIONAL</Text>
          <Text style={styles.headerTitle}>Event Poster</Text>
        </View>
        <TouchableOpacity onPress={handleBack} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Poster area */}
      <TouchableOpacity
        style={styles.posterContainer}
        onPress={handlePickImage}
        activeOpacity={0.85}
      >
        {posterUri ? (
          <>
            <Image source={{ uri: posterUri }} style={styles.posterImage} resizeMode="cover" />
            <View style={styles.posterOverlay}>
              <View style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change Photo</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <View style={styles.uploadIconWrapper}>
              <ImagePlaceholderIcon color="#C0C0C0" />
            </View>
            <Text style={styles.uploadTitle}>Add Event Poster</Text>
            <Text style={styles.uploadSubtitle}>Recommended ratio 3:4{'\n'}JPG, PNG supported</Text>
            <View style={styles.uploadChip}>
              <Text style={styles.uploadChipText}>Select from library</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        {posterUri ? 'Poster selected. Tap to change.' : 'Skip to create the event without a poster.'}
      </Text>

      {/* Action Buttons */}
      <View style={[styles.buttonRow, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <BackIcon />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, !posterUri && styles.confirmBtnSecondary]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmBtnText, !posterUri && styles.confirmBtnTextSecondary]}>
            {posterUri ? 'Use This Poster' : 'Skip & Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#AEAEB2',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#000000',
  },
  skipButton: {
    width: 50,
    alignItems: 'flex-end',
  },
  skipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  posterContainer: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F7F7F7',
    aspectRatio: 3 / 4,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderStyle: 'dashed',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
  },
  changeButton: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  uploadIconWrapper: {
    marginBottom: 4,
  },
  uploadTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1C1C1E',
  },
  uploadSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadChip: {
    marginTop: 8,
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  uploadChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    marginTop: 'auto',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  backBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#000000',
  },
  confirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnSecondary: {
    backgroundColor: '#F2F2F7',
  },
  confirmBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  confirmBtnTextSecondary: {
    color: '#1C1C1E',
  },
});
