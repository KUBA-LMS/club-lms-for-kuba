export type ScanResult =
  | 'entry_approved'
  | 'entry_denied_pending'
  | 'entry_denied_no_ticket'
  | 'double_checked_in';

export type TicketStatus = 'registered' | 'requested' | 'checked_in' | 'not_applied';

export interface ClubBrief {
  id: string;
  name: string;
  logo_image?: string;
}

export interface Participant {
  user_id: string;
  username: string;
  legal_name: string;
  student_id?: string;
  profile_image?: string;
  nationality?: string;
  gender?: string;
  registration_id?: string;
  registration_status?: string;
  ticket_status: TicketStatus;
  checked_in_at?: string;
  clubs: ClubBrief[];
}

export interface ScanResponse {
  result: ScanResult;
  message: string;
  participant?: Participant;
}

export interface ParticipantsListResponse {
  data: Participant[];
  total: number;
  counts: Record<string, number>;
}

export interface OverrideResponse {
  success: boolean;
  message: string;
  participant?: Participant;
}

export interface EventSearchItem {
  id: string;
  title: string;
  event_date: string;
}

export interface UserSearchItem {
  id: string;
  username: string;
  legal_name: string;
  student_id?: string;
  profile_image?: string;
}
