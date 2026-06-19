'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Typography, Flex, Radio, Divider, Button, Space } from 'antd';
import { TaskResponse } from '@/services/task.service';
import TaskPickerModal from './TaskPickerModal';
import { BoundaryHookConfig, HOOK_WHEN_OPTIONS, HookWhen } from '@/types/boundaryHooks';

const { Text, Title } = Typography;

export interface BoundaryHookSettingsModalProps {
  variant: 'start' | 'end';
  open: boolean;
  onClose: () => void;
  data: {
    config?: TaskResponse | null;
    node_config?: BoundaryHookConfig;
  };
  onSave: (patch: {
    config: TaskResponse | null;
    task_id?: number;
    node_config: BoundaryHookConfig;
  }) => void;
}

/**
 * All boundary hook options in one dialog (task search + pagination, teardown timing).
 * Avoids cramped inline Select on canvas nodes.
 */
export default function BoundaryHookSettingsModal({
  variant,
  open,
  onClose,
  data,
  onSave,
}: BoundaryHookSettingsModalProps) {
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [draftTask, setDraftTask] = useState<TaskResponse | null>(data.config ?? null);
  const [hookWhen, setHookWhen] = useState<HookWhen>(data.node_config?.hook_when || 'success');

  useEffect(() => {
    if (open) {
      setDraftTask(data.config ?? null);
      setHookWhen(data.node_config?.hook_when || 'success');
    }
  }, [open, data.config, data.node_config?.hook_when]);

  const resetDraft = () => {
    setDraftTask(data.config ?? null);
    setHookWhen(data.node_config?.hook_when || 'success');
  };

  const handleClose = () => {
    resetDraft();
    onClose();
  };

  const handleApply = () => {
    const base: BoundaryHookConfig = {
      ...(data.node_config || {}),
      hook_task_id: draftTask?.id ?? null,
      label: draftTask?.name,
      ...(variant === 'end' ? { hook_when: hookWhen } : {}),
    };
    onSave({
      config: draftTask,
      task_id: draftTask?.id,
      node_config: base,
    });
    onClose();
  };

  const handleClear = () => {
    setDraftTask(null);
  };

  const whenLabel = HOOK_WHEN_OPTIONS.find((o) => o.value === hookWhen)?.label ?? hookWhen;

  return (
    <>
      <Modal
        title={variant === 'start' ? 'Start — setup hook' : 'End — teardown hook'}
        open={open}
        onCancel={handleClose}
        onOk={handleApply}
        okText="Apply"
        cancelText="Cancel"
        width={480}
        destroyOnClose
      >
        <Flex vertical gap={16}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {variant === 'start'
              ? 'Optional task that runs once before pipeline tasks. Use for environment prep or light validation — not heavy ETL.'
              : 'Optional task that runs after pipeline tasks finish. Choose when it should run below.'}
          </Text>

          <div>
            <Title level={5} style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
              {variant === 'start' ? 'Setup task' : 'Teardown task'}
            </Title>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Button type="default" block onClick={() => setTaskPickerOpen(true)}>
                {draftTask ? `Selected: ${draftTask.name}` : 'Choose task…'}
              </Button>
              {draftTask && (
                <Button type="link" danger size="small" onClick={handleClear} style={{ padding: 0 }}>
                  Clear selection
                </Button>
              )}
            </Space>
          </div>

          {variant === 'end' && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Title level={5} style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
                  When to run teardown
                </Title>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
                  Controls whether the teardown task runs after a successful run, a failed run, or
                  always.
                </Text>
                <Radio.Group
                  value={hookWhen}
                  onChange={(e) => setHookWhen(e.target.value as HookWhen)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {HOOK_WHEN_OPTIONS.map((opt) => (
                    <Radio key={opt.value} value={opt.value}>
                      <span style={{ fontWeight: 500 }}>{opt.label}</span>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginLeft: 24 }}>
                        {opt.value === 'success' && 'Run only if all task nodes succeeded.'}
                        {opt.value === 'always' && 'Run whether the pipeline succeeded or failed.'}
                        {opt.value === 'failure' && 'Run only if a task node failed.'}
                      </Text>
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            </>
          )}

          {variant === 'end' && draftTask && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Preview: run “{draftTask.name}” — {whenLabel.toLowerCase()}
            </Text>
          )}
        </Flex>
      </Modal>

      <TaskPickerModal
        title={variant === 'start' ? 'Select setup task' : 'Select teardown task'}
        open={taskPickerOpen}
        onClose={() => setTaskPickerOpen(false)}
        selectedId={draftTask?.id}
        onSelect={(task) => {
          setDraftTask(task);
          setTaskPickerOpen(false);
        }}
      />
    </>
  );
}
