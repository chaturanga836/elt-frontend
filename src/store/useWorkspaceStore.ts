'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WorkspaceState = {
  orgId: number;
  currentWorkspaceId: number | null;
  setOrgId: (id: number) => void;
  setCurrentWorkspaceId: (id: number | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      orgId: 1,
      currentWorkspaceId: null,
      setOrgId: (id) => set({ orgId: id }),
      setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
    }),
    { name: 'elt-workspace' },
  ),
);
