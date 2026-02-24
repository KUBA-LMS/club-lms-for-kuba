import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyGroups, MyGroup } from '../../services/clubs';
import { CheckIcon, ChevronDownIcon } from '../icons';

type VisibilityType = 'friends_only' | 'club';

interface PostVisibilityBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: VisibilityType, clubId?: string, clubName?: string) => void;
  selectedType?: VisibilityType;
  selectedClubId?: string;
}

export default function PostVisibilityBottomSheet({
  visible,
  onClose,
  onSelect,
  selectedType,
  selectedClubId,
}: PostVisibilityBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) fetchGroups();
  }, [visible]);

  useEffect(() => {
    if (!visible) setExpandedGroups(new Set());
  }, [visible]);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyGroups();
      setGroups(data);
    } catch {
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

  const isExpanded = (groupId: string) => expandedGroups.has(groupId);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Friends Only option */}
            <TouchableOpacity
              style={styles.friendsOnlyRow}
              onPress={() => onSelect('friends_only')}
              activeOpacity={0.6}
            >
              <Text style={styles.friendsOnlyText}>ONLY TO MY FRIENDS</Text>
              {selectedType === 'friends_only' && (
                <CheckIcon size={16} color="#8E8E93" />
              )}
            </TouchableOpacity>

            {/* Club list */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              groups.map((group) => (
                <React.Fragment key={group.id}>
                  <View style={styles.clubRow}>
                    <TouchableOpacity
                      style={styles.clubItem}
                      onPress={() => onSelect('club', group.id, group.name)}
                      activeOpacity={0.6}
                    >
                      {group.logo_image ? (
                        <Image
                          source={{ uri: group.logo_image }}
                          style={styles.clubAvatar}
                        />
                      ) : (
                        <View style={[styles.clubAvatar, styles.clubAvatarPlaceholder]}>
                          <Text style={styles.clubAvatarText}>
                            {group.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.clubInfo}>
                        <Text style={styles.clubName}>{group.name}</Text>
                        {group.subgroups.length > 0 && (
                          <TouchableOpacity
                            style={styles.viewSubgroupsBtn}
                            onPress={() => toggleExpand(group.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.viewSubgroupsText}>View Subgroups</Text>
                            <View
                              style={{
                                transform: [
                                  { rotate: isExpanded(group.id) ? '180deg' : '0deg' },
                                ],
                              }}
                            >
                              <ChevronDownIcon size={10} color="#8E8E93" />
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                      {selectedType === 'club' && selectedClubId === group.id && (
                        <CheckIcon size={16} color="#8E8E93" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {isExpanded(group.id) &&
                    group.subgroups.map((sub) => (
                      <View key={sub.id} style={styles.subgroupRow}>
                        <View style={styles.bracketContainer}>
                          <View style={styles.bracketVertical} />
                          <View style={styles.bracketHorizontal} />
                        </View>
                        <TouchableOpacity
                          style={styles.subgroupItem}
                          onPress={() => onSelect('club', sub.id, sub.name)}
                          activeOpacity={0.6}
                        >
                          {sub.logo_image ? (
                            <Image
                              source={{ uri: sub.logo_image }}
                              style={styles.subgroupAvatar}
                            />
                          ) : (
                            <View
                              style={[styles.subgroupAvatar, styles.clubAvatarPlaceholder]}
                            >
                              <Text style={styles.subgroupAvatarText}>
                                {sub.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.subgroupName} numberOfLines={1}>
                            {sub.name}
                          </Text>
                          {selectedType === 'club' && selectedClubId === sub.id && (
                            <CheckIcon size={16} color="#34C759" />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                </React.Fragment>
              ))
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
    backgroundColor: '#F2F2F2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '70%',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    marginBottom: 12,
  },
  doneButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    backgroundColor: '#0088FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  doneButtonText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },

  // Friends only row
  friendsOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 50,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  friendsOnlyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },

  // Club row (reuse from ProviderSelector)
  clubRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
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
    fontFamily: 'OpenSans-Bold',
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
    fontSize: 10,
    color: '#8E8E93',
  },

  // Subgroup row
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
    fontFamily: 'OpenSans-Bold',
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
});
