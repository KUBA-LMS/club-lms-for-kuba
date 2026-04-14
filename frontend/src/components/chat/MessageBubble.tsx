import React, { useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReadReceipt from './ReadReceipt';
import Avatar from '../common/Avatar';
import { Message } from '../../types/chat';
import { MainStackParamList } from '../../navigation/types';
import { colors, font } from '../../constants';
import moderation, { REPORT_REASON_LABELS, ReportReason } from '../../services/moderation';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  unreadCount?: number;
  onBlocked?: (userId: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const REPORT_REASONS: ReportReason[] = [
  'harassment',
  'hate_speech',
  'sexual_content',
  'violence',
  'spam',
  'impersonation',
  'illegal',
  'other',
];

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  unreadCount = 0,
  onBlocked,
}: MessageBubbleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  const submitReport = useCallback(
    async (reason: ReportReason) => {
      await moderation.submitReport({
        targetType: 'message',
        targetId: message.id,
        targetOwnerId: message.sender.id,
        reason,
      });
      Alert.alert(
        'Report received',
        'Thank you. Our team will review this report within 24 hours and take action if it violates our guidelines.',
      );
    },
    [message.id, message.sender.id],
  );

  const openReportFlow = useCallback(() => {
    const buttons = REPORT_REASONS.map((reason) => ({
      text: REPORT_REASON_LABELS[reason],
      onPress: () => submitReport(reason),
    }));
    buttons.push({ text: 'Cancel', onPress: async () => undefined } as any);
    Alert.alert('Why are you reporting this?', 'Choose the reason that best applies.', buttons, {
      cancelable: true,
    });
  }, [submitReport]);

  const blockSender = useCallback(() => {
    Alert.alert(
      'Block user',
      `Block ${message.sender.username}? You won't see their messages. They won't be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await moderation.blockUser(message.sender.id, message.sender.username);
            onBlocked?.(message.sender.id);
            Alert.alert('Blocked', `${message.sender.username} has been blocked.`);
          },
        },
      ],
    );
  }, [message.sender.id, message.sender.username, onBlocked]);

  const openMessageActions = useCallback(() => {
    if (isOwn) return;
    Alert.alert(
      'Message actions',
      `From ${message.sender.username}`,
      [
        { text: 'Report', style: 'destructive', onPress: openReportFlow },
        { text: 'Block user', style: 'destructive', onPress: blockSender },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [isOwn, message.sender.username, openReportFlow, blockSender]);

  // Event share bubble
  if (message.type === 'event_share') {
    const eventId = message.content;
    const card = (
      <TouchableOpacity
        style={styles.eventShareCard}
        onPress={() => navigation.navigate('EventDetail', { eventId })}
        activeOpacity={0.7}
      >
        <Text style={styles.eventShareTitle}>Shared an Event</Text>
        <Text style={styles.eventShareSub}>Tap to view</Text>
      </TouchableOpacity>
    );

    if (isOwn) {
      return (
        <View style={styles.ownRow}>
          <View style={styles.ownMeta}>
            <ReadReceipt count={unreadCount} />
            <Text style={styles.time}>{formatTime(message.created_at)}</Text>
          </View>
          {card}
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={openMessageActions}
        delayLongPress={350}
        style={styles.otherRow}
      >
        {showAvatar ? (
          <Avatar uri={message.sender.profile_image} size={32} name={message.sender.username} style={{ marginRight: 8 }} />
        ) : (
          <View style={styles.avatarSpacer} />
        )}
        <View style={styles.otherContent}>
          {showAvatar && <Text style={styles.senderName}>{message.sender.username}</Text>}
          <View style={styles.otherBubbleRow}>
            {card}
            <Text style={styles.time}>{formatTime(message.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (isOwn) {
    return (
      <View style={styles.ownRow}>
        <View style={styles.ownMeta}>
          {isFailed && <Text style={styles.failedText}>!</Text>}
          {isSending && <Text style={styles.sendingText}>...</Text>}
          <ReadReceipt count={unreadCount} />
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
        <View style={styles.ownBubble}>
          <Text style={styles.ownText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={openMessageActions}
      delayLongPress={350}
      style={styles.otherRow}
    >
      {showAvatar ? (
        <Avatar uri={message.sender.profile_image} size={32} name={message.sender.username} style={{ marginRight: 8 }} />
      ) : (
        <View style={styles.avatarSpacer} />
      )}
      <View style={styles.otherContent}>
        {showAvatar && <Text style={styles.senderName}>{message.sender.username}</Text>}
        <View style={styles.otherBubbleRow}>
          <View style={styles.otherBubble}>
            <Text style={styles.otherText}>{message.content}</Text>
          </View>
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  ownMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 6,
    marginBottom: 2,
  },
  ownBubble: {
    backgroundColor: colors.gray900,
    borderRadius: 20,
    borderBottomRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '72%',
  },
  ownText: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.white,
    lineHeight: 21,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  avatarSpacer: {
    width: 32,
    marginRight: 8,
  },
  otherContent: {
    maxWidth: '72%',
  },
  senderName: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 4,
    marginLeft: 2,
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  otherBubble: {
    backgroundColor: colors.gray100,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  otherText: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 21,
  },
  time: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray400,
    marginHorizontal: 5,
    marginBottom: 2,
  },
  failedText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.error,
    marginRight: 4,
  },
  sendingText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray400,
    marginRight: 4,
  },
  eventShareCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '72%',
    borderWidth: 1,
    borderColor: '#D0E8FF',
  },
  eventShareTitle: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  eventShareSub: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.primaryLight,
    marginTop: 2,
  },
});
