import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowBackIcon, SearchIcon } from '../../components/icons';
import UserListItem from '../../components/community/UserListItem';
import { colors, screenPadding } from '../../constants';
import { MainStackParamList } from '../../navigation/types';
import * as chatApi from '../../services/chat';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface SearchedUser {
  id: string;
  username: string;
  profile_image: string | null;
}

export default function CreateGroupChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SearchedUser[]>([]);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = groupName.trim().length > 0 && selectedUsers.length > 0;

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await chatApi.searchUsers(searchQuery.trim());
        setSearchResults(res.data);
      } catch {
        // Search failed silently
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleToggleUser = useCallback((user: SearchedUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!isValid || isCreating) return;
    setIsCreating(true);
    try {
      const chat = await chatApi.createChat({
        type: 'group',
        name: groupName.trim(),
        member_ids: selectedUsers.map((u) => u.id),
      });
      // Navigate directly to the new chat room
      navigation.replace('ChatRoom', { chatId: chat.id });
    } catch {
      Alert.alert('Error', 'Failed to create group chat');
    } finally {
      setIsCreating(false);
    }
  }, [isValid, isCreating, groupName, selectedUsers, navigation]);

  const selectedIds = selectedUsers.map((u) => u.id);

  const renderUserItem = useCallback(({ item }: { item: SearchedUser }) => {
    const selectedIndex = selectedIds.indexOf(item.id);
    return (
      <UserListItem
        avatar={item.profile_image || undefined}
        username={item.username}
        commonGroups={[]}
        isSelected={selectedIndex >= 0}
        selectedOrder={selectedIndex >= 0 ? selectedIndex + 1 : undefined}
        onToggle={() => handleToggleUser(item)}
      />
    );
  }, [selectedIds, handleToggleUser]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <ArrowBackIcon size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Group Chat.</Text>
      </View>

      {/* Group Name Input */}
      <View style={styles.inputSection}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.nameInputContainer,
            isNameFocused && styles.nameInputContainerFocused,
          ]}
          onPress={() => nameInputRef.current?.focus()}
        >
          {(groupName || isNameFocused) && (
            <Text style={styles.nameInputLabel}>Enter Group Chat Name</Text>
          )}
          <TextInput
            ref={nameInputRef}
            style={styles.nameInput}
            value={groupName}
            onChangeText={setGroupName}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            placeholder={!isNameFocused ? 'Enter Group Chat Name' : ''}
            placeholderTextColor="#1E1E1E"
          />
        </TouchableOpacity>
      </View>

      {/* Username Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Enter Username"
            placeholderTextColor={colors.gray400}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.gray500} />
          ) : (
            <SearchIcon size={20} color={colors.gray500} />
          )}
        </View>
      </View>

      {/* Selected users chips */}
      {selectedUsers.length > 0 && (
        <View style={styles.chipsRow}>
          {selectedUsers.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={styles.chip}
              onPress={() => handleToggleUser(u)}
              activeOpacity={0.6}
            >
              <Text style={styles.chipText}>{u.username}</Text>
              <Text style={styles.chipRemove}>x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* User List */}
      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        style={styles.userList}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searchQuery.trim() && !isSearching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : null
        }
      />

      {/* Create Button */}
      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            isValid && styles.createButtonActive,
          ]}
          onPress={handleCreate}
          disabled={!isValid || isCreating}
          activeOpacity={0.7}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    height: 60,
  },
  backButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 30,
    color: '#000000',
    letterSpacing: -0.08,
  },
  inputSection: {
    paddingHorizontal: 25,
    marginTop: 16,
    marginBottom: 16,
  },
  nameInputContainer: {
    height: 42,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  nameInputContainerFocused: {
    borderColor: '#000000',
  },
  nameInputLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    color: '#1E1E1E',
    marginTop: 2,
  },
  nameInput: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: '#000000',
    padding: 0,
    height: 22,
  },
  searchSection: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchContainer: {
    height: 36,
    borderRadius: 100,
    backgroundColor: 'rgba(118,118,128,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 14,
    color: '#000000',
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  chipText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#000000',
  },
  chipRemove: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    color: '#8E8E93',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
  },
  userList: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: colors.gray500,
  },
  buttonContainer: {
    paddingHorizontal: 25,
    paddingTop: 12,
  },
  createButton: {
    width: 313,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  createButtonActive: {
    backgroundColor: colors.success,
  },
  createButtonText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
