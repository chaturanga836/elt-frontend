'use client';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfTaskNode({ id, data }: { id: string; data: { label?: string } }) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  return (
    <WorkflowNodeShell title="Task" color="#1890ff">
      <input
        className="w-full border rounded px-2 py-1 text-xs"
        value={data.label || ''}
        placeholder="Task label"
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
      />
      <div className="text-[10px] text-gray-400 mt-1">Bind task_id in inspector (future)</div>
    </WorkflowNodeShell>
  );
}
