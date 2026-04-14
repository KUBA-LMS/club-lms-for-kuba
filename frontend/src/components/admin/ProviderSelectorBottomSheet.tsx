import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { searchUsers } from '../../services/chat';
import { CheckIcon, ChevronDownIcon } from '../icons';
import { resolveImageUrl } from '../../utils/image';

interface ProviderSelectorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (clubId: string, clubName: string) => void;
  selectedClubId?: string;
}

interface ClubItem {
  id: string;
  name: string;
  logo_image: string | null;
  parent_id: string | null;
}

interface SearchUser {
  id: string;
  username: string;
  profile_image: string | null;
}

export default function ProviderSelectorBottomSheet({
  visible,
  onClose,
  onSelect,
  selectedClubId,
}: ProviderSelectorBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'group' | 'individual'>('group');

  // Group tab
  const [groups, setGroups] = useState<ClubItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Individual tab
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && activeTab === 'group') {
      fetchGroups();
    }
  }, [visible, activeTab]);

  useEffect(() => {
    if (!visible) {
      setSearchText('');
      setUsers([]);
      setExpandedGroups(new Set());
    }
  }, [visible]);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ data: ClubItem[] }>('/clubs/?limit=100');
      setGroups(response.data.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleExpand = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  // Individual tab search
  useEffect(() => {
    if (activeTab !== 'individual' || !visible) return;

    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const result = await searchUsers(searchText);
        setUsers(result.data);
      } catch {
        setUsers([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchText, activeTab, visible]);

  const handleSelect = useCallback(
    (id: string, name: string) => {
      onSelect(id, name);
    },
    [onSelect],
  );

  const isExpanded = (groupId: string) => expandedGroups.has(groupId);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.container, { paddingBottom: insets.bottom + 16 }]}
          onPress={() => Keyboard.dismiss()}
        >
          {/* Header */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'group' && styles.segmentActive]}
              onPress={() => setActiveTab('group')}
            >
              <Text
                style={[styles.segmentText, activeTab === 'group' && styles.segmentTextActive]}
              >
                Group
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'individual' && styles.segmentActive]}
              onPress={() => setActiveTab('individual')}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'individual' && styles.segmentTextActive,
                ]}
              >
                Individual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'group' ? (
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : groups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No groups found</Text>
                </View>
              ) : (
                groups.map((group) => (
                  <View key={group.id} style={[styles.clubRow, group.parent_id && styles.clubRowSub]}>
                    <TouchableOpacity
                      style={styles.clubItem}
                      onPress={() => handleSelect(group.id, group.name)}
                      activeOpacity={0.6}
                    >
                      {group.logo_image ? (
                        <Image source={{ uri: resolveImageUrl(group.logo_image) }} style={styles.clubAvatar} />
                      ) : (
                        <View style={[styles.clubAvatar, styles.clubAvatarPlaceholder]}>
                          <Text style={styles.clubAvatarText}>
                            {group.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.clubInfo}>
                        <Text style={styles.clubName}>{group.name}</Text>
                        {group.parent_id && (
                          <Text style={styles.viewSubgroupsText}>Subgroup</Text>
                        )}
                      </View>
                      {selectedClubId === group.id && (
                        <CheckIcon size={16} color="#1C1C1E" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )
            ) : (
              /* Individual tab */
              <>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search by username"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {searchLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                  </View>
                ) : users.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {searchText ? 'No users found' : 'Search for users'}
                    </Text>
                  </View>
                ) : (
                  users.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.userItem}
                      onPress={() => handleSelect(user.id, user.username)}
                      activeOpacity={0.6}
                    >
                      {user.profile_image ? (
                        <Image
                          source={{ uri: resolveImageUrl(user.profile_image) }}
                          style={styles.userAvatar}
                        />
                      ) : (
                        <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                          <Text style={styles.userAvatarText}>
                            {user.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.username}</Text>
                      </View>
                      {selectedClubId === user.id && (
                        <CheckIcon size={16} color="#34C759" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    minHeight: '45%',
    maxHeight: '75%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 4,
    marginBottom: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  doneButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Segmented Control (iOS style)
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 100,
    padding: 4,
    height: 36,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#000000',
    letterSpacing: -0.08,
  },
  segmentTextActive: {
    fontFamily: 'Inter-SemiBold',
  },

  // Content
  content: {
    flex: 1,
    minHeight: 200,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },

  // Group tab - Club row
  clubRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  clubRowSub: {
    backgroundColor: '#FAFAFA',
    paddingLeft: 16,
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 13,
    height: 90,
  },
  clubAvatar: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 0.1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  clubAvatarPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#8E8E93',
  },
  clubInfo: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },
  clubName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#000000',
  },
  viewSubgroupsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewSubgroupsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },

  // Group tab - Subgroup row
  subgroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingLeft: 0,
  },
  bracketContainer: {
    width: 24,
    height: 90,
    marginLeft: 5,
  },
  bracketVertical: {
    position: 'absolute',
    left: 7,
    top: 0,
    width: 2,
    height: '55%',
    backgroundColor: '#C5C5C5',
    borderBottomLeftRadius: 4,
  },
  bracketHorizontal: {
    position: 'absolute',
    left: 7,
    top: '55%',
    width: 12,
    height: 2,
    backgroundColor: '#C5C5C5',
    borderBottomLeftRadius: 4,
  },
  subgroupItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 13,
    height: 90,
  },
  subgroupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 0.1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  subgroupAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#8E8E93',
  },
  subgroupName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#000000',
    flex: 1,
    marginLeft: 13,
  },
  roleBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  roleBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 6,
    color: '#FFFFFF',
  },

  // Individual tab
  searchInputContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    paddingHorizontal: 14,
    height: 40,
    justifyContent: 'center',
  },
  searchInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#1E1E1E',
    padding: 0,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 15,
    height: 90,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#8E8E93',
  },
  userInfo: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: '#000000',
  },
});
