'use client';

import SideWrapper from '@/components/ui/SideWrapper';
import WorkspaceGuard from '@/components/workspace/WorkspaceGuard';
import { useParams } from 'next/navigation';

export default function WorkspaceShellLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const raw = params?.workspaceId;
  const workspaceId = typeof raw === 'string' ? Number(raw) : Number(raw?.[0]);

  return (
    <WorkspaceGuard>
      <SideWrapper workspaceId={workspaceId}>{children}</SideWrapper>
    </WorkspaceGuard>
  );
}
