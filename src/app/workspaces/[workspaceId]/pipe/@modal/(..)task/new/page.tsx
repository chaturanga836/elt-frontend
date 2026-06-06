'use client';

import { useRouter } from 'next/navigation';
import TaskCanvas from '@/app/workspaces/[workspaceId]/task/components/TaskCanvas';
import PipelineInterceptShell from '@/app/workspaces/[workspaceId]/pipe/components/PipelineInterceptShell';

export default function TaskInterceptPage() {
  const router = useRouter();

  return (
    <PipelineInterceptShell onClose={() => router.back()}>
      <TaskCanvas />
    </PipelineInterceptShell>
  );
}
