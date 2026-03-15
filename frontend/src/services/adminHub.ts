import api from './api';

// --- Types ---

export interface DepositTransactionInfo {
  id: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface AdminMemberDeposit {
  deposit_id: string | null;
  balance: number;
  recent_transactions: DepositTransactionInfo[];
}

export interface AdminMember {
  id: string;
  username: string;
  legal_name: string | null;
  student_id: string | null;
  profile_image: string | null;
  nationality: string | null;
  gender: string | null;
  club_role: string;
  is_admin: boolean;
  deposit: AdminMemberDeposit;
}

export interface AdminMemberListResponse {
  data: AdminMember[];
  total: number;
  page: number;
  limit: number;
}

export interface CommonGroupInfo {
  id: string;
  name: string;
  logo_image: string | null;
}

export interface SearchNonMember {
  id: string;
  username: string;
  legal_name: string | null;
  profile_image: string | null;
  common_groups: CommonGroupInfo[];
}

export interface SearchNonMemberListResponse {
  data: SearchNonMember[];
  total: number;
}

export interface LeadInfo {
  id: string;
  username: string;
  profile_image: string | null;
}

export interface SubgroupCard {
  id: string;
  name: string;
  logo_image: string | null;
  member_count: number;
  admin_count: number;
  normal_count: number;
  leads: LeadInfo[];
}

export interface AdminOrganization {
  my_profile: {
    id: string;
    username: string;
    legal_name: string | null;
    student_id: string | null;
    profile_image: string | null;
  };
  supervisor_names: string[];
  lead_name: string | null;
  stats: {
    subgroups: number;
    admins: number;
    normal_users: number;
  };
  subgroups: SubgroupCard[];
}

export interface SubgroupMember {
  id: string;
  username: string;
  profile_image: string | null;
  is_admin: boolean;
  club_role: string;
  deposit_balance: number;
  managed_member_count?: number;
  managed_admin_count?: number;
  managed_normal_count?: number;
}

export interface SubgroupMemberListResponse {
  data: SubgroupMember[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminEvent {
  id: string;
  title: string;
  images: string[];
  event_date: string;
  event_type: string;
  cost_type: string;
  cost_amount: number | null;
  status: string;
  registration_count: number;
  max_slots: number;
  event_location: string | null;
}

export interface AdminEventListResponse {
  upcoming: AdminEvent[];
  past: AdminEvent[];
}

export interface AdminTask {
  registration_id: string;
  user: {
    id: string;
    username: string;
    profile_image: string | null;
  };
  event: {
    id: string;
    title: string;
    event_date: string;
    event_type: string;
    cost_type: string;
  };
  status: string;
  timeout_seconds: number;
  created_at: string;
}

export interface AdminTaskListResponse {
  current: AdminTask[];
  history: AdminTask[];
}

// --- Member Management ---

export async function getClubMembers(
  clubId: string,
  page = 1,
  limit = 20,
): Promise<AdminMemberListResponse> {
  const response = await api.get<AdminMemberListResponse>(
    `/admin/clubs/${clubId}/members`,
    { params: { page, limit } },
  );
  return response.data;
}

export async function toggleAdminRole(
  clubId: string,
  userId: string,
): Promise<{ is_admin: boolean }> {
  const response = await api.put(`/admin/clubs/${clubId}/members/${userId}/admin-toggle`);
  return response.data;
}

export async function toggleLeadRole(
  clubId: string,
  userId: string,
): Promise<{ club_role: string }> {
  const response = await api.put(`/admin/clubs/${clubId}/members/${userId}/lead-toggle`);
  return response.data;
}

export async function removeMember(
  clubId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/admin/clubs/${clubId}/members/${userId}`);
}

export async function adjustDeposit(
  clubId: string,
  userId: string,
  amount: number,
  description: string,
): Promise<{ deposit_id: string; balance: number; transaction_id: string }> {
  const response = await api.post(`/admin/clubs/${clubId}/members/${userId}/deposit`, {
    amount,
    description,
  });
  return response.data;
}

export async function getMemberTransactions(
  clubId: string,
  userId: string,
  page = 1,
  limit = 20,
): Promise<{ data: DepositTransactionInfo[]; total: number }> {
  const response = await api.get(
    `/admin/clubs/${clubId}/members/${userId}/deposit/transactions`,
    { params: { page, limit } },
  );
  return response.data;
}

// --- Member Search ---

export async function searchNonMembers(
  clubId: string,
  query: string,
  limit = 20,
): Promise<SearchNonMemberListResponse> {
  const response = await api.get<SearchNonMemberListResponse>(
    `/admin/clubs/${clubId}/search-non-members`,
    { params: { query, limit } },
  );
  return response.data;
}

export async function addMemberToClub(
  clubId: string,
  userId: string,
): Promise<void> {
  await api.post(`/admin/clubs/${clubId}/members/${userId}`);
}

// --- Organization ---

export async function getOrganization(clubId: string): Promise<AdminOrganization> {
  const response = await api.get<AdminOrganization>(`/admin/clubs/${clubId}/organization`);
  return response.data;
}

export async function getSubgroupMembers(
  clubId: string,
  subgroupId: string,
  page = 1,
  limit = 50,
): Promise<SubgroupMemberListResponse> {
  const response = await api.get<SubgroupMemberListResponse>(
    `/admin/clubs/${clubId}/subgroups/${subgroupId}/members`,
    { params: { page, limit } },
  );
  return response.data;
}

// --- Event Management ---

export async function getClubEvents(clubId: string): Promise<AdminEventListResponse> {
  const response = await api.get<AdminEventListResponse>(`/admin/clubs/${clubId}/events`);
  return response.data;
}

// --- Task Management ---

export async function getClubTasks(
  clubId: string,
  search?: string,
): Promise<AdminTaskListResponse> {
  const response = await api.get<AdminTaskListResponse>(
    `/admin/clubs/${clubId}/tasks`,
    { params: search ? { search } : undefined },
  );
  return response.data;
}

export async function approveRegistration(
  registrationId: string,
): Promise<{ message: string }> {
  const response = await api.post(`/admin/registrations/${registrationId}/approve`);
  return response.data;
}

export async function declineRegistration(
  registrationId: string,
): Promise<{ message: string }> {
  const response = await api.post(`/admin/registrations/${registrationId}/decline`);
  return response.data;
}

// --- CSV Export ---

export async function exportEventCsv(eventId: string): Promise<string> {
  const response = await api.get(`/admin/events/${eventId}/export-csv`, {
    responseType: 'text',
  });
  return response.data as string;
}
