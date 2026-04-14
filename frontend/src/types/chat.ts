export type ChatType = 'direct' | 'group' | 'event';

export type MessageType =
  | 'text'
  | 'image'
  | 'ticket'
  | 'payment_request'
  | 'ticket_delivered'
  | 'payment_completed'
  | 'event_share';

export interface ChatMember {
  id: string;
  username: string;
  profile_image: string | null;
  last_read_at?: string | null;
}

export interface MessageBrief {
  id: string;
  content: string;
  type: MessageType;
  sender_id: string;
  created_at: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  event_id: string | null;
  club_id: string | null;
  members: ChatMember[];
  last_message: MessageBrief | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  ticket_id: string | null;
  payment_amount: number | null;
  payment_request_id: string | null;
  sender: ChatMember;
  created_at: string;
  // Client-side optimistic state
  status?: 'sending' | 'sent' | 'failed';
  clientId?: string;
}

export interface ChatListResponse {
  data: Chat[];
  total: number;
}

export interface MessageListResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentSplit {
  id: string;
  user: ChatMember;
  amount: number;
  status: 'pending' | 'sent' | 'confirmed';
  sent_at: string | null;
  confirmed_at: string | null;
}

export interface RequesterBankAccount {
  bank_name: string | null;
  bank_account_number: string | null;
  account_holder_name: string | null;
}

export interface PaymentRequest {
  id: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  requester: ChatMember;
  requester_bank: RequesterBankAccount | null;
  splits: PaymentSplit[];
  created_at: string;
}

export interface TicketBrief {
  id: string;
  barcode: string;
  is_used: boolean;
  used_at: string | null;
  registration: {
    id: string;
    status: string;
    payment_status: string;
    event_id: string;
    created_at: string;
  };
  event_title: string | null;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}
