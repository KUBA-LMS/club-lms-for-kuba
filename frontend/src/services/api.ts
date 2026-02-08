import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import config from '../config';
import { storage } from './storage';
import { ApiError, RefreshTokenResponse } from '../types/auth';

/**
 * API client with automatic token refresh and error handling.
 */

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: config.API_URL,
  timeout: config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (axiosConfig: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token && axiosConfig.headers) {
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }
    return axiosConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<RefreshTokenResponse>(
          `${config.API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        await storage.setAccessToken(access_token);
        await storage.setRefreshToken(newRefreshToken);

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // Clear auth data on refresh failure
        await storage.clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error response
    const apiError: ApiError = {
      detail: error.response?.data?.detail || error.message || 'An error occurred',
      status_code: error.response?.status,
    };

    return Promise.reject(apiError);
  }
);

export default api;
