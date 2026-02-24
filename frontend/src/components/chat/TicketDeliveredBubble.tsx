import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types/chat';
import ReadReceipt from './ReadReceipt';

interface TicketDeliveredBubbleProps {
  message: Message;
  isOwn: boolean;
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

export default function TicketDeliveredBubble({
  message,
  isOwn,
  unreadCount = 0,
}: TicketDeliveredBubbleProps) {
  const ticket = parseTicketContent(message.content);
  const subtitle = [ticket.location, ticket.date].filter(Boolean).join(' | ');

  return (
    <View style={[styles.row, isOwn && styles.ownRow]}>
      {isOwn && (
        <View style={styles.meta}>
          <ReadReceipt count={unreadCount} />
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
      )}
      <View style={styles.card}>
        <View style={styles.ticketPreview}>
          <Text style={styles.ticketTitle}>{ticket.title.toUpperCase()}</Text>
          {subtitle ? (
            <Text style={styles.ticketSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.deliveredButton}>
          <Text style={styles.deliveredText}>Delivered</Text>
        </View>
      </View>
      {!isOwn && <Text style={styles.time}>{formatTime(message.created_at)}</Text>}
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
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 6,
    marginBottom: 2,
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    maxWidth: '75%',
  },
  ticketPreview: {
    backgroundColor: '#F0EAFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  ticketTitle: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
  deliveredButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deliveredText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  time: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginHorizontal: 4,
    marginBottom: 2,
  },
});
