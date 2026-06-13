'use client';

import { useParams } from 'next/navigation';

export function useWorkspaceId(): number {
  const params = useParams();
  const raw = params?.projectId ?? params?.workspaceId;
  const id = typeof raw === 'string' ? Number(raw) : Number(raw?.[0]);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('projectId or workspaceId is required in the current route');
  }
  return id;
}

export const useProjectId = useWorkspaceId;
