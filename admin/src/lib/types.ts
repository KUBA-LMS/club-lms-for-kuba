export interface UserInfo {
  id: string;
  username: string;
  legal_name: string;
  email: string | null;
  student_id: string | null;
  profile_image: string | null;
  role: "member" | "admin" | "superadmin";
  is_active: boolean;
  created_at: string | null;
}

export interface ClubInfo {
  id: string;
  name: string;
  description: string | null;
  university: string | null;
  logo_image: string | null;
  parent_id: string | null;
  member_count: number;
  subgroup_count: number;
  created_at: string | null;
}

export interface DashboardStats {
  total_users: number;
  total_clubs: number;
  total_events: number;
  pending_registrations: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RecentRegistration {
  id: string;
  username: string;
  event: string;
  status: string;
  created_at: string | null;
}

export interface WeeklyActivity {
  day: string;
  count: number;
  date: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserInfo;
}
