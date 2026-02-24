import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClipboardListIcon } from '../icons';
import ReadReceipt from './ReadReceipt';
import { Message } from '../../types/chat';

interface SplitCompletedBubbleProps {
  message: Message;
  isOwn: boolean;
  unreadCount?: number;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatAmount(amount: number): string {
  return `${Math.round(amount).toLocaleString()} KRW`;
}

export default function SplitCompletedBubble({
  message,
  isOwn,
  unreadCount = 0,
}: SplitCompletedBubbleProps) {
  return (
    <View style={[styles.row, isOwn && styles.ownRow]}>
      {isOwn && (
        <View style={styles.meta}>
          <ReadReceipt count={unreadCount} />
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
      )}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <ClipboardListIcon size={20} color="#34C759" />
          <Text style={styles.title}>1/N Completed</Text>
        </View>
        <Text style={styles.amount}>
          {formatAmount(message.payment_amount || 0)}
        </Text>
        <Text style={styles.subtitle}>All payments confirmed</Text>
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
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    maxWidth: '75%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 15,
    color: '#34C759',
    marginLeft: 6,
  },
  amount: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 22,
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  time: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginHorizontal: 4,
    marginBottom: 2,
  },
});
