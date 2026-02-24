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
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatAmount(amount: number): string {
  return `${Math.round(amount).toLocaleString()} KRW`;
}

export default function RequestSplitBubble({
  message,
  isOwn,
  currentUserId,
  unreadCount = 0,
}: RequestSplitBubbleProps) {
  const [paymentReq, setPaymentReq] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responding, setResponding] = useState(false);

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

  const mySplit = paymentReq?.splits.find((s: PaymentSplit) => s.user.id === currentUserId);
  const accumulatedTotal = paymentReq
    ? paymentReq.splits
        .filter((s: PaymentSplit) => s.status !== 'pending')
        .reduce((sum: number, s: PaymentSplit) => sum + s.amount, 0)
    : 0;

  const handleRespond = async (action: 'accumulated' | 'deposit_used') => {
    if (!mySplit) return;
    setResponding(true);
    try {
      await chatApi.respondToSplit(mySplit.id, action);
      if (message.payment_request_id) {
        const updated = await chatApi.getPaymentRequest(message.payment_request_id);
        setPaymentReq(updated);
      }
    } catch {
      // silent
    } finally {
      setResponding(false);
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
      <View style={styles.card}>
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
            <Text style={styles.accumulatedLabel}>
              Accumulated Total: {formatAmount(accumulatedTotal)}
            </Text>

            {mySplit && mySplit.status === 'pending' && !isOwn && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.accumulateButton]}
                  onPress={() => handleRespond('accumulated')}
                  disabled={responding}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accumulateText}>
                    {responding ? '...' : 'Accumulate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.depositButton]}
                  onPress={() => handleRespond('deposit_used')}
                  disabled={responding}
                  activeOpacity={0.7}
                >
                  <Text style={styles.depositText}>
                    {responding ? '...' : 'Use Deposit'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {mySplit && mySplit.status !== 'pending' && (
              <View style={styles.resolvedBadge}>
                <Text style={styles.resolvedText}>
                  {mySplit.status === 'accumulated' ? 'Accumulated' : 'Deposit Used'}
                </Text>
              </View>
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
    marginBottom: 4,
  },
  accumulatedLabel: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: '#888888',
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 18,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accumulateButton: {
    backgroundColor: '#FFFBE6',
  },
  accumulateText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#FFCC00',
  },
  depositButton: {
    backgroundColor: '#34C759',
  },
  depositText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    color: '#003310',
  },
  resolvedBadge: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resolvedText: {
    fontFamily: 'OpenSans-Bold',
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
