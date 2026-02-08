import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { MainStackParamList } from '../../navigation/types';
import { screenPadding } from '../../constants';
import api from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminUploadPoster'>;

export default function AdminUploadPosterScreen({ navigation, route }: Props) {
  const { eventData } = route.params;
  const insets = useSafeAreaInsets();
  const [posterUri, setPosterUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPosterUri(result.assets[0].uri);
    }
  }, []);

  const handleStartOver = useCallback(() => {
    setPosterUri(null);
  }, []);

  const handleDone = useCallback(async () => {
    if (!posterUri) {
      // Skip poster upload
      await createEvent();
      return;
    }

    // In production, upload poster first, then create event with poster URL
    await createEvent();
  }, [posterUri, eventData]);

  const createEvent = async () => {
    setIsLoading(true);
    try {
      await api.post('/events/', {
        title: eventData.title,
        description: eventData.description || '',
        images: posterUri ? [posterUri] : [],
        event_type: eventData.event_type,
        cost_type: eventData.cost_type,
        cost_amount: eventData.cost_amount || null,
        registration_start: eventData.registration_start?.toISOString(),
        registration_end: eventData.registration_end?.toISOString(),
        event_date: eventData.event_date?.toISOString(),
        event_location: eventData.event_location || '',
        max_slots: eventData.max_slots || 100,
        club_id: eventData.club_id,
      });

      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Poster</Text>
        <TouchableOpacity onPress={handleStartOver} style={styles.startOverButton}>
          <Text style={styles.startOverText}>start over</Text>
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>CLUB.</Text>
        <Text style={styles.logo}>LMS</Text>
      </View>

      {/* Poster Area */}
      <View style={styles.posterContainer}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={styles.posterImage} resizeMode="contain" />
        ) : (
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
            <Text style={styles.uploadText}>Tap to select poster image</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={handleBack}
        >
          <Text style={styles.backActionButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.doneButton, isLoading && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.doneButtonText}>Done</Text>
          )}
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
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#000000',
  },
  headerTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: '#000000',
  },
  startOverButton: {
    padding: 8,
  },
  startOverText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#000000',
    textDecorationLine: 'underline',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logo: {
    fontFamily: 'PorterSansBlock',
    fontSize: 32,
    color: '#000000',
    letterSpacing: 4,
  },
  posterContainer: {
    flex: 1,
    marginHorizontal: screenPadding.horizontal,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  uploadArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#8E8E93',
  },
  posterImage: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: screenPadding.horizontal,
    gap: 16,
  },
  backActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backActionButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  doneButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  doneButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
