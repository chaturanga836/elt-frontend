'use client';

import { useWorkflowStore } from '@/store/useWorkflowStore';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfParallelForkNode({
  id,
  data,
}: {
  id: string;
  data: { node_config?: { join_node_uuid?: string } };
}) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const joinCandidates = nodes.filter((n) => n.type === 'parallelJoinNode');

  return (
    <WorkflowNodeShell
      title="Parallel Split"
      color="#13c2c2"
      sourceHandles={[
        { id: 'branch-0' },
        { id: 'branch-1' },
      ]}
    >
      <label className="text-[10px] text-gray-500">Join node</label>
      <select
        className="w-full border rounded px-2 py-1 text-xs mt-1"
        value={data.node_config?.join_node_uuid || ''}
        onChange={(e) =>
          updateNodeData(id, {
            node_config: { join_node_uuid: e.target.value },
          })
        }
      >
        <option value="">Select join node...</option>
        {joinCandidates.map((n) => (
          <option key={n.id} value={n.id}>
            {n.data?.label || n.id}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-gray-400 mt-1">Draw 2+ outgoing edges to branches</p>
    </WorkflowNodeShell>
  );
}
