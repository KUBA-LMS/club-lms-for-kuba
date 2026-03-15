import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { GiftIcon } from '../icons';
import ReadReceipt from './ReadReceipt';
import { Message } from '../../types/chat';

interface GiftTicketBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onAccept?: () => void;
  unreadCount?: number;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function parseTicketContent(content: string) {
  const parts = content.split('|').map((p) => p.trim());
  return {
    title: parts[0] || 'Ticket',
    location: parts[1] || '',
    date: parts[2] || '',
  };
}

export default function GiftTicketBubble({
  message,
  isOwn,
  showAvatar,
  onAccept,
  unreadCount = 0,
}: GiftTicketBubbleProps) {
  const ticket = parseTicketContent(message.content);
  const subtitle = [ticket.location, ticket.date].filter(Boolean).join(' | ');

  return (
    <View style={[styles.row, isOwn && styles.ownRow]}>
      {!isOwn && showAvatar ? (
        message.sender.profile_image ? (
          <Image source={{ uri: message.sender.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )
      ) : !isOwn ? (
        <View style={styles.avatarSpacer} />
      ) : null}

      <View style={styles.cardWrapper}>
        {!isOwn && showAvatar && (
          <Text style={styles.senderName}>{message.sender.username}</Text>
        )}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <GiftIcon size={18} color="#8B5CF6" />
            <Text style={styles.title}>{isOwn ? 'Ticket Sent' : 'Surprise Gift!'}</Text>
          </View>
          <View style={styles.ticketPreview}>
            <Text style={styles.ticketTitle}>{ticket.title.toUpperCase()}</Text>
            {subtitle ? (
              <Text style={styles.ticketSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
          {!isOwn && onAccept && (
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept} activeOpacity={0.7}>
              <Text style={styles.acceptText}>Accept Gift</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.timeMeta}>
          {isOwn && <ReadReceipt count={unreadCount} />}
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  ownRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF9500',
  },
  avatarSpacer: {
    width: 32,
    marginRight: 8,
  },
  senderName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 3,
    marginLeft: 4,
  },
  cardWrapper: {
    maxWidth: '75%',
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#8B5CF6',
    marginLeft: 6,
  },
  ticketPreview: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  ticketTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#AEAEB2',
  },
  acceptButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginLeft: 4,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
});
