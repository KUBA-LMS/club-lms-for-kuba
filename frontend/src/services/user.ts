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

export async function getFriendRequests(): Promise<FriendRequestListResponse> {
  const response = await api.get<FriendRequestListResponse>(
    '/users/me/friend-requests',
  );
  return response.data;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.post(`/users/me/friend-requests/${requestId}/accept`);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await api.post(`/users/me/friend-requests/${requestId}/reject`);
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

// --- Deposits ---

export interface DepositItem {
  id: string;
  balance: number;
  club_id: string;
  club_name: string;
}

export interface DepositTransaction {
  id: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface DepositTransactionListResponse {
  data: DepositTransaction[];
  total: number;
  page: number;
  limit: number;
}

export async function getMyDeposits(): Promise<DepositItem[]> {
  const response = await api.get<DepositItem[]>('/deposits/me');
  return response.data;
}

export async function getDepositTransactions(
  depositId: string,
  page = 1,
  limit = 20,
): Promise<DepositTransactionListResponse> {
  const response = await api.get<DepositTransactionListResponse>(
    `/deposits/${depositId}/transactions`,
    { params: { page, limit } },
  );
  return response.data;
}
