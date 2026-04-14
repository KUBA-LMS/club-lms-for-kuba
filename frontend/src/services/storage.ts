import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import { User } from '../types/auth';

/**
 * Secure token storage service.
 * Uses AsyncStorage for React Native.
 * In production, consider using expo-secure-store for sensitive data.
 */

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_SEARCH_HISTORY = 20;

export interface SearchHistoryItem {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  timestamp: number;
}

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

  // Search History
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const json = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  },

  async addSearchHistory(item: Omit<SearchHistoryItem, 'timestamp'>): Promise<SearchHistoryItem[]> {
    try {
      const history = await this.getSearchHistory();
      const filtered = history.filter((h) => h.name !== item.name);
      const newItem: SearchHistoryItem = { ...item, timestamp: Date.now() };
      const updated = [newItem, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error adding search history:', error);
      return [];
    }
  },

  async removeSearchHistory(timestamp: number): Promise<SearchHistoryItem[]> {
    try {
      const history = await this.getSearchHistory();
      const updated = history.filter((h) => h.timestamp !== timestamp);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error removing search history:', error);
      return [];
    }
  },

  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    try {
      // Token data + session-scoped caches. Moderation data (blocked users,
      // pending reports) is intentionally preserved across logout so that a
      // user's blocklist survives a reinstall/relogin.
      await AsyncStorage.multiRemove([
        config.ACCESS_TOKEN_KEY,
        config.REFRESH_TOKEN_KEY,
        config.USER_KEY,
        SEARCH_HISTORY_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },
};

export default storage;
