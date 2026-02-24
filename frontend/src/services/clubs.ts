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
): Promise<{ message: string; club: { id: string; name: string } }> {
  const response = await api.post(`/clubs/${clubId}/join`);
  return response.data;
}

export async function leaveGroup(clubId: string): Promise<void> {
  await api.delete(`/clubs/${clubId}/leave`);
}
