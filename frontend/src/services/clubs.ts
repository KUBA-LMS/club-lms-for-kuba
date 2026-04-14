import api from './api';

export interface SubgroupBrief {
  id: string;
  name: string;
  logo_image: string | null;
  role: string | null;
}

export interface MyGroup {
  id: string;
  name: string;
  logo_image: string | null;
  role: string;
  subgroups: SubgroupBrief[];
}

export async function getMyGroups(): Promise<MyGroup[]> {
  const response = await api.get<MyGroup[]>('/clubs/me');
  return response.data;
}

export async function createGroup(
  name: string,
  logoImage?: string | null,
  parentId?: string | null,
): Promise<void> {
  await api.post('/clubs/', {
    name,
    logo_image: logoImage || null,
    parent_id: parentId || null,
  });
}

export async function joinGroup(
  clubId: string,
  role: string = 'member',
): Promise<{ message: string; club: { id: string; name: string } }> {
  const response = await api.post(`/clubs/${clubId}/join?role=${role}`);
  return response.data;
}

export async function leaveGroup(clubId: string): Promise<void> {
  await api.delete(`/clubs/${clubId}/leave`);
}

export interface DeletedClub {
  id: string;
  name: string;
  logo_image: string | null;
  parent_id: string | null;
  deleted_at: string;
  restorable_until: string;
}

export interface DeleteClubResponse {
  id: string;
  deleted_at: string;
  restorable_until: string;
}

export async function deleteGroup(clubId: string): Promise<DeleteClubResponse> {
  const response = await api.delete<DeleteClubResponse>(`/clubs/${clubId}`);
  return response.data;
}

export async function restoreGroup(
  clubId: string,
): Promise<{ id: string; name: string; restored: boolean }> {
  const response = await api.post<{ id: string; name: string; restored: boolean }>(
    `/clubs/${clubId}/restore`,
  );
  return response.data;
}

export async function getDeletedGroups(): Promise<DeletedClub[]> {
  const response = await api.get<DeletedClub[]>('/clubs/me/deleted');
  return response.data;
}
