import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentRequest, PaymentSplit } from '../../types/chat';
import * as chatApi from '../../services/chat';

interface PaymentDetailSheetProps {
  paymentRequestId: string | null;
  currentUserId: string;
  onClose?: () => void;
}

// Korean bank name -> Toss bank code mapping
const TOSS_BANK_CODES: Record<string, string> = {
  '국민': '국민',
  '국민은행': '국민',
  'KB국민': '국민',
  '신한': '신한',
  '신한은행': '신한',
  '우리': '우리',
  '우리은행': '우리',
  '하나': '하나',
  '하나은행': '하나',
  'NH농협': '농협',
  '농협': '농협',
  '농협은행': '농협',
  '카카오뱅크': '카카오뱅크',
  '토스뱅크': '토스뱅크',
  'SC제일': 'SC제일',
  'SC제일은행': 'SC제일',
  'IBK기업': '기업',
  '기업은행': '기업',
  'IBK기업은행': '기업',
  '새마을금고': '새마을금고',
  '수협': '수협',
  '수협은행': '수협',
  '대구': '대구',
  '대구은행': '대구',
  '부산': '부산',
  '부산은행': '부산',
  '경남': '경남',
  '경남은행': '경남',
  '광주': '광주',
  '광주은행': '광주',
  '전북': '전북',
  '전북은행': '전북',
  '제주': '제주',
  '제주은행': '제주',
  '우체국': '우체국',
  '신협': '신협',
  '씨티': '씨티',
  '씨티은행': '씨티',
};

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

