import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ClipboardListIcon } from '../icons';
import ReadReceipt from './ReadReceipt';
import { Message, PaymentRequest, PaymentSplit } from '../../types/chat';
import * as chatApi from '../../services/chat';

interface RequestSplitBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  unreadCount?: number;
  paymentUpdateSignal?: number;
  onOpenDetail?: (paymentRequestId: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatAmount(amount: number): string {
  return `${Math.round(amount).toLocaleString()} KRW`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return '#34C759';
    case 'sent':
      return '#FF9500';
    default:
      return '#8E8E93';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'sent':
      return 'Sent';
    default:
      return 'Pending';
  }
}

export default function RequestSplitBubble({
  message,
  isOwn,
  currentUserId,
  unreadCount = 0,
  paymentUpdateSignal = 0,
  onOpenDetail,
}: RequestSplitBubbleProps) {
  const [paymentReq, setPaymentReq] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (message.payment_request_id) {
      setIsLoading(true);
      chatApi
        .getPaymentRequest(message.payment_request_id)
        .then(setPaymentReq)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [message.payment_request_id, paymentUpdateSignal]);

  const mySplit = paymentReq?.splits.find((s: PaymentSplit) => s.user.id === currentUserId);
  const confirmedCount = paymentReq
    ? paymentReq.splits.filter((s: PaymentSplit) => s.status === 'confirmed').length
    : 0;
  const totalCount = paymentReq?.splits.length || 0;

  const handlePress = () => {
    if (message.payment_request_id && onOpenDetail) {
      onOpenDetail(message.payment_request_id);
    }
  };

  return (
    <View style={[styles.row, isOwn && styles.ownRow]}>
      {isOwn && (
        <View style={styles.meta}>
          <ReadReceipt count={unreadCount} />
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={!onOpenDetail}
      >
        <View style={styles.titleRow}>
          <ClipboardListIcon size={20} color="#333333" />
          <Text style={styles.title}>Request 1/N</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.amount}>
          {formatAmount(message.payment_amount || 0)}
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color="#8E8E93" style={{ marginVertical: 10 }} />
        ) : paymentReq ? (
          <>
            {/* Progress */}
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {confirmedCount}/{totalCount}
              </Text>
            </View>

            {/* My status badge */}
            {mySplit && (
              <View style={[styles.myStatusBadge, { backgroundColor: getStatusColor(mySplit.status) + '20' }]}>
                <Text style={[styles.myStatusText, { color: getStatusColor(mySplit.status) }]}>
                  {getStatusLabel(mySplit.status)}
                </Text>
              </View>
            )}

            {/* Tap hint */}
            <Text style={styles.tapHint}>Tap for details</Text>
          </>
        ) : null}
      </TouchableOpacity>
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
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#FFFFFF',
    width: 290,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#333333',
    marginLeft: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D0D0D0',
    marginVertical: 10,
  },
  amount: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 28,
    color: '#000000',
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2.5,
  },
  progressText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    color: '#8E8E93',
  },
  myStatusBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  myStatusText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 13,
  },
  tapHint: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: '#AEAEB2',
    textAlign: 'center',
  },
  time: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginHorizontal: 4,
    marginBottom: 2,
  },
});
