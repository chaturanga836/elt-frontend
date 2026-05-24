'use client';

import React, { useState } from 'react';
import { Button, Select, Typography } from 'antd';
import { CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { TaskResponse } from '@/services/task.service';
import { TaskSelectionModal } from '@/app/pipe/components/TaskSelectionModal';
import { BoundaryHookConfig, HOOK_WHEN_OPTIONS, HookWhen } from '@/types/boundaryHooks';

const { Text } = Typography;

interface BoundaryHookPanelProps {
  variant: 'start' | 'end';
  nodeId: string;
  data: {
    config?: TaskResponse | null;
    task_id?: number;
    node_config?: BoundaryHookConfig;
  };
  onUpdate: (nodeId: string, patch: Record<string, unknown>) => void;
  compact?: boolean;
}

export default function BoundaryHookPanel({
  variant,
  nodeId,
  data,
  onUpdate,
  compact = false,
}: BoundaryHookPanelProps) {
  const [open, setOpen] = useState(false);
  const selected = data.config || null;
  const hookWhen = data.node_config?.hook_when || 'success';

  const onSelect = (item: TaskResponse) => {
    onUpdate(nodeId, {
      config: item,
      task_id: item.id,
      node_config: {
        ...(data.node_config || {}),
        hook_task_id: item.id,
        label: item.name,
        ...(variant === 'end' ? { hook_when: hookWhen } : {}),
      },
    });
    setOpen(false);
  };

  const clearHook = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(nodeId, {
      config: null,
      task_id: undefined,
      node_config: {
        ...(data.node_config || {}),
        hook_task_id: null,
        label: undefined,
      },
    });
  };

  const onWhenChange = (value: HookWhen) => {
    onUpdate(nodeId, {
      node_config: {
        ...(data.node_config || {}),
        hook_when: value,
      },
    });
  };

  const title =
    variant === 'start' ? 'Optional setup task' : 'Optional teardown task';
  const placeholder = variant === 'start' ? 'Setup (optional)' : 'Teardown (optional)';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <SettingOutlined style={{ fontSize: 11, color: '#888' }} />
        <Text strong style={{ fontSize: compact ? 10 : 11 }} ellipsis>
          {selected ? selected.name : placeholder}
        </Text>
        {selected && (
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ fontSize: 10 }} />}
            onClick={clearHook}
          />
        )}
      </div>

      {variant === 'end' && (
        <Select
          size="small"
          className="w-full mt-2"
          value={hookWhen}
          options={HOOK_WHEN_OPTIONS}
          onChange={onWhenChange}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 4 }}>
        {title}. Heavy ETL belongs on Task nodes.
      </Text>

      <TaskSelectionModal
        title={variant === 'start' ? 'Setup task (optional)' : 'Teardown task (optional)'}
        open={open}
        onClose={() => setOpen(false)}
        selectedId={data.config?.id}
        onSelect={onSelect}
      />
    </div>
  );
}
