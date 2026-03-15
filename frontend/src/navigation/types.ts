import { NativeStackScreenProps } from '@react-navigation/native-stack';

// SignUp flow data structure
export interface SignUpData {
  username: string;
  name: string;
  profileImage?: string;
  studentId: string;
  nationality: string;
  gender: string;
  password: string;
}

export type AuthStackParamList = {
  Login: undefined;
  SignUpStep1: undefined;
  SignUpStep2: { username: string; name: string };
  SignUpStep3: { username: string; name: string; profileImage?: string };
  SignUpStep4: { username: string; name: string; profileImage?: string; studentId: string; nationality: string; gender: string };
  SignUpStep5: { username: string; name: string; profileImage?: string; studentId: string; nationality: string; gender: string; password: string };
  ForgotPassword: undefined;
};

// Event form data structure for admin
export interface EventFormData {
  title: string;
  event_date: Date;
  event_location: string;
  event_type: 'official' | 'private';
  cost_type: 'free' | 'prepaid' | 'one_n';
  cost_amount?: number;
  registration_start: Date;
  registration_end: Date;
  max_slots: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  detail_address?: string;
  related_event_id?: string;
  club_id: string;
  visibility_type?: 'friends_only' | 'club';
  visibility_club_id?: string;
  poster_uri?: string;
  photo_uris?: string[];
}

// Main Stack (contains tabs and detail screens)
export type MainStackParamList = {
  Home: undefined;
  EventDetail: { eventId: string };
  ProviderDetail: { providerId: string };
  OnePass: { eventId?: string };
  // Community / Chat screens
  Community: undefined;
  CreateGroupChat: undefined;
  ChatRoom: { chatId: string };
  // Profile (stack-level, slide from right)
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  // Admin screens
  AdminCreateEvent: undefined;
  AdminUploadPoster: { eventData: Partial<EventFormData> };
  AccessControl: undefined;
  AdminHub: undefined;
  AdminHubSubgroupDetail: { clubId: string; subgroupId: string; subgroupName: string };
  AdminHubMemberDetail: { clubId: string; adminUserId: string; adminUsername: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Splash: undefined;
};

// Screen props types
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpStep1ScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUpStep1'>;
export type SignUpStep2ScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUpStep2'>;
export type SignUpStep3ScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUpStep3'>;
export type SignUpStep4ScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUpStep4'>;
export type SignUpStep5ScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUpStep5'>;
