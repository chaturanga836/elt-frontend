'use client';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import BoundaryHookPanel from '@/features/orchestration/BoundaryHookPanel';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfStartNode({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <WorkflowNodeShell title="Start" color="#52c41a" target={false}>
      <BoundaryHookPanel
        variant="start"
        nodeId={id}
        data={data as Parameters<typeof BoundaryHookPanel>[0]['data']}
        onUpdate={updateNodeData}
        compact
      />
    </WorkflowNodeShell>
  );
}
