import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService } from '../services/auth';
import { storage } from '../services/storage';
import { setTokenRefreshCallback } from '../services/api';
import {
  User,
  LoginRequest,
  SignUpRequest,
  AuthState,
  ApiError,
} from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Sync accessToken state when axios interceptor refreshes the token
  useEffect(() => {
    setTokenRefreshCallback((newToken: string) => {
      setState((prev) => ({ ...prev, accessToken: newToken }));
    });
    return () => setTokenRefreshCallback(null);
  }, []);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user, accessToken, refreshToken } = await authService.getStoredAuth();

        if (accessToken && user) {
          // Verify token is still valid
          try {
            const currentUser = await authService.getCurrentUser();
            setState({
              user: currentUser,
              accessToken,
              refreshToken,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch {
            // Token invalid, clear storage
            await storage.clearAuth();
            setState({
              user: null,
              accessToken: null,
              refreshToken: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.login(credentials);
      setState({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (data: SignUpRequest) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authService.signUp(data);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } finally {
      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    signUp,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
