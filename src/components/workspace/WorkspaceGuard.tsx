'use client';

import { Spin } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WorkspaceService } from '@/services/workspace.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export default function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const raw = params?.projectId ?? params?.workspaceId;
  const workspaceId = typeof raw === 'string' ? Number(raw) : Number(raw?.[0]);

  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const workspaceIds = useAuthStore((s) => s.workspaceIds);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspaceId);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!Number.isFinite(workspaceId) || workspaceId < 1) {
        setCurrentWorkspaceId(null);
        router.replace('/projects');
        return;
      }

      if (!isSuperAdmin && workspaceIds.length > 0 && !workspaceIds.includes(workspaceId)) {
        setCurrentWorkspaceId(null);
        router.replace('/projects');
        return;
      }

      try {
        await WorkspaceService.get(workspaceId);
        if (cancelled) return;
        setCurrentWorkspaceId(workspaceId);
        setReady(true);
      } catch {
        if (cancelled) return;
        setCurrentWorkspaceId(null);
        router.replace('/projects');
      }
    };

    setReady(false);
    void run();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, isSuperAdmin, workspaceIds, router, setCurrentWorkspaceId]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
