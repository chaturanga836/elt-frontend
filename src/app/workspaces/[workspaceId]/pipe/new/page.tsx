'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PipelineCanvas from '../components/PipelineCanvas';
import { usePipelineStore } from '@/store/usePipeStore';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

export default function NewPipelinePage() {
  const resetPipeline = usePipelineStore((state) => state.resetPipeline);
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  useEffect(() => {
    if (searchParams.get('reset') !== '1') return;
    resetPipeline();
    router.replace(workspacePath(workspaceId, 'pipe/new'));
  }, [resetPipeline, router, searchParams, workspaceId]);

  return <PipelineCanvas />;
}
