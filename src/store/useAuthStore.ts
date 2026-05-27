'use client';

import { create } from 'zustand';

type AuthState = {
  initialized: boolean;
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  email: string | null;
  setAuth: (payload: { token: string; username?: string | null; email?: string | null }) => void;
  clearAuth: () => void;
  setInitialized: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  isAuthenticated: false,
  token: null,
  username: null,
  email: null,
  setAuth: ({ token, username = null, email = null }) =>
    set({
      isAuthenticated: true,
      token,
      username,
      email,
      initialized: true,
    }),
  clearAuth: () =>
    set({
      initialized: true,
      isAuthenticated: false,
      token: null,
      username: null,
      email: null,
    }),
  setInitialized: (value) => set({ initialized: value }),
}));
