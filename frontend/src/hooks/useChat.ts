/**
 * Chat hooks for room messaging and chat list management.
 *
 * useChatRoom: core state for a chat room (messages, send, WS, read receipts)
 * useChatList: chat list with real-time updates
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChannel, useUserChannel } from './useWebSocket';
import * as chatApi from '../services/chat';
import { Chat, Message } from '../types/chat';

// ---- Read receipt helpers ----

type MembersLastRead = Record<string, string | null>; // userId -> ISO date or null

/**
 * For a given own message, count how many OTHER members haven't read past it.
 * KakaoTalk style: DM shows "1" if unread, group shows N.
 */
function computeUnreadCount(
  message: Message,
  membersLastRead: MembersLastRead,
  currentUserId: string,
): number {
  // Only show unread indicator on own sent messages
  if (message.sender.id !== currentUserId) return 0;
  // Don't show for optimistic messages
  if (message.status === 'sending' || message.status === 'failed') return 0;

  const msgTime = message.created_at;
  let count = 0;
  for (const [uid, lastRead] of Object.entries(membersLastRead)) {
    if (uid === currentUserId) continue;
    if (!lastRead || lastRead < msgTime) {
      count++;
    }
  }
  return count;
}

// ---- useChatRoom ----

export function useChatRoom(chatId: string) {
  const { user } = useAuth();
  const userId = (user as { id?: string } | null)?.id;

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Read receipt tracking: { memberId: "2026-02-24T..." | null }
  const [membersLastRead, setMembersLastRead] = useState<MembersLastRead>({});

  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientIdCounter = useRef(0);

  // Load chat + initial messages
  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const [chatData, msgData] = await Promise.all([
        chatApi.getChat(chatId),
        chatApi.getChatMessages(chatId, { page: 1, limit: 30 }),
      ]);
      setChat(chatData);
      setMessages(msgData.data.reverse()); // oldest first for inverted list
      setPage(1);
      setHasMore(msgData.data.length >= 30);

      // Initialize membersLastRead from chat members
      const lastReadMap: MembersLastRead = {};
      for (const m of chatData.members) {
        lastReadMap[m.id] = m.last_read_at || null;
      }
      setMembersLastRead(lastReadMap);
    } catch {
      // Error handled by caller
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const msgData = await chatApi.getChatMessages(chatId, { page: nextPage, limit: 30 });
      setMessages((prev) => [...msgData.data.reverse(), ...prev]);
      setPage(nextPage);
      setHasMore(msgData.data.length >= 30);
    } catch {
      // Silently fail pagination
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, page, hasMore, isLoadingMore]);

  // Debounced read receipt
  const debouncedMarkRead = useCallback(() => {
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => {
      chatApi.markChatRead(chatId).catch(() => {});
    }, 500);
  }, [chatId]);

  // Optimistic send
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending || !userId) return;

      const clientId = `local_${Date.now()}_${clientIdCounter.current++}`;
      const optimistic: Message = {
        id: clientId,
        content: content.trim(),
        type: 'text',
        ticket_id: null,
        payment_amount: null,
        payment_request_id: null,
        sender: {
          id: userId,
          username: (user as { username?: string } | null)?.username || '',
          profile_image: (user as { profile_image?: string | null } | null)?.profile_image || null,
          last_read_at: null,
        },
        created_at: new Date().toISOString(),
        status: 'sending',
        clientId,
      };

      setMessages((prev) => [...prev, optimistic]);
      setIsSending(true);

      try {
        const saved = await chatApi.sendMessage(chatId, content.trim());
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId ? { ...saved, status: 'sent' as const, clientId } : m,
          ),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.clientId === clientId ? { ...m, status: 'failed' as const } : m)),
        );
      } finally {
        setIsSending(false);
      }
    },
    [chatId, userId, user, isSending],
  );

  // WS: real-time events on chat:{chatId} channel
  useChannel(`chat:${chatId}`, (msg) => {
    const type = msg.type as string;
    const data = (msg.data || {}) as Record<string, unknown>;

    if (type === 'new_message') {
      const senderId = data.sender_id as string | undefined;
      // Skip own messages (already rendered optimistically)
      if (senderId === userId) return;

      const incoming: Message = {
        id: data.message_id as string,
        content: data.content as string,
        type: data.message_type as Message['type'],
        ticket_id: (data.ticket_id as string) || null,
        payment_amount: (data.payment_amount as number) ?? null,
        payment_request_id: (data.payment_request_id as string) || null,
        sender: {
          id: data.sender_id as string,
          username: data.sender_username as string,
          profile_image: null,
          last_read_at: null,
        },
        created_at: data.created_at as string,
        status: 'sent',
      };

      setMessages((prev) => [...prev, incoming]);
      // Auto mark read when receiving in the room
      debouncedMarkRead();
    }

    if (type === 'read_receipt') {
      const readUserId = data.user_id as string;
      const lastReadAt = data.last_read_at as string;
      if (readUserId && lastReadAt) {
        setMembersLastRead((prev) => ({ ...prev, [readUserId]: lastReadAt }));
      }
    }
  });

  // Mark read on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      debouncedMarkRead();
    }
  }, [isLoading, messages.length, debouncedMarkRead]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (readTimerRef.current) clearTimeout(readTimerRef.current);
    };
  }, []);

  // Compute per-message unread count (memoized by dependencies)
  const getUnreadCount = useCallback(
    (message: Message): number => {
      if (!userId) return 0;
      return computeUnreadCount(message, membersLastRead, userId);
    },
    [membersLastRead, userId],
  );

  return {
    chat,
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    hasMore,
    sendMessage,
    loadMore,
    refresh: loadInitial,
    setMessages,
    getUnreadCount,
  };
}

// ---- useChatList ----

export function useChatList() {
  const { user } = useAuth();
  const currentUserId = (user as { id?: string } | null)?.id;

  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await chatApi.listChats();
      setChats(data.data);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Real-time chat list updates via user channel
  useUserChannel((msg) => {
    const type = msg.type as string;
    const data = (msg.data || {}) as Record<string, unknown>;

    if (type === 'chat_list_update') {
      const chatId = data.chat_id as string;

      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === chatId);
        if (idx === -1) {
          // New chat - refetch to get full data
          fetchChats();
          return prev;
        }

        const updated = [...prev];
        const chat = { ...updated[idx] };
        chat.last_message = {
          id: '',
          content: data.last_message as string,
          type: data.last_message_type as Message['type'],
          sender_id: '',
          created_at: data.timestamp as string,
        };
        chat.unread_count = (chat.unread_count || 0) + 1;
        chat.updated_at = data.timestamp as string;

        // Move to top
        updated.splice(idx, 1);
        updated.unshift(chat);
        return updated;
      });
    }

    if (type === 'read_receipt') {
      const chatId = data.chat_id as string;
      const readUserId = data.user_id as string;
      const lastReadAt = data.last_read_at as string;

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          // If current user read, reset unread count
          const isMyRead = readUserId === currentUserId;
          return {
            ...c,
            unread_count: isMyRead ? 0 : c.unread_count,
            members: c.members.map((m) =>
              m.id === readUserId ? { ...m, last_read_at: lastReadAt } : m,
            ),
          };
        }),
      );
    }
  });

  const markChatAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c)),
    );
  }, []);

  return { chats, isLoading, refresh: fetchChats, setChats, markChatAsRead };
}
