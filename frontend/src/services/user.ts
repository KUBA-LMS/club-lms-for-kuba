import api from './api';
import { User, GenderType } from '../types/auth';

export interface UserUpdateData {
  username?: string;
  legal_name?: string;
  email?: string;
  student_id?: string;
  nationality?: string;
  gender?: GenderType;
}

export interface RegistrationItem {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  payment_status: 'pending' | 'completed' | 'refunded';
  checked_in_at?: string;
  user: {
    id: string;
    username: string;
    profile_image?: string;
  };
  event: {
    id: string;
    title: string;
    event_date: string;
    event_type: string;
    cost_type: string;
    images: string[];
    current_slots: number;
    max_slots: number;
  };
  created_at: string;
  updated_at: string;
}

export interface RegistrationListResponse {
  data: RegistrationItem[];
  total: number;
  page: number;
  limit: number;
}

export async function updateProfile(data: UserUpdateData): Promise<User> {
  const response = await api.put<User>('/users/me', data);
  return response.data;
}

export async function getMyRegistrations(
  page = 1,
  limit = 20,
  status?: string,
): Promise<RegistrationListResponse> {
  const params: Record<string, string | number> = { page, limit };
  if (status) params.status = status;
  const response = await api.get<RegistrationListResponse>('/registrations/', {
    params,
  });
  return response.data;
}

// --- Friend types ---

export interface ClubBrief {
  id: string;
  name: string;
  logo_image: string | null;
}

export interface UserSearchItem {
  id: string;
  username: string;
  profile_image: string | null;
  is_friend: boolean;
  request_status: 'sent' | 'received' | null;
  request_id: string | null;
  common_clubs: ClubBrief[];
}

export interface UserFriendItem {
  id: string;
  username: string;
  profile_image: string | null;
  common_clubs: ClubBrief[];
}

export interface UserSearchListResponse {
  data: UserSearchItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFriendListResponse {
  data: UserFriendItem[];
  total: number;
  page: number;
  limit: number;
}

// --- Friend API ---

export async function searchUsers(
  q: string,
  page = 1,
  limit = 20,
): Promise<UserSearchListResponse> {
  const response = await api.get<UserSearchListResponse>('/users/search', {
    params: { q, page, limit },
  });
  return response.data;
}

export async function getFriends(
  q?: string,
  page = 1,
  limit = 50,
): Promise<UserFriendListResponse> {
  const params: Record<string, string | number> = { page, limit };
  if (q) params.q = q;
  const response = await api.get<UserFriendListResponse>('/users/me/friends', {
    params,
  });
  return response.data;
}

export async function sendFriendRequest(
  userId: string,
): Promise<{ message: string; request_id: string }> {
  const response = await api.post<{ message: string; request_id: string }>(
    `/users/me/friends/${userId}`,
  );
  return response.data;
}

export async function removeFriend(friendId: string): Promise<void> {
  await api.delete(`/users/me/friends/${friendId}`);
}

// --- Friend request types ---

export interface UserBrief {
  id: string;
  username: string;
  profile_image: string | null;
}

export interface FriendRequestItem {
  id: string;
  from_user: UserBrief;
  to_user: UserBrief;
  status: 'pending' | 'accepted' | 'rejected';
  common_clubs: ClubBrief[];
  created_at: string;
}

export interface FriendRequestListResponse {
  data: FriendRequestItem[];
  total: number;
}

// --- Friend request API ---

export type FriendRequestDirection = 'received' | 'sent';

export async function getFriendRequests(
  direction: FriendRequestDirection = 'received',
): Promise<FriendRequestListResponse> {
  const response = await api.get<FriendRequestListResponse>(
    '/users/me/friend-requests',
    { params: { direction } },
  );
  return response.data;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.post(`/users/me/friend-requests/${requestId}/accept`);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await api.post(`/users/me/friend-requests/${requestId}/reject`);
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await api.delete(`/users/me/friend-requests/${requestId}`);
}

// --- My Clubs ---

export interface MyClubItem {
  id: string;
  name: string;
  logo_image: string | null;
}

export async function getMyClubs(): Promise<MyClubItem[]> {
  const response = await api.get<MyClubItem[]>('/clubs/me');
  return response.data;
}

// --- Bank Account ---

export interface BankAccountData {
  bank_name: string;
  bank_account_number: string;
  account_holder_name: string;
}

export interface BankAccountResponse {
  bank_name: string | null;
  bank_account_number: string | null;
  account_holder_name: string | null;
}

export async function getBankAccount(): Promise<BankAccountResponse> {
  const response = await api.get<BankAccountResponse>('/users/me/bank-account');
  return response.data;
}

export async function updateBankAccount(data: BankAccountData): Promise<BankAccountResponse> {
  const response = await api.put<BankAccountResponse>('/users/me/bank-account', data);
  return response.data;
}

export async function deleteBankAccount(): Promise<void> {
  await api.delete('/users/me/bank-account');
}

// --- Settlement History ---

export interface SettlementHistoryItem {
  id: string;
  payment_request_id: string;
  chat_id: string;
  chat_name: string | null;
  direction: 'sent' | 'received';
  counterpart: {
    id: string;
    username: string;
    profile_image: string | null;
  };
  amount: number;
  status: string;
  created_at: string;
}

export interface SettlementHistoryResponse {
  data: SettlementHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getSettlementHistory(
  page = 1,
  limit = 20,
): Promise<SettlementHistoryResponse> {
  const response = await api.get<SettlementHistoryResponse>(
    '/payments/payments/settlement-history',
    { params: { page, limit } },
  );
  return response.data;
}
