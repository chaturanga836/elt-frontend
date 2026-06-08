'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { TaskResponse } from '@/services/task.service';
import TaskPickerModal from '@/features/orchestration/TaskPickerModal';
import WorkflowNodeShell from './WorkflowNodeShell';

export default function WfTaskNode({
  id,
  data,
}: {
  id: string;
  data: {
    label?: string;
    task_id?: number;
    config?: TaskResponse;
    node_config?: Record<string, unknown>;
  };
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = data.config || null;
  const label = selected?.name || data.label || 'Task';

  const onSelect = (task: TaskResponse) => {
    updateNodeData(id, {
      config: task,
      task_id: task.id,
      label: task.name,
      node_config: {
        ...(data.node_config || {}),
        label: task.name,
      },
    });
    setPickerOpen(false);
  };

  return (
    <WorkflowNodeShell title="Task" color="#1890ff">
      <div className="text-xs font-medium mb-2 truncate" title={label}>
        {label}
      </div>
      <div className="flex gap-1">
        <Button size="small" icon={<SwapOutlined />} onClick={() => setPickerOpen(true)}>
          {selected ? 'Change' : 'Select'}
        </Button>
        {selected ? (
          <Button size="small" type="link" icon={<EditOutlined />} disabled title="Open task editor from Tasks app">
            Script
          </Button>
        ) : null}
      </div>
      <TaskPickerModal
        title="Select workflow task"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onSelect}
        selectedId={selected?.id ?? data.task_id}
      />
    </WorkflowNodeShell>
  );
}
