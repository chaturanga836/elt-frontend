// src/services/api.ts
import axios from 'axios';
import { notification } from '@/lib/antd/static'; // Using the bridge we set up

// Helper to prevent duplicate notifications in a short window
let lastNotificationTime = 0;
const NOTIFICATION_DEBOUNCE = 2000; // 2 seconds

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://144.24.127.112:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const now = Date.now();

    // 1. Specific Business Logic Redirects
    if (status === 402) {
      // Trial Expired / Connection Limit (from your instructions)
      window.location.href = '/upgrade';
      return Promise.reject(error);
    }

    if (status === 401) {
      // Keycloak Session Expired
      console.error('Session expired');
      // notification.warning({ message: 'Session Expired', description: 'Please log in again.' });
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
        description = error.response.data?.detail || error.response.data?.message || error.message;
      }

      notification.error({
        title:message,
        description,
        placement: 'topRight',
      });

      lastNotificationTime = now;
    }

    return Promise.reject(error);
  }
);

export default api;