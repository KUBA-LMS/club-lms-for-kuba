import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GiftIcon } from '../icons';
import ReadReceipt from './ReadReceipt';
import Avatar from '../common/Avatar';
import { Message } from '../../types/chat';
import { colors, font } from '../../constants';

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
        <Avatar uri={message.sender.profile_image} size={32} name={message.sender.username} style={{ marginRight: 8 }} />
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
  avatarSpacer: {
    width: 32,
    marginRight: 8,
  },
  senderName: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.gray500,
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
    backgroundColor: colors.white,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: '#8B5CF6',
    marginLeft: 6,
  },
  ticketPreview: {
    backgroundColor: colors.gray900,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  ticketTitle: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.white,
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray400,
  },
  acceptButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.white,
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginLeft: 4,
  },
  time: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
});
