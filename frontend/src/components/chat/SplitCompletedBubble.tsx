import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ClipboardListIcon } from '../icons';
import ReadReceipt from './ReadReceipt';
import { Message, PaymentRequest, PaymentSplit } from '../../types/chat';
import * as chatApi from '../../services/chat';

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
  }, [message.payment_request_id]);

  const accumulatedTotal = paymentReq
    ? paymentReq.splits
        .filter((s: PaymentSplit) => s.status === 'accumulated')
        .reduce((sum: number, s: PaymentSplit) => sum + s.amount, 0)
    : 0;
  const depositUsedTotal = paymentReq
    ? paymentReq.splits
        .filter((s: PaymentSplit) => s.status === 'deposit_used')
        .reduce((sum: number, s: PaymentSplit) => sum + s.amount, 0)
    : 0;

  const showAccumulatedTag = accumulatedTotal > 0;

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
          <ClipboardListIcon size={20} color="#8E8E93" />
          <Text style={styles.title}>1/N Completed</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>
            {formatAmount(message.payment_amount || 0)}
          </Text>
          {showAccumulatedTag && (
            <Text style={styles.accumulatedTag}> (Accumulated)</Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#8E8E93" style={{ marginTop: 6 }} />
        ) : paymentReq ? (
          <>
            <Text style={styles.detailText}>
              Accumulated Total: {formatAmount(accumulatedTotal)}
            </Text>
            {depositUsedTotal > 0 && (
              <Text style={styles.detailText}>
                Remaining Deposit: {formatAmount(depositUsedTotal)}
              </Text>
            )}
          </>
        ) : null}
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
    color: '#000000',
    marginLeft: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  amount: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 22,
    color: '#000000',
  },
  accumulatedTag: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#E8A317',
  },
  detailText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  time: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 11,
    color: '#8E8E93',
    marginHorizontal: 4,
    marginBottom: 2,
  },
});
