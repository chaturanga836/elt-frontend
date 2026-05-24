'use client';

import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import { SettingOutlined, CloseOutlined } from '@ant-design/icons';
import { TaskResponse } from '@/services/task.service';
import { BoundaryHookConfig, HOOK_WHEN_OPTIONS } from '@/types/boundaryHooks';
import BoundaryHookSettingsModal from './BoundaryHookSettingsModal';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selected = data.config || null;
  const hookWhen = data.node_config?.hook_when || 'success';
  const whenLabel = HOOK_WHEN_OPTIONS.find((o) => o.value === hookWhen)?.label;

  const clearHook = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(nodeId, {
      config: null,
      task_id: undefined,
      node_config: {
        ...(data.node_config || {}),
        hook_task_id: null,
        label: undefined,
        ...(variant === 'end' ? { hook_when: 'success' } : {}),
      },
    });
  };

  const summary =
    variant === 'start'
      ? selected
        ? `Setup: ${selected.name}`
        : 'Setup (optional)'
      : selected
        ? `Teardown: ${selected.name}`
        : 'Teardown (optional)';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        type="text"
        size="small"
        block
        icon={<SettingOutlined />}
        onClick={() => setSettingsOpen(true)}
        style={{
          height: 'auto',
          padding: compact ? '2px 4px' : '4px 8px',
          textAlign: 'left',
          justifyContent: 'flex-start',
        }}
      >
        <Text strong style={{ fontSize: compact ? 10 : 11 }} ellipsis>
          {summary}
        </Text>
      </Button>

      {variant === 'end' && selected && whenLabel && (
        <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 2, paddingLeft: 4 }}>
          {whenLabel}
        </Text>
      )}

      {selected && (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined style={{ fontSize: 10 }} />}
          onClick={clearHook}
          style={{ padding: 0, height: 18, marginTop: 2 }}
        >
          <span style={{ fontSize: 9 }}>Clear</span>
        </Button>
      )}

      <BoundaryHookSettingsModal
        variant={variant}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        data={data}
        onSave={(patch) => onUpdate(nodeId, patch)}
      />
    </div>
  );
}
