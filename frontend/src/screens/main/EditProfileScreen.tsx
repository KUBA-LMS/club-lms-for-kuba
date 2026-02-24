import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/auth';
import { updateProfile, UserUpdateData } from '../../services/user';
import { ArrowBackIcon } from '../../components/icons';

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
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateProfile(editData);
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }, [editData, refreshUser, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowBackIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
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
        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={editData.username || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, username: v }))}
            autoCapitalize="none"
            placeholderTextColor="#C5C5C5"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Legal Name</Text>
          <TextInput
            style={styles.input}
            value={editData.legal_name || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, legal_name: v }))}
            placeholderTextColor="#C5C5C5"
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
            placeholderTextColor="#C5C5C5"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Student ID</Text>
          <TextInput
            style={styles.input}
            value={editData.student_id || ''}
            onChangeText={(v) => setEditData((p) => ({ ...p, student_id: v }))}
            placeholderTextColor="#C5C5C5"
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
            placeholderTextColor="#C5C5C5"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontFamily: 'OpenSans-Bold',
    fontSize: 17,
    color: '#000000',
  },
  saveText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#007AFF',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C5C5C5',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
    color: '#595959',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#000000',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
});
