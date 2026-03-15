import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { MainStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useChatRoom } from '../../hooks/useChat';
import { Message, TicketBrief } from '../../types/chat';
import * as chatApi from '../../services/chat';

import ChatHeader from '../../components/chat/ChatHeader';
import MessageBubble from '../../components/chat/MessageBubble';
import GiftTicketBubble from '../../components/chat/GiftTicketBubble';
import TicketDeliveredBubble from '../../components/chat/TicketDeliveredBubble';
import RequestSplitBubble from '../../components/chat/RequestSplitBubble';
import SplitCompletedBubble from '../../components/chat/SplitCompletedBubble';
import ChatMessageBar from '../../components/chat/ChatMessageBar';
import TransferTicketModal from '../../components/chat/TransferTicketModal';
import RequestSplitModal from '../../components/chat/RequestSplitModal';
import PaymentDetailSheet from '../../components/chat/PaymentDetailSheet';

type ScreenRouteProp = RouteProp<MainStackParamList, 'ChatRoom'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { chatId } = route.params;
  const { user } = useAuth();
  const userId = (user as { id?: string } | null)?.id || '';

  const {
    chat,
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    hasMore,
    sendMessage,
    loadMore,
    setMessages,
    getUnreadCount,
    paymentUpdateSignal,
  } = useChatRoom(chatId);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const paymentSheetRef = useRef<BottomSheetModal>(null);

  const isGroup = chat ? chat.type === 'group' || chat.type === 'event' : false;

  const handleTransferTicket = useCallback(
    async (ticket: TicketBrief) => {
      if (!chat) return;
      const otherMembers = chat.members.filter((m) => m.id !== userId);
      if (otherMembers.length === 0) return;

      setShowTicketModal(false);
      try {
        const msg = await chatApi.transferTicket(chatId, ticket.id, otherMembers[0].id);
        setMessages((prev) => [...prev, { ...msg, status: 'sent' as const }]);
      } catch (err) {
        console.error('[CHAT] transferTicket failed:', err);
      }
    },
    [chat, chatId, userId, setMessages],
  );

  const handleRequestSplit = useCallback(
    async (amount: number, participantIds: string[]) => {
      setShowSplitModal(false);
      try {
        const msg = await chatApi.createPaymentRequest(chatId, amount, participantIds);
        setMessages((prev) => [...prev, { ...msg, status: 'sent' as const }]);
      } catch (err: unknown) {
        const apiErr = err as { detail?: string; status_code?: number };
        if (apiErr.status_code === 400 && apiErr.detail?.includes('bank account')) {
          Alert.alert(
            'Bank Account Required',
            'You need to register a bank account before requesting a payment split. Would you like to set it up now?',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: () => navigation.navigate('Settings'),
              },
            ],
          );
        } else {
          Alert.alert('Error', apiErr.detail || 'Failed to create payment request');
        }
      }
    },
    [chatId, setMessages, navigation],
  );

  const handleOpenPaymentDetail = useCallback((paymentRequestId: string) => {
    setSelectedPaymentRequestId(paymentRequestId);
    paymentSheetRef.current?.present();
  }, []);

  const shouldShowAvatar = useCallback(
    (message: Message, index: number): boolean => {
      if (message.sender.id === userId) return false;
      if (index === 0) return true;
      const prev = messages[index - 1];
      return prev.sender.id !== message.sender.id;
    },
    [messages, userId],
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isOwn = item.sender.id === userId;
      const showAvatar = shouldShowAvatar(item, index);
      const unreadCount = getUnreadCount(item);

      switch (item.type) {
        case 'ticket':
          return (
            <GiftTicketBubble
              message={item}
              isOwn={isOwn}
              showAvatar={showAvatar}
              unreadCount={unreadCount}
            />
          );
        case 'ticket_delivered':
          return (
            <TicketDeliveredBubble
              message={item}
              isOwn={isOwn}
              unreadCount={unreadCount}
            />
          );
        case 'payment_request':
          return (
            <RequestSplitBubble
              message={item}
              isOwn={isOwn}
              currentUserId={userId}
              unreadCount={unreadCount}
              paymentUpdateSignal={paymentUpdateSignal}
              onOpenDetail={handleOpenPaymentDetail}
            />
          );
        case 'payment_completed':
          return (
            <SplitCompletedBubble
              message={item}
              isOwn={isOwn}
              unreadCount={unreadCount}
            />
          );
        default:
          return (
            <MessageBubble
              message={item}
              isOwn={isOwn}
              showAvatar={showAvatar}
              unreadCount={unreadCount}
            />
          );
      }
    },
    [userId, shouldShowAvatar, getUnreadCount, paymentUpdateSignal, handleOpenPaymentDetail],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#8E8E93" />
      </View>
    );
  }

  return (
    <BottomSheetModalProvider>
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ChatHeader
        members={chat?.members || []}
        currentUserId={userId}
        chatName={chat?.name || null}
        isGroup={isGroup}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.clientId || item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        inverted={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color="#8E8E93" style={{ paddingVertical: 10 }} />
          ) : null
        }
        onContentSizeChange={() => {
          // Auto scroll to bottom on new messages
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      <View style={{ paddingBottom: insets.bottom }}>
        <ChatMessageBar
          onSend={sendMessage}
          onTransferTicket={() => setShowTicketModal(true)}
          onRequestSplit={() => setShowSplitModal(true)}
          isSending={isSending}
        />
      </View>

      <TransferTicketModal
        visible={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSelect={handleTransferTicket}
      />

      {chat && (
        <RequestSplitModal
          visible={showSplitModal}
          members={chat.members}
          currentUserId={userId}
          onClose={() => setShowSplitModal(false)}
          onProceed={handleRequestSplit}
        />
      )}

      <PaymentDetailSheet
        ref={paymentSheetRef}
        paymentRequestId={selectedPaymentRequestId}
        currentUserId={userId}
        onClose={() => setSelectedPaymentRequestId(null)}
      />
    </KeyboardAvoidingView>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 10,
  },
});
