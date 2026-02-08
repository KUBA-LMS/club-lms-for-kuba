/**
 * Events API service
 */

import api from './api';
import {
  EventWithStatus,
  EventListResponse,
  Registration,
  RegistrationListResponse,
} from '../types/event';

export type EventFilter = 'upcoming' | 'past' | 'all';
export type EventTypeFilter = 'official' | 'private';

interface ListEventsParams {
  page?: number;
  limit?: number;
  filter?: EventFilter;
  event_type?: EventTypeFilter;
  club_id?: string;
  search?: string;
}

/**
 * List events with filtering and pagination
 */
export async function listEvents(params: ListEventsParams = {}): Promise<EventListResponse> {
  const response = await api.get<EventListResponse>('/events/', { params });
  return response.data;
}

/**
 * Get event details with user's registration status
 */
export async function getEvent(eventId: string): Promise<EventWithStatus> {
  const response = await api.get<EventWithStatus>(`/events/${eventId}`);
  return response.data;
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string): Promise<Registration> {
  const response = await api.post<Registration>('/registrations/', {
    event_id: eventId,
  });
  return response.data;
}

/**
 * Cancel a registration
 */
export async function cancelRegistration(registrationId: string): Promise<Registration> {
  const response = await api.post<Registration>(`/registrations/${registrationId}/cancel`);
  return response.data;
}

/**
 * List user's registrations
 */
export async function listMyRegistrations(params: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
} = {}): Promise<RegistrationListResponse> {
  const response = await api.get<RegistrationListResponse>('/registrations/', { params });
  return response.data;
}
