'use client';

import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { workspacePath } from '@/lib/paths';

type Props = {
  segment: string;
};

export default function LegacyWorkspaceRedirect({ segment }: Props) {
  const router = useRouter();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  useEffect(() => {
    if (currentWorkspaceId) {
      router.replace(workspacePath(currentWorkspaceId, segment));
    } else {
      router.replace('/workspaces');
    }
  }, [currentWorkspaceId, router, segment]);

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
