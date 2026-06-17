// src/services/api.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { notification } from '@/lib/antd/static'; // Using the bridge we set up
import { formatErrorDetail, getApiErrorMessage } from '@/lib/formatApiError';
import {
  refreshManualAccessToken,
  refreshTokenIfNeeded,
  resolveAccessToken,
  shouldUseManualAuthFlow,
} from '@/lib/keycloak';

// Helper to prevent duplicate notifications in a short window
let lastNotificationTime = 0;
const NOTIFICATION_DEBOUNCE = 2000; // 2 seconds

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://144.24.127.112:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

function setAuthorizationHeader(config: InternalAxiosRequestConfig, token: string) {
  config.headers.set('Authorization', `Bearer ${token}`);
}

// Request Interceptor — attach a fresh access token before each API call
api.interceptors.request.use(async (config) => {
  const token = await resolveAccessToken();
  if (token) {
    setAuthorizationHeader(config, token);
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const now = Date.now();

    // 1. Specific Business Logic Redirects
    if (status === 402) {
      // Trial Expired / Connection Limit (from your instructions)
      window.location.href = '/upgrade';
      return Promise.reject(error);
    }

    if (status === 401) {
      const config = error.config as typeof error.config & { _retriedAfterRefresh?: boolean };
      if (config && !config._retriedAfterRefresh) {
        const newToken = shouldUseManualAuthFlow()
          ? await refreshManualAccessToken()
          : await refreshTokenIfNeeded();
        if (newToken) {
          config._retriedAfterRefresh = true;
          setAuthorizationHeader(config, newToken);
          return api.request(config);
        }
      }

      // Let the calling page handle the error — do not clear session or redirect.
      return Promise.reject(error);
    }

    // 2. Global Notification Logic (Debounced)
    // Only show one notification every 2 seconds to avoid "error spam"
    if (now - lastNotificationTime > NOTIFICATION_DEBOUNCE) {
      let message = 'Request Failed';
      let description = 'An unexpected error occurred.';

      if (!error.response) {
        message = 'Network / CORS Error';
        description = 'Cannot reach the backend. Check your internet or CORS settings.';
      } else {
        message = `Error ${status}`;
        const data = error.response.data as { detail?: unknown; message?: string } | undefined;
        description =
          (data?.detail != null ? formatErrorDetail(data.detail) : '') ||
          data?.message ||
          error.message ||
          'An unexpected error occurred.';
      }

      notification.error({
        title: message,
        description: String(description),
        placement: 'topRight',
      });

      lastNotificationTime = now;
    }

    return Promise.reject(error);
  }
);

export default api;