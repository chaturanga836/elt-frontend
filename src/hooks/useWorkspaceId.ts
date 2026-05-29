'use client';

import { useParams } from 'next/navigation';

export function useWorkspaceId(): number {
  const params = useParams();
  const raw = params?.workspaceId;
  const id = typeof raw === 'string' ? Number(raw) : Number(raw?.[0]);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('workspaceId is required in the current route');
  }
  return id;
}
