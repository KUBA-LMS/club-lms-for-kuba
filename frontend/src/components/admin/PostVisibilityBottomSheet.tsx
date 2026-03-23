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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyGroups, MyGroup } from '../../services/clubs';
import { CheckIcon, ChevronDownIcon } from '../icons';
import { resolveImageUrl } from '../../utils/image';

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
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header: title + Done */}
          <View style={styles.header}>
            <Text style={styles.title}>Post Visibility</Text>
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
              style={[styles.optionRow, selectedType === 'friends_only' && styles.optionRowSelected]}
              onPress={() => onSelect('friends_only')}
              activeOpacity={0.6}
            >
              <Text style={styles.optionText}>Only to my friends</Text>
              {selectedType === 'friends_only' && (
                <CheckIcon size={16} color="#1C1C1E" />
              )}
            </TouchableOpacity>

            {/* Divider label */}
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionLabelText}>BY CLUB</Text>
            </View>

            {/* Club list */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
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
                          source={{ uri: resolveImageUrl(group.logo_image) }}
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
                        <CheckIcon size={16} color="#1C1C1E" />
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
                              source={{ uri: resolveImageUrl(sub.logo_image) }}
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
                            <CheckIcon size={16} color="#1C1C1E" />
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    minHeight: '45%',
    maxHeight: '75%',
  },
  handleRow: {
    alignItems: 'center',
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
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: '#000000',
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  optionRowSelected: {
    backgroundColor: '#F5F5F5',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#1C1C1E',
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabelText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  clubRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    height: 72,
  },
  clubAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  clubAvatarPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#8E8E93',
  },
  clubInfo: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },
  clubName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#000000',
  },
  viewSubgroupsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  viewSubgroupsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  subgroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bracketContainer: {
    width: 24,
    height: 72,
    marginLeft: 20,
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
    paddingVertical: 12,
    paddingRight: 20,
    height: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  subgroupAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
  },
  subgroupAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8E8E93',
  },
  subgroupName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000000',
    flex: 1,
    marginLeft: 10,
  },
});
