'use client';

import { projectPath } from '@/lib/paths';
import { useWorkspaceId } from './useWorkspaceId';

export function useWorkspacePath(segment = ''): string {
  const workspaceId = useWorkspaceId();
  return projectPath(workspaceId, segment);
}

export const useProjectPath = useWorkspacePath;

export function useWorkspaceIdParam(): number {
  return useWorkspaceId();
}
