'use client';

import { Select } from 'antd';
import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { WorkflowService } from '@/services/workflow.service';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfPipelineNode({
  id,
  data,
}: {
  id: string;
  data: { label?: string; node_config?: { pipeline_uuid?: string; pipeline_name?: string } };
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [pipelines, setPipelines] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    WorkflowService.listPipelines()
      .then((res) => {
        setPipelines(
          (res.items || []).map((p: { name: string; pipeline_uuid: string }) => ({
            label: p.name,
            value: p.pipeline_uuid,
          })),
        );
      })
      .catch(() => setPipelines([]));
  }, []);

  const config = data.node_config || {};

  return (
    <WorkflowNodeShell title="Pipeline" color="#722ed1">
      <Select
        size="small"
        className="w-full"
        placeholder="Select pipeline"
        options={pipelines}
        value={config.pipeline_uuid}
        onChange={(uuid, opt) =>
          updateNodeData(id, {
            label: (opt as { label?: string })?.label || 'Pipeline',
            node_config: {
              pipeline_uuid: uuid,
              pipeline_name: (opt as { label?: string })?.label,
            },
          })
        }
      />
      <p className="text-[10px] text-gray-400 mt-1">Runs full pipeline as one step</p>
    </WorkflowNodeShell>
  );
}
