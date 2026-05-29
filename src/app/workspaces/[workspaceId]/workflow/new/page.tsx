'use client';

import { useEffect } from 'react';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { useWorkflowStore } from '@/store/useWorkflowStore';

export default function NewWorkflowPage() {
  const resetWorkflow = useWorkflowStore((s) => s.resetWorkflow);

  useEffect(() => {
    resetWorkflow();
  }, [resetWorkflow]);

  return <WorkflowCanvas />;
}
