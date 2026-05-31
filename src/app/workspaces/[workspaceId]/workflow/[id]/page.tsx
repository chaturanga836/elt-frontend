'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin, message } from 'antd';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { WorkflowService } from '@/services/workflow.service';

export default function EditWorkflowPage() {
  const { id } = useParams();
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'new') return;
    const resetWorkflow = useWorkflowStore.getState().resetWorkflow;
    resetWorkflow();
    (async () => {
      try {
        const res = await WorkflowService.getWorkflow(id as string);
        const wf = res.workflow;
        const canvas = wf.canvas_structure || { nodes: [], edges: [] };
        const apiNodes: Array<{
          node_uuid: string;
          node_config?: Record<string, unknown>;
          task_id?: number | null;
        }> = res.nodes || [];
        const apiByUuid = Object.fromEntries(apiNodes.map((n) => [n.node_uuid, n]));

        const mergedNodes = (canvas.nodes || []).map((node: { id: string; data?: Record<string, unknown> }) => {
          const api = apiByUuid[node.id];
          if (!api) return node;
          const hookId = api.node_config?.hook_task_id ?? api.task_id;
          return {
            ...node,
            data: {
              ...node.data,
              node_config: api.node_config ?? node.data?.node_config,
              task_id: hookId ?? node.data?.task_id,
            },
          };
        });

        setWorkflow(
          wf.id,
          wf.workflow_uuid,
          mergedNodes,
          canvas.edges || [],
          wf.name,
          wf.description || '',
        );
      } catch {
        message.error('Failed to load workflow');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, setWorkflow]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return <WorkflowCanvas />;
}
