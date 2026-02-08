import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import { User } from '../types/auth';

/**
 * Secure token storage service.
 * Uses AsyncStorage for React Native.
 * In production, consider using expo-secure-store for sensitive data.
 */

export const storage = {
  // Access Token
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(config.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(config.ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  },

  async removeAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(config.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing access token:', error);
    }
  },

  // Refresh Token
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(config.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(config.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  },

  async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(config.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing refresh token:', error);
    }
  },

  // User
  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(config.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(config.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(config.USER_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        config.ACCESS_TOKEN_KEY,
        config.REFRESH_TOKEN_KEY,
        config.USER_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },
};

export default storage;
