import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReadReceipt from './ReadReceipt';
import { Message } from '../../types/chat';
import { MainStackParamList } from '../../navigation/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  unreadCount?: number;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  unreadCount = 0,
}: MessageBubbleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

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
      <View style={styles.otherRow}>
        {showAvatar ? (
          message.sender.profile_image ? (
            <Image source={{ uri: message.sender.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )
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
      </View>
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
    <View style={styles.otherRow}>
      {showAvatar ? (
        message.sender.profile_image ? (
          <Image source={{ uri: message.sender.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {message.sender.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )
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
    </View>
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
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderBottomRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '72%',
  },
  ownText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#6E6E73',
  },
  avatarSpacer: {
    width: 32,
    marginRight: 8,
  },
  otherContent: {
    maxWidth: '72%',
  },
  senderName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    marginLeft: 2,
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  otherBubble: {
    backgroundColor: '#EFEFEF',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  otherText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 21,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#AEAEB2',
    marginHorizontal: 5,
    marginBottom: 2,
  },
  failedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FF3B30',
    marginRight: 4,
  },
  sendingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#AEAEB2',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0056B3',
  },
  eventShareSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#4DA3FF',
    marginTop: 2,
  },
});
