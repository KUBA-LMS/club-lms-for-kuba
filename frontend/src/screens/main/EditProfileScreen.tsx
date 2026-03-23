import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/auth';
import { updateProfile, UserUpdateData } from '../../services/user';
import { uploadImage } from '../../services/upload';
import { ArrowBackIcon } from '../../components/icons';
import { colors, font } from '../../constants';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const typedUser = user as User | null;

  const [editData, setEditData] = useState<UserUpdateData>({
    username: typedUser?.username,
    legal_name: typedUser?.legal_name,
    email: typedUser?.email || undefined,
    student_id: typedUser?.student_id || undefined,
    nationality: typedUser?.nationality || undefined,
  });
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickProfileImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
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
      setProfileImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const updatePayload: UserUpdateData & { profile_image?: string } = { ...editData };

      if (profileImageUri) {
        const uploadedUrl = await uploadImage(profileImageUri);
        updatePayload.profile_image = uploadedUrl;
      }

      await updateProfile(updatePayload);
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }, [editData, profileImageUri, refreshUser, navigation]);

  const currentAvatar = profileImageUri || typedUser?.profile_image || null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Image */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickProfileImage} activeOpacity={0.8}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {typedUser?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={editData.username || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, username: v }))}
            autoCapitalize="none"
            placeholderTextColor={colors.gray300}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Legal Name</Text>
          <TextInput
            style={styles.input}
            value={editData.legal_name || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, legal_name: v }))}
            placeholderTextColor={colors.gray300}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={editData.email || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.gray300}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Student ID</Text>
          <TextInput
            style={styles.input}
            value={editData.student_id || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, student_id: v }))}
            placeholderTextColor={colors.gray300}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nationality</Text>
          <TextInput
            style={styles.input}
            value={editData.nationality || ''}
            onChangeText={(v) =>
              setEditData((p) => ({ ...p, nationality: v }))
            }
            placeholderTextColor={colors.gray300}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 50,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: colors.black,
  },
  saveText: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.primary,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray300,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: font.semibold,
    fontSize: 32,
    color: colors.gray500,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.black,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  avatarBadgeText: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.white,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: '#595959',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.black,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.light,
  },
});
