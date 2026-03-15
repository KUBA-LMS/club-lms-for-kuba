import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { UploadIcon } from '../icons';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not available
}

export interface ClubOption {
  id: string;
  name: string;
  logo_image: string | null;
}

interface CreateGroupModalProps {
  visible: boolean;
  isCreating: boolean;
  clubs: ClubOption[];
  onBack: () => void;
  onProceed: (name: string, logoUri: string | null, parentId: string) => void;
}

export default function CreateGroupModal({
  visible,
  isCreating,
  clubs,
  onBack,
  onProceed,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const isValid = name.trim().length > 0 && selectedClubId !== null;

  const handlePickImage = useCallback(async () => {
    if (!ImagePicker) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  }, []);

  const handleBack = useCallback(() => {
    setName('');
    setLogoUri(null);
    setSelectedClubId(null);
    onBack();
  }, [onBack]);

  const handleProceed = useCallback(() => {
    if (!isValid || isCreating || !selectedClubId) return;
    onProceed(name.trim(), logoUri, selectedClubId);
  }, [isValid, isCreating, name, logoUri, selectedClubId, onProceed]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Create New Group</Text>

          {/* Club Picker */}
          <Text style={styles.sectionLabel}>Select Club</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clubPickerContent}
            style={styles.clubPicker}
          >
            {clubs.map((club) => {
              const isSelected = club.id === selectedClubId;
              return (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubPickerItem}
                  onPress={() => setSelectedClubId(club.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.clubPickerImageWrapper,
                      isSelected && styles.clubPickerImageSelected,
                    ]}
                  >
                    {club.logo_image ? (
                      <Image
                        source={{ uri: club.logo_image }}
                        style={styles.clubPickerImg}
                      />
                    ) : (
                      <View style={[styles.clubPickerImg, styles.clubPickerPlaceholder]}>
                        <Text style={styles.clubPickerPlaceholderText}>
                          {club.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.clubPickerLabel,
                      isSelected && styles.clubPickerLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {club.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Logo Upload */}
          <TouchableOpacity
            style={styles.logoArea}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            ) : (
              <>
                <View style={styles.uploadCircle}>
                  <UploadIcon size={28} color="#000000" />
                </View>
                <Text style={styles.uploadText}>Upload{'\n'}group logo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Name Input */}
          <View
            style={[
              styles.nameInputContainer,
              isNameFocused && styles.nameInputFocused,
            ]}
          >
            {(name || isNameFocused) && (
              <Text style={styles.nameInputLabel}>Enter Group Name</Text>
            )}
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
              placeholder={!isNameFocused ? 'Enter Group Name' : ''}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              disabled={isCreating}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.proceedButton,
                !isValid && styles.proceedButtonDisabled,
              ]}
              onPress={handleProceed}
              activeOpacity={0.7}
              disabled={!isValid || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.proceedButtonText,
                    !isValid && styles.proceedButtonTextDisabled,
                  ]}
                >
                  Proceed
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8E8E93',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  clubPicker: {
    maxHeight: 70,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  clubPickerContent: {
    gap: 10,
  },
  clubPickerItem: {
    alignItems: 'center',
    width: 52,
  },
  clubPickerImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    overflow: 'hidden',
  },
  clubPickerImageSelected: {
    borderWidth: 2,
    borderColor: '#00C0E8',
  },
  clubPickerImg: {
    width: '100%',
    height: '100%',
  },
  clubPickerPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubPickerPlaceholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#8E8E93',
  },
  clubPickerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
  },
  clubPickerLabelSelected: {
    fontFamily: 'Inter-SemiBold',
  },
  logoArea: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  uploadCircle: {
    marginBottom: 4,
  },
  uploadText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 11,
  },
  nameInputContainer: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginBottom: 20,
  },
  nameInputFocused: {
    borderColor: '#000000',
  },
  nameInputLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  nameInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#000000',
    padding: 0,
    height: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  backButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  proceedButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#C5C5C5',
  },
  proceedButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  proceedButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
