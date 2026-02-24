import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listChats, sendMessage } from '../../services/chat';
import { copyEventLink, shareEventViaSystem } from '../../utils/share';
import { Chat } from '../../types/chat';

interface ShareBottomSheetProps {
  eventId: string;
  eventTitle: string;
  onClose?: () => void;
}

const ShareBottomSheet = forwardRef<BottomSheetModal, ShareBottomSheetProps>(
  ({ eventId, eventTitle, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['50%'], []);
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState<string | null>(null);

    useEffect(() => {
      listChats()
        .then((res) => setChats(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const handleShareToChat = useCallback(
      async (chatId: string) => {
        setSending(chatId);
        try {
          await sendMessage(chatId, eventId, 'event_share');
          Alert.alert('Shared', 'Event shared to chat');
          onClose?.();
        } catch {
          Alert.alert('Error', 'Failed to share event');
        } finally {
          setSending(null);
        }
      },
      [eventId, onClose],
    );

    const handleCopyLink = useCallback(async () => {
      await copyEventLink(eventId);
      Alert.alert('Copied', 'Event link copied to clipboard');
    }, [eventId]);

    const handleSystemShare = useCallback(async () => {
      await shareEventViaSystem(eventTitle, eventId);
    }, [eventTitle, eventId]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.3}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        onDismiss={onClose}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Share Event</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopyLink}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>Link</Text>
            </View>
            <Text style={styles.actionLabel}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSystemShare}>
            <View style={[styles.actionIcon, styles.shareIcon]}>
              <Text style={styles.actionIconText}>Share</Text>
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Send to Chat</Text>

        <BottomSheetScrollView
          contentContainerStyle={[styles.chatList, { paddingBottom: insets.bottom + 16 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#8E8E93" style={{ marginTop: 20 }} />
          ) : chats.length === 0 ? (
            <Text style={styles.emptyText}>No chats available</Text>
          ) : (
            chats.map((chat) => {
              const displayName =
                chat.name || chat.members.map((m) => m.username).join(', ');
              const avatar = chat.members[0]?.profile_image;

              return (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatItem}
                  onPress={() => handleShareToChat(chat.id)}
                  disabled={sending !== null}
                  activeOpacity={0.7}
                >
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.chatAvatar} />
                  ) : (
                    <View style={[styles.chatAvatar, styles.chatAvatarEmpty]}>
                      <Text style={styles.chatAvatarText}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.chatName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {sending === chat.id && (
                    <ActivityIndicator size="small" color="#000" />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

ShareBottomSheet.displayName = 'ShareBottomSheet';

export default ShareBottomSheet;

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: '#CCCCCC',
    width: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 18,
    color: '#000000',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    backgroundColor: '#E8F5E9',
  },
  actionIconText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 11,
    color: '#000000',
  },
  actionLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: '#595959',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chatList: {
    paddingHorizontal: 20,
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatAvatarEmpty: {
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  chatName: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 15,
    color: '#000000',
    flex: 1,
  },
});
