import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SearchIcon, TrashIcon } from '../icons';
import RemoveFriendModal from './RemoveFriendModal';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';
import Avatar from '../common/Avatar';
import {
  getFriends,
  removeFriend,
  UserFriendItem,
  ClubBrief,
} from '../../services/user';

function ClubBadges({ clubs }: { clubs: ClubBrief[] }) {
  if (clubs.length === 0) return null;
  return (
    <View style={styles.badgeRow}>
      {clubs.map((club) =>
        club.logo_image ? (
          <Image
            key={club.id}
            source={{ uri: resolveImageUrl(club.logo_image) }}
            style={styles.clubBadge}
          />
        ) : (
          <View key={club.id} style={[styles.clubBadge, styles.clubBadgePlaceholder]}>
            <Text style={styles.clubBadgeText} numberOfLines={1}>
              {club.name}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

interface FriendManageItemProps {
  friend: UserFriendItem;
  onDelete: (friend: UserFriendItem) => void;
}

function FriendManageItem({ friend, onDelete }: FriendManageItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });
      return (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(friend);
          }}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <TrashIcon size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [friend, onDelete],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={styles.itemContainer}>
        <Avatar uri={friend.profile_image} size={50} name={friend.username} style={{ marginRight: 13 }} />
        <View style={styles.content}>
          <Text style={styles.username}>{friend.username}</Text>
          {friend.common_clubs.length > 0 && (
            <>
              <Text style={styles.groupsLabel}>Groups in common:</Text>
              <ClubBadges clubs={friend.common_clubs} />
            </>
          )}
        </View>
        <View style={styles.separator} />
      </View>
    </Swipeable>
  );
}

export default function FriendManageTab() {
  const [friends, setFriends] = useState<UserFriendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [removeTarget, setRemoveTarget] = useState<UserFriendItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFriends = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const res = await getFriends(q || undefined);
      setFriends(res.data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleTextChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchFriends(text), 400);
    },
    [fetchFriends],
  );

  const handleDeletePress = useCallback((friend: UserFriendItem) => {
    setRemoveTarget(friend);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await removeFriend(removeTarget.id);
      setFriends((prev) => prev.filter((f) => f.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch {
      // silent
    } finally {
      setIsRemoving(false);
    }
  }, [removeTarget]);

  const handleRemoveCancel = useCallback(() => {
    setRemoveTarget(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Username"
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={handleTextChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <SearchIcon size={18} color={colors.gray500} />
        </View>
      </View>

      {/* Friends list */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.gray500} />
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendManageItem friend={item} onDelete={handleDeletePress} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No friends yet</Text>
            </View>
          }
        />
      )}

      {/* Remove confirmation modal */}
      <RemoveFriendModal
        visible={removeTarget !== null}
        username={removeTarget?.username ?? ''}
        isRemoving={isRemoving}
        onBack={handleRemoveCancel}
        onProceed={handleRemoveConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.black,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray400,
  },
  // Swipe delete
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  // Item styles
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: colors.black,
    marginBottom: 2,
  },
  groupsLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.black,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  clubBadge: {
    height: 16,
    width: 65,
    borderRadius: 5,
  },
  clubBadgePlaceholder: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  clubBadgeText: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.gray700,
  },
  separator: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
  },
});
