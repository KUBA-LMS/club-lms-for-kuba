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
} from 'react-native';
import { UploadIcon } from '../icons';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not available
}

interface CreateGroupModalProps {
  visible: boolean;
  isCreating: boolean;
  onBack: () => void;
  onProceed: (name: string, logoUri: string | null) => void;
}

export default function CreateGroupModal({
  visible,
  isCreating,
  onBack,
  onProceed,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isNameFocused, setIsNameFocused] = useState(false);

  const isValid = name.trim().length > 0;

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
    onBack();
  }, [onBack]);

  const handleProceed = useCallback(() => {
    if (!isValid || isCreating) return;
    onProceed(name.trim(), logoUri);
  }, [isValid, isCreating, name, logoUri, onProceed]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Create New Group?</Text>

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
    fontFamily: 'OpenSans-Bold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 20,
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
    fontFamily: 'OpenSans-Regular',
    fontSize: 8,
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
    fontFamily: 'OpenSans-Regular',
    fontSize: 9,
    color: '#8E8E93',
    marginTop: 2,
  },
  nameInput: {
    fontFamily: 'OpenSans-Regular',
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
    fontFamily: 'OpenSans-Bold',
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
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  proceedButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
