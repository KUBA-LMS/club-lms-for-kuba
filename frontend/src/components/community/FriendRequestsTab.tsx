import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, font } from '../../constants';
import { resolveImageUrl } from '../../utils/image';
import Avatar from '../common/Avatar';
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  FriendRequestItem,
  ClubBrief,
  FriendRequestDirection,
} from '../../services/user';
import { useUserChannel } from '../../hooks/useWebSocket';

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

interface IncomingItemProps {
  request: FriendRequestItem;
  onHandled: (requestId: string) => void;
}

function IncomingItem({ request, onHandled }: IncomingItemProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const handleAccept = useCallback(async () => {
    setLoading('accept');
    try {
      await acceptFriendRequest(request.id);
      onHandled(request.id);
    } catch {
      Alert.alert('Error', 'Failed to accept friend request');
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
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setLoading(null);
    }
  }, [request.id, onHandled]);

  const sender = request.from_user;

  return (
    <View style={styles.itemContainer}>
      <Avatar uri={sender.profile_image} size={50} name={sender.username} style={{ marginRight: 13 }} />
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
            <ActivityIndicator size="small" color={colors.white} />
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

interface OutgoingItemProps {
  request: FriendRequestItem;
  onCancelled: (requestId: string) => void;
}

function OutgoingItem({ request, onCancelled }: OutgoingItemProps) {
  const [loading, setLoading] = useState(false);

  const doCancel = useCallback(async () => {
    setLoading(true);
    try {
      await cancelFriendRequest(request.id);
      onCancelled(request.id);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to cancel request';
      Alert.alert('Cancel failed', detail);
    } finally {
      setLoading(false);
    }
  }, [request.id, onCancelled]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel friend request?',
      `Withdraw your friend request to ${request.to_user.username}?`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: doCancel },
      ],
    );
  }, [doCancel, request.to_user.username]);

  const recipient = request.to_user;

  return (
    <View style={styles.itemContainer}>
      <Avatar uri={recipient.profile_image} size={50} name={recipient.username} style={{ marginRight: 13 }} />
      <View style={styles.content}>
        <Text style={styles.username}>{recipient.username}</Text>
        <Text style={styles.pendingLabel}>Awaiting response</Text>
        {request.common_clubs.length > 0 && <ClubBadges clubs={request.common_clubs} />}
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        activeOpacity={0.7}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.gray700} />
        ) : (
          <Text style={styles.cancelText}>Cancel</Text>
        )}
      </TouchableOpacity>
      <View style={styles.separator} />
    </View>
  );
}

interface FriendRequestsTabProps {
  onRequestCountChange?: (count: number) => void;
}

export default function FriendRequestsTab({ onRequestCountChange }: FriendRequestsTabProps) {
  const [direction, setDirection] = useState<FriendRequestDirection>('received');
  const [received, setReceived] = useState<FriendRequestItem[]>([]);
  const [sent, setSent] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch both directions in parallel so switching tabs is instant.
      const [rx, tx] = await Promise.all([
        getFriendRequests('received'),
        getFriendRequests('sent'),
      ]);
      setReceived(rx.data);
      setSent(tx.data);
      onRequestCountChange?.(rx.data.length);
    } catch {
      // keep previous state
    } finally {
      setIsLoading(false);
    }
  }, [onRequestCountChange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time updates: refetch whenever any friend-request event lands.
  useUserChannel((msg) => {
    const type = msg.type as string;
    if (
      type === 'friend_request_received' ||
      type === 'friend_request_accepted' ||
      type === 'friend_request_rejected'
    ) {
      fetchAll();
    }
  });

  const handleIncomingHandled = useCallback(
    (requestId: string) => {
      setReceived((prev) => {
        const next = prev.filter((r) => r.id !== requestId);
        onRequestCountChange?.(next.length);
        return next;
      });
    },
    [onRequestCountChange],
  );

  const handleSentCancelled = useCallback((requestId: string) => {
    setSent((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const data = direction === 'received' ? received : sent;

  return (
    <View style={styles.wrapper}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, direction === 'received' && styles.segmentActive]}
          onPress={() => setDirection('received')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentLabel,
              direction === 'received' && styles.segmentLabelActive,
            ]}
          >
            Received{received.length > 0 ? ` (${received.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, direction === 'sent' && styles.segmentActive]}
          onPress={() => setDirection('sent')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentLabel,
              direction === 'sent' && styles.segmentLabelActive,
            ]}
          >
            Sent{sent.length > 0 ? ` (${sent.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.gray500} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            direction === 'received' ? (
              <IncomingItem request={item} onHandled={handleIncomingHandled} />
            ) : (
              <OutgoingItem request={item} onCancelled={handleSentCancelled} />
            )
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {direction === 'received'
                  ? 'No pending incoming requests'
                  : "You haven't sent any pending requests"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.white },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.gray50,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  segmentLabel: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.gray500,
  },
  segmentLabelActive: {
    fontFamily: font.semibold,
    color: colors.black,
  },
  listContent: {
    paddingTop: 4,
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
    textAlign: 'center',
    paddingHorizontal: 40,
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
  pendingLabel: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 4,
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.white,
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
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.error,
  },
  cancelButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  cancelText: {
    fontFamily: font.semibold,
    fontSize: 12,
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
