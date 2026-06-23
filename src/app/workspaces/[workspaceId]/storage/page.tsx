'use client';

import { useParams } from 'next/navigation';
import StorageBrowserPage from '@/features/baas-prototype/StorageBrowserPage';

export default function ProjectStoragePage() {
  const params = useParams();
  const workspaceId = Number(params.workspaceId);
  if (!workspaceId || Number.isNaN(workspaceId)) {
    return null;
  }
  return <StorageBrowserPage workspaceId={workspaceId} />;
}