const PaymentDetailSheet = forwardRef<BottomSheetModal, PaymentDetailSheetProps>(
  ({ paymentRequestId, currentUserId, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['70%'], []);
    const [paymentReq, setPaymentReq] = useState<PaymentRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
      if (paymentRequestId) {
        setLoading(true);
        chatApi
          .getPaymentRequest(paymentRequestId)
          .then(setPaymentReq)
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }, [paymentRequestId]);

    // Refresh data when sheet opens with same ID
    const handleSheetChange = useCallback(
      (index: number) => {
        if (index >= 0 && paymentRequestId) {
          chatApi
            .getPaymentRequest(paymentRequestId)
            .then(setPaymentReq)
            .catch(() => {});
        }
      },
      [paymentRequestId],
    );

    const isRequester = paymentReq?.requester.id === currentUserId;
    const mySplit = paymentReq?.splits.find((s) => s.user.id === currentUserId);
    const confirmedCount = paymentReq?.splits.filter((s) => s.status === 'confirmed').length || 0;
    const totalCount = paymentReq?.splits.length || 0;
    const perPersonAmount = mySplit?.amount || (paymentReq ? paymentReq.total_amount / totalCount : 0);

    const bankInfo = paymentReq?.requester_bank;
    const hasBankInfo = bankInfo?.bank_name && bankInfo?.bank_account_number;

    const handleSendViaToss = useCallback(async () => {
      if (!hasBankInfo || !bankInfo) return;
      const bankCode = TOSS_BANK_CODES[bankInfo.bank_name || ''] || bankInfo.bank_name;
      const amount = Math.round(perPersonAmount);
      const url = `supertoss://send?amount=${amount}&bank=${encodeURIComponent(bankCode || '')}&accountNo=${bankInfo.bank_account_number}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Toss not installed', 'Please install Toss app or copy the account info manually.');
      }
    }, [hasBankInfo, bankInfo, perPersonAmount]);

    const handleCopyAccountInfo = useCallback(async () => {
      if (!bankInfo) return;
      const text = `${bankInfo.bank_name} ${bankInfo.bank_account_number} (${bankInfo.account_holder_name})`;
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Account info copied to clipboard');
    }, [bankInfo]);

    const handleOpenKakaoPay = useCallback(async () => {
      // Copy account info first, then open KakaoPay
      if (bankInfo) {
        const text = `${bankInfo.bank_name} ${bankInfo.bank_account_number} (${bankInfo.account_holder_name})`;
        await Clipboard.setStringAsync(text);
      }
      const url = 'kakaopay://';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Copied', 'Account info copied. Please open your banking app to transfer.');
      }
    }, [bankInfo]);

    const handleMarkSent = useCallback(async () => {
      if (!mySplit) return;
      setActionLoading('mark-sent');
      try {
        await chatApi.markSplitSent(mySplit.id);
        if (paymentRequestId) {
          const updated = await chatApi.getPaymentRequest(paymentRequestId);
          setPaymentReq(updated);
        }
      } catch {
        Alert.alert('Error', 'Failed to mark as sent');
      } finally {
        setActionLoading(null);
      }
    }, [mySplit, paymentRequestId]);

    const handleConfirmSplit = useCallback(
      async (splitId: string) => {
        setActionLoading(splitId);
        try {
          await chatApi.confirmSplit(splitId);
          if (paymentRequestId) {
            const updated = await chatApi.getPaymentRequest(paymentRequestId);
            setPaymentReq(updated);
          }
        } catch {
          Alert.alert('Error', 'Failed to confirm');
        } finally {
          setActionLoading(null);
        }
      },
      [paymentRequestId],
    );

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
        onChange={handleSheetChange}
        onDismiss={onClose}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8E8E93" />
          </View>
        ) : paymentReq ? (
          <BottomSheetScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          >
            {/* Header */}
            <Text style={styles.sheetTitle}>Settlement Details</Text>

            {/* Amount section */}
            <View style={styles.amountCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatAmount(paymentReq.total_amount)}</Text>
              <View style={styles.perPersonRow}>
                <Text style={styles.perPersonLabel}>Per person</Text>
                <Text style={styles.perPersonAmount}>{formatAmount(perPersonAmount)}</Text>
              </View>
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
                  {confirmedCount}/{totalCount} confirmed
                </Text>
              </View>
            </View>

            {/* Bank account info (visible to participants) */}
            {!isRequester && hasBankInfo && (
              <View style={styles.bankCard}>
                <Text style={styles.sectionTitle}>Transfer to</Text>
                <Text style={styles.bankName}>{bankInfo?.bank_name}</Text>
                <Text style={styles.accountNumber}>{bankInfo?.bank_account_number}</Text>
                <Text style={styles.holderName}>{bankInfo?.account_holder_name}</Text>
              </View>
            )}

            {/* Participant actions */}
            {!isRequester && mySplit && mySplit.status === 'pending' && (
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.tossButton}
                  onPress={handleSendViaToss}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tossButtonText}>Send via Toss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.kakaoButton}
                  onPress={handleOpenKakaoPay}
                  activeOpacity={0.7}
                >
                  <Text style={styles.kakaoButtonText}>Open KakaoPay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyAccountInfo}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyButtonText}>Copy Account Info</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.markSentButton}
                  onPress={handleMarkSent}
                  disabled={actionLoading === 'mark-sent'}
                  activeOpacity={0.7}
                >
                  {actionLoading === 'mark-sent' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.markSentText}>I've sent it</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Participant already sent */}
            {!isRequester && mySplit && mySplit.status === 'sent' && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  Waiting for confirmation from {paymentReq.requester.username}
                </Text>
              </View>
            )}

            {!isRequester && mySplit && mySplit.status === 'confirmed' && (
              <View style={[styles.statusBadge, styles.confirmedBadge]}>
                <Text style={[styles.statusBadgeText, styles.confirmedBadgeText]}>
                  Payment confirmed
                </Text>
              </View>
            )}

            {/* Participants list */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Participants</Text>
            {paymentReq.splits.map((split) => (
              <View key={split.id} style={styles.participantRow}>
                {split.user.profile_image ? (
                  <Image
                    source={{ uri: split.user.profile_image }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarEmpty]}>
                    <Text style={styles.avatarText}>
                      {split.user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {split.user.username}
                    {split.user.id === paymentReq.requester.id ? ' (Requester)' : ''}
                  </Text>
                  <Text style={styles.participantAmount}>{formatAmount(split.amount)}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(split.status) + '20' }]}>
                  <Text style={[styles.statusPillText, { color: getStatusColor(split.status) }]}>
                    {getStatusLabel(split.status)}
                  </Text>
                </View>
                {isRequester && split.status === 'sent' && split.user.id !== currentUserId && (
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleConfirmSplit(split.id)}
                    disabled={actionLoading === split.id}
                    activeOpacity={0.7}
                  >
                    {actionLoading === split.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </BottomSheetScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>Failed to load payment details</Text>
          </View>
        )}
      </BottomSheetModal>
    );
  },
);

PaymentDetailSheet.displayName = 'PaymentDetailSheet';

export default PaymentDetailSheet;

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#000000',
    marginBottom: 16,
  },
  amountCard: {
    backgroundColor: '#F8F8FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  totalLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  totalAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 32,
    color: '#000000',
    marginBottom: 8,
  },
  perPersonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  perPersonLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#8E8E93',
  },
  perPersonAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#000000',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
  bankCard: {
    backgroundColor: '#F0F6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  bankName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  accountNumber: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  holderName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  actionSection: {
    gap: 10,
    marginBottom: 8,
  },
  tossButton: {
    backgroundColor: '#0064FF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tossButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#191919',
  },
  copyButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#000000',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  markSentButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSentText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FF9500',
  },
  confirmedBadge: {
    backgroundColor: '#E8F5E9',
  },
  confirmedBadgeText: {
    color: '#34C759',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarEmpty: {
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  participantAmount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
  statusPill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
