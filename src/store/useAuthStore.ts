'use client';

import { create } from 'zustand';

type AuthState = {
  initialized: boolean;
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  email: string | null;
  isSuperAdmin: boolean;
  realmRoles: string[];
  workspaceIds: number[];
  setAuth: (payload: {
    token: string;
    username?: string | null;
    email?: string | null;
    isSuperAdmin?: boolean;
    realmRoles?: string[];
    workspaceIds?: number[];
  }) => void;
  setProfile: (payload: {
    isSuperAdmin: boolean;
    realmRoles: string[];
    workspaceIds: number[];
    username?: string | null;
    email?: string | null;
  }) => void;
  clearAuth: () => void;
  setInitialized: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  isAuthenticated: false,
  token: null,
  username: null,
  email: null,
  isSuperAdmin: false,
  realmRoles: [],
  workspaceIds: [],
  setAuth: ({
    token,
    username = null,
    email = null,
    isSuperAdmin = false,
    realmRoles = [],
    workspaceIds = [],
  }) =>
    set({
      isAuthenticated: true,
      token,
      username,
      email,
      isSuperAdmin,
      realmRoles,
      workspaceIds,
      initialized: true,
    }),
  setProfile: ({ isSuperAdmin, realmRoles, workspaceIds, username, email }) =>
    set((s) => ({
      isSuperAdmin,
      realmRoles,
      workspaceIds,
      username: username ?? s.username,
      email: email ?? s.email,
    })),
  clearAuth: () =>
    set({
      initialized: true,
      isAuthenticated: false,
      token: null,
      username: null,
      email: null,
      isSuperAdmin: false,
      realmRoles: [],
      workspaceIds: [],
    }),
  setInitialized: (value) => set({ initialized: value }),
}));
