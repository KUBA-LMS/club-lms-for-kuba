import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SearchIcon } from '../icons';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';
import Avatar from '../common/Avatar';
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  UserSearchItem,
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

type ItemState = 'none' | 'sent' | 'received' | 'friend';

interface FriendSearchItemProps {
  user: UserSearchItem;
  onStateChange: (userId: string, newState: ItemState) => void;
}

function FriendSearchItem({ user, onStateChange }: FriendSearchItemProps) {
  const [loading, setLoading] = useState(false);

  const state: ItemState = user.is_friend
    ? 'friend'
    : user.request_status === 'sent'
      ? 'sent'
      : user.request_status === 'received'
        ? 'received'
        : 'none';

  const handleSendRequest = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await sendFriendRequest(user.id);
      onStateChange(user.id, 'sent');
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user.id, loading, onStateChange]);

  const handleAccept = useCallback(async () => {
    if (loading || !user.request_id) return;
    setLoading(true);
    try {
      await acceptFriendRequest(user.request_id);
      onStateChange(user.id, 'friend');
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user.id, user.request_id, loading, onStateChange]);

  const renderButton = () => {
    if (loading) {
      return (
        <View style={styles.pendingBadge}>
          <ActivityIndicator size="small" color={colors.gray400} />
        </View>
      );
    }
    switch (state) {
      case 'friend':
        return (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Friends</Text>
          </View>
        );
      case 'sent':
        return (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        );
      case 'received':
        return (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleSendRequest}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Add +</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.itemContainer}>
      <Avatar uri={user.profile_image} size={50} name={user.username} style={{ marginRight: 13 }} />
      <View style={styles.content}>
        <Text style={styles.username}>{user.username}</Text>
        {user.common_clubs.length > 0 && (
          <>
            <Text style={styles.groupsLabel}>Groups in common:</Text>
            <ClubBadges clubs={user.common_clubs} />
          </>
        )}
      </View>
      {renderButton()}
      <View style={styles.separator} />
    </View>
  );
}

export default function FriendSearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await searchUsers(q.trim());
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(text), 400);
    },
    [doSearch],
  );

  const handleStateChange = useCallback((userId: string, newState: ItemState) => {
    setResults((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        if (newState === 'friend') return { ...u, is_friend: true, request_status: null };
        if (newState === 'sent') return { ...u, request_status: 'sent' as const };
        return u;
      }),
    );
  }, []);

  return (
    <View style={styles.container}>
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
            returnKeyType="search"
          />
          <SearchIcon size={18} color={colors.gray500} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.gray500} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendSearchItem user={item} onStateChange={handleStateChange} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : null
          }
        />
      )}
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  addButton: {
    backgroundColor: colors.info,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.white,
  },
  acceptButton: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.white,
  },
  pendingBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  pendingText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.gray400,
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
