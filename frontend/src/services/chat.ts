/**
 * Chat API service
 */

import api from './api';
import {
  Chat,
  ChatType,
  ChatListResponse,
  Message,
  MessageListResponse,
  PaymentRequest,
  TicketBrief,
} from '../types/chat';

/**
 * Create a new chat (DM or group)
 */
export async function createChat(params: {
  type: ChatType;
  name?: string;
  member_ids: string[];
  event_id?: string;
}): Promise<Chat> {
  const response = await api.post<Chat>('/chats/', params);
  return response.data;
}

/**
 * Search users by username
 */
export async function searchUsers(
  query: string,
): Promise<{ data: { id: string; username: string; profile_image: string | null }[]; total: number }> {
  const response = await api.get('/users/', { params: { q: query, limit: 20 } });
  return response.data;
}

/**
 * List current user's chats. Optionally filter by club_id (includes subgroups).
 */
export async function listChats(clubId?: string): Promise<ChatListResponse> {
  const params: Record<string, string> = {};
  if (clubId) params.club_id = clubId;
  const response = await api.get<ChatListResponse>('/chats/', { params });
  return response.data;
}

/**
 * Get a single chat with members
 */
export async function getChat(chatId: string): Promise<Chat> {
  const response = await api.get<Chat>(`/chats/${chatId}`);
  return response.data;
}

/**
 * Get paginated messages for a chat
 */
export async function getChatMessages(
  chatId: string,
  params: { page?: number; limit?: number } = {},
): Promise<MessageListResponse> {
  const response = await api.get<MessageListResponse>(`/chats/${chatId}/messages`, { params });
  return response.data;
}

/**
 * Send a message (defaults to text)
 */
export async function sendMessage(
  chatId: string,
  content: string,
  type: 'text' | 'event_share' = 'text',
): Promise<Message> {
  const response = await api.post<Message>(`/chats/${chatId}/messages`, {
    content,
    type,
  });
  return response.data;
}

/**
 * Mark a chat as read (debounce on caller side)
 */
export async function markChatRead(chatId: string): Promise<void> {
  await api.post(`/chats/${chatId}/read`);
}

/**
 * Transfer a ticket to another user via chat
 */
export async function transferTicket(
  chatId: string,
  ticketId: string,
  recipientId: string,
): Promise<Message> {
  const response = await api.post<Message>(`/chats/${chatId}/transfer-ticket`, {
    ticket_id: ticketId,
    recipient_id: recipientId,
  });
  return response.data;
}

/**
 * Create a 1/N payment request in a chat
 */
export async function createPaymentRequest(
  chatId: string,
  totalAmount: number,
  participantIds: string[],
): Promise<Message> {
  const response = await api.post<Message>(`/payments/chats/${chatId}/payment-request`, {
    total_amount: totalAmount,
    participant_ids: participantIds,
  });
  return response.data;
}

/**
 * Mark a payment split as sent (participant transferred money externally)
 */
export async function markSplitSent(
  splitId: string,
): Promise<{ id: string; amount: number; status: string }> {
  const response = await api.post(`/payments/payment-splits/${splitId}/mark-sent`);
  return response.data;
}

/**
 * Confirm a payment split (requester received the money)
 */
export async function confirmSplit(
  splitId: string,
): Promise<{ id: string; amount: number; status: string }> {
  const response = await api.post(`/payments/payment-splits/${splitId}/confirm`);
  return response.data;
}

/**
 * Get a payment request with all splits
 */
export async function getPaymentRequest(requestId: string): Promise<PaymentRequest> {
  const response = await api.get<PaymentRequest>(`/payments/payment-requests/${requestId}`);
  return response.data;
}

/**
 * Get current user's tickets (for transfer)
 */
export async function getMyTickets(): Promise<{ data: TicketBrief[]; total: number }> {
  const response = await api.get<{ data: TicketBrief[]; total: number }>('/tickets/', {
    params: { limit: 100 },
  });
  return response.data;
}
