import api from './api';
import { storage } from './storage';
import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth';

/**
 * Authentication service for login, signup, and token management.
 */

export const authService = {
  /**
   * Login with email and password.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { access_token, refresh_token, user } = response.data;

    // Store tokens and user
    await storage.setAccessToken(access_token);
    await storage.setRefreshToken(refresh_token);
    await storage.setUser(user);

    return response.data;
  },

  /**
   * Register a new user.
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post<SignUpResponse>('/auth/signup', data);
    return response.data;
  },

  /**
   * Logout and clear stored tokens.
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      await storage.clearAuth();
    }
  },

  /**
   * Get current user profile.
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    await storage.setUser(response.data);
    return response.data;
  },

  /**
   * Request password reset email.
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token.
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Change password for authenticated user.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * Delete current user's account.
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
    await storage.clearAuth();
  },

  /**
   * Check if user is authenticated (has valid token).
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAccessToken();
    if (!token) return false;

    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get stored auth data.
   */
  async getStoredAuth(): Promise<{
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [user, accessToken, refreshToken] = await Promise.all([
      storage.getUser(),
      storage.getAccessToken(),
      storage.getRefreshToken(),
    ]);
    return { user, accessToken, refreshToken };
  },
};

export default authService;
