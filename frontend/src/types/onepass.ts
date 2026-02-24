export interface OnePassEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'official' | 'private';
  cost_type: 'free' | 'prepaid' | 'one_n';
  images: string[];
  current_slots: number;
  max_slots: number;
}

export interface OnePassTicket {
  id: string;
  barcode: string;
  is_used: boolean;
  used_at: string | null;
  registration_id: string;
  registration_status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  event: OnePassEvent;
  created_at: string;
  updated_at: string;
}

export interface OnePassListResponse {
  data: OnePassTicket[];
  total: number;
}

export type OnePassScreenState =
  | 'auto_selection'
  | 'viewing_ticket'
  | 'checked_in';
