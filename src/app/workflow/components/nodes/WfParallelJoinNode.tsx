'use client';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfParallelJoinNode({
  id,
  data,
}: {
  id: string;
  data: { label?: string };
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  return (
    <WorkflowNodeShell title="Parallel Join" color="#08979c">
      <input
        className="w-full border rounded px-2 py-1 text-xs"
        value={(data.label as string) || ''}
        placeholder="Join label"
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
      />
      <p className="text-[10px] text-gray-400 mt-1">Merge point after parallel branches</p>
    </WorkflowNodeShell>
  );
}
