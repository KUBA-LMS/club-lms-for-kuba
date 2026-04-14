import api from './api';
import {
  ScanResponse,
  ParticipantsListResponse,
  OverrideResponse,
  UserSearchItem,
} from '../types/accessControl';

export async function getParticipants(
  eventId: string,
  statusFilter?: string,
): Promise<ParticipantsListResponse> {
  const params: Record<string, string> = {};
  if (statusFilter) params.status_filter = statusFilter;
  const response = await api.get<ParticipantsListResponse>(
    `/access-control/${eventId}/participants`,
    { params },
  );
  return response.data;
}

export async function scanBarcode(
  eventId: string,
  barcode: string,
): Promise<ScanResponse> {
  const response = await api.post<ScanResponse>(
    `/access-control/${eventId}/scan`,
    { barcode },
  );
  return response.data;
}

export async function overrideRegistration(
  eventId: string,
  registrationId: string,
): Promise<OverrideResponse> {
  const response = await api.post<OverrideResponse>(
    `/access-control/${eventId}/override/${registrationId}`,
  );
  return response.data;
}

export async function searchUsers(
  clubId: string,
  query: string,
): Promise<UserSearchItem[]> {
  const response = await api.get<UserSearchItem[]>(
    '/access-control/users/search',
    { params: { club_id: clubId, q: query } },
  );
  return response.data;
}

export async function walkInRegister(
  eventId: string,
  userId: string,
): Promise<OverrideResponse> {
  const response = await api.post<OverrideResponse>(
    `/access-control/${eventId}/walk-in`,
    { user_id: userId },
  );
  return response.data;
}
