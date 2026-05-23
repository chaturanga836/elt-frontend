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
    if (!id) return;
    (async () => {
      try {
        const res = await WorkflowService.getWorkflow(id as string);
        const wf = res.workflow;
        const canvas = wf.canvas_structure || { nodes: [], edges: [] };
        setWorkflow(
          wf.id,
          wf.workflow_uuid,
          canvas.nodes || [],
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
