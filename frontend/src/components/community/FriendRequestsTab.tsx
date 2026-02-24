import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants';
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  FriendRequestItem,
  ClubBrief,
} from '../../services/user';
import { useAuth } from '../../context/AuthContext';
import { useUserChannel } from '../../hooks/useWebSocket';

function ClubBadges({ clubs }: { clubs: ClubBrief[] }) {
  if (clubs.length === 0) return null;
  return (
    <View style={styles.badgeRow}>
      {clubs.map((club) =>
        club.logo_image ? (
          <Image
            key={club.id}
            source={{ uri: club.logo_image }}
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

interface RequestItemProps {
  request: FriendRequestItem;
  onHandled: (requestId: string) => void;
}

function RequestItem({ request, onHandled }: RequestItemProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const handleAccept = useCallback(async () => {
    setLoading('accept');
    try {
      await acceptFriendRequest(request.id);
      onHandled(request.id);
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }, [request.id, onHandled]);

  const handleReject = useCallback(async () => {
    setLoading('reject');
    try {
      await rejectFriendRequest(request.id);
      onHandled(request.id);
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }, [request.id, onHandled]);

  const sender = request.from_user;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.avatarContainer}>
        {sender.profile_image ? (
          <Image source={{ uri: sender.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.username}>{sender.username}</Text>
        {request.common_clubs.length > 0 && (
          <>
            <Text style={styles.groupsLabel}>Groups in common:</Text>
            <ClubBadges clubs={request.common_clubs} />
          </>
        )}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.7}
          disabled={loading !== null}
        >
          {loading === 'accept' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptText}>Accept</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={handleReject}
          activeOpacity={0.7}
          disabled={loading !== null}
        >
          {loading === 'reject' ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Text style={styles.rejectText}>Reject</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.separator} />
    </View>
  );
}

interface FriendRequestsTabProps {
  onRequestCountChange?: (count: number) => void;
}

export default function FriendRequestsTab({ onRequestCountChange }: FriendRequestsTabProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getFriendRequests();
      setRequests(res.data);
      onRequestCountChange?.(res.data.length);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [onRequestCountChange]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time: listen for new friend requests via WS
  useUserChannel((msg) => {
    const type = msg.type as string;
    if (type === 'friend_request_received') {
      // Refetch to get full data with common_clubs
      fetchRequests();
    }
    if (type === 'friend_request_accepted') {
      // Someone accepted our request - not relevant here but good to know
    }
  });

  const handleHandled = useCallback((requestId: string) => {
    setRequests((prev) => {
      const next = prev.filter((r) => r.id !== requestId);
      onRequestCountChange?.(next.length);
      return next;
    });
  }, [onRequestCountChange]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gray500} />
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <RequestItem request={item} onHandled={handleHandled} />
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
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
  avatarContainer: {
    width: 50,
    height: 50,
    marginRight: 13,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5EA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 17,
    color: '#000000',
    marginBottom: 2,
  },
  groupsLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 10,
    color: '#000000',
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
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  clubBadgeText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 8,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  rejectButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    color: colors.error,
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
