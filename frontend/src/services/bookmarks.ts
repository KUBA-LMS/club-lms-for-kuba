import api from './api';

export interface BookmarkToggleResponse {
  bookmarked: boolean;
}

export interface BookmarkedEvent {
  id: string;
  event: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type: string;
    cost_type: string;
    images: string[];
    current_slots: number;
    max_slots: number;
    latitude: number | null;
    longitude: number | null;
  };
  created_at: string;
}

export interface BookmarkListResponse {
  data: BookmarkedEvent[];
  total: number;
  page: number;
  limit: number;
}

export async function toggleBookmark(eventId: string): Promise<BookmarkToggleResponse> {
  const response = await api.post<BookmarkToggleResponse>('/bookmarks/', { event_id: eventId });
  return response.data;
}

export async function listBookmarks(page = 1, limit = 20): Promise<BookmarkListResponse> {
  const response = await api.get<BookmarkListResponse>('/bookmarks/', { params: { page, limit } });
  return response.data;
}
