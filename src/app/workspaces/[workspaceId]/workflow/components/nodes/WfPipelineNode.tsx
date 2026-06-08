'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import PipelinePickerModal, {
  type PipelinePickerItem,
} from '@/features/orchestration/PipelinePickerModal';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfPipelineNode({
  id,
  data,
}: {
  id: string;
  data: { label?: string; node_config?: { pipeline_uuid?: string; pipeline_name?: string } };
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [pickerOpen, setPickerOpen] = useState(false);
  const config = data.node_config || {};
  const displayName = config.pipeline_name || data.label || 'Pipeline';

  const onSelect = (pipeline: PipelinePickerItem) => {
    updateNodeData(id, {
      label: pipeline.name,
      node_config: {
        pipeline_uuid: pipeline.pipeline_uuid,
        pipeline_name: pipeline.name,
      },
    });
    setPickerOpen(false);
  };

  return (
    <WorkflowNodeShell title="Pipeline" color="#722ed1">
      <div
        className="nodrag nopan nowheel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-medium mb-2 truncate" title={displayName}>
          {config.pipeline_uuid ? displayName : 'No pipeline selected'}
        </div>
        <Button
          size="small"
          icon={<SwapOutlined />}
          onClick={() => setPickerOpen(true)}
        >
          {config.pipeline_uuid ? 'Change' : 'Select pipeline'}
        </Button>
        <p className="text-[10px] text-gray-400 mt-1 mb-0">
          Runs full published pipeline as one step
        </p>
      </div>
      <PipelinePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onSelect}
        selectedUuid={config.pipeline_uuid}
      />
    </WorkflowNodeShell>
  );
}
