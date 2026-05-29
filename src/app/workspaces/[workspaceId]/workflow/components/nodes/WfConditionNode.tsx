'use client';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfConditionNode({
  id,
  data,
}: {
  id: string;
  data: { node_config?: { expression?: string } };
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const expression = data.node_config?.expression ?? 'True';

  return (
    <WorkflowNodeShell
      title="If / Else"
      color="#fa8c16"
      sourceHandles={[
        { id: 'true', label: 'Yes' },
        { id: 'false', label: 'No' },
      ]}
    >
      <textarea
        className="w-full border rounded px-2 py-1 text-xs font-mono"
        rows={3}
        value={expression}
        placeholder='e.g. input_data.get("ok") == True'
        onChange={(e) =>
          updateNodeData(id, {
            node_config: { expression: e.target.value },
          })
        }
      />
      <p className="text-[10px] text-gray-400 mt-1">Connect Yes/No handles to branches</p>
    </WorkflowNodeShell>
  );
}
