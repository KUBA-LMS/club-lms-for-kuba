export type GenderType = 'male' | 'female' | 'other';

export interface User {
  id: string;
  username: string;
  legal_name: string;
  email?: string;
  student_id?: string;
  nationality?: string;
  gender?: GenderType;
  profile_image?: string;
  role: 'member' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBrief {
  id: string;
  username: string;
  profile_image?: string;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface SignUpRequest {
  username: string;
  legal_name: string;
  password: string;
  profile_image?: string;
  student_id?: string;
  nationality?: string;
  gender?: GenderType;
}

export interface SignUpResponse extends User {}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface AuthState {
  user: User | UserBrief | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
