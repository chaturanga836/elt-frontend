'use client';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import BoundaryHookPanel from '@/features/orchestration/BoundaryHookPanel';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfEndNode({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <WorkflowNodeShell title="End" color="#ff4d4f" source={false}>
      <BoundaryHookPanel
        variant="end"
        nodeId={id}
        data={data as Parameters<typeof BoundaryHookPanel>[0]['data']}
        onUpdate={updateNodeData}
        compact
      />
    </WorkflowNodeShell>
  );
}
