/**
 * Event-related types matching backend schemas
 */

import { UserBrief } from './auth';

export type EventType = 'official' | 'private';
export type CostType = 'free' | 'prepaid' | 'one_n';
export type UserRegistrationStatus = 'registered' | 'visited' | 'open' | 'requested' | 'closed' | 'upcoming';

export interface ClubBrief {
  id: string;
  name: string;
  logo_image: string | null;
}

export type VisibilityType = 'friends_only' | 'club';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  event_type: EventType;
  cost_type: CostType;
  cost_amount: number | null;
  bank_name: string | null;
  bank_account_number: string | null;
  account_holder_name: string | null;
  registration_start: string;
  registration_end: string;
  event_date: string;
  event_location: string | null;
  latitude: number | null;
  longitude: number | null;
  max_slots: number;
  current_slots: number;
  visibility_type: VisibilityType | null;
  visibility_club_id: string | null;
  related_event_id: string | null;
  provided_by: UserBrief;
  posted_by: UserBrief;
  club: ClubBrief;
  created_at: string;
  updated_at: string;
}

export interface EventWithStatus extends Event {
  user_status: UserRegistrationStatus;
  user_registration_id: string | null;
  payment_deadline: string | null;
  participants_preview: UserBrief[];
  is_bookmarked: boolean;
}

export interface EventListResponse {
  data: EventWithStatus[];
  total: number;
  page: number;
  limit: number;
}

export interface RegistrationCreate {
  event_id: string;
}

export interface Registration {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  payment_status: 'pending' | 'completed' | 'refunded';
  checked_in_at: string | null;
  user: UserBrief;
  event: {
    id: string;
    title: string;
    event_date: string;
    event_type: EventType;
    cost_type: CostType;
    images: string[];
    current_slots: number;
    max_slots: number;
  };
  created_at: string;
  updated_at: string;
}

export interface RegistrationListResponse {
  data: Registration[];
  total: number;
  page: number;
  limit: number;
}
