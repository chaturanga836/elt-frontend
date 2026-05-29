'use client';

import { workspacePath } from '@/lib/paths';
import { useWorkspaceId } from './useWorkspaceId';

export function useWorkspacePath(segment = ''): string {
  const workspaceId = useWorkspaceId();
  return workspacePath(workspaceId, segment);
}

export function useWorkspaceIdParam(): number {
  return useWorkspaceId();
}
