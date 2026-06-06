'use client';

import { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Card, Avatar, Typography, Flex, Button } from 'antd';
import { SettingOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { TaskResponse, TaskService } from '@/services/task.service';
import TaskPickerModal from '@/features/orchestration/TaskPickerModal';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';
import { consumePipelineTaskPick } from '@/lib/pipelineTaskPick';
import PipelineNodeDeleteButton from './PipelineNodeDeleteButton';
import styles from '../pipeline-editor.module.css';

const { Text } = Typography;

const TaskNode = ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const pipelineSegment = params?.id;
  const pipelineReturnUrl =
    typeof pipelineSegment === 'string' && pipelineSegment !== 'new'
      ? workspacePath(workspaceId, `pipe/${pipelineSegment}`)
      : workspacePath(workspaceId, 'pipe/new');

  const [pickerOpen, setPickerOpen] = useState(false);
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = (data.config as TaskResponse | null) || null;
  const nodeLabel =
    selected?.name ||
    (typeof data.label === 'string' ? data.label : undefined) ||
    'Script node';

  useEffect(() => {
    const task = consumePipelineTaskPick(id);
    if (task) {
      updateNodeData(id, { config: task, task_id: task.id });
    }
  }, [id, pathname, updateNodeData]);

  useEffect(() => {
    const taskId = data.task_id as number | undefined;
    if (!taskId || data.config) return;

    let cancelled = false;
    void TaskService.getTask(taskId)
      .then((task) => {
        if (!cancelled) {
          updateNodeData(id, { config: task, task_id: task.id });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id, data.task_id, data.config, updateNodeData]);

  const onSelect = (item: TaskResponse) => {
    updateNodeData(id, {
      config: item,
      task_id: item.id,
    });
    setPickerOpen(false);
  };

  const openScriptEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected?.id) return;
    const params = new URLSearchParams({
      from: 'pipeline',
      nodeId: id,
      returnUrl: pipelineReturnUrl,
    });
    router.push(`${workspacePath(workspaceId, `task/${selected.id}`)}?${params.toString()}`);
  };

  return (
    <div className={`custom-node ${styles.pipelineNodeWrap}`}>
      <PipelineNodeDeleteButton nodeId={id} nodeLabel={nodeLabel} />
      <Handle type="target" position={Position.Left} style={{ background: '#1890ff' }} />

      <Card
        size="small"
        hoverable
        style={{
          width: 120,
          height: 45,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          border: selected ? '1px solid #1890ff' : '1px dashed #d9d9d9',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: '4px 8px', width: '100%' } }}
        onClick={() => setPickerOpen(true)}
      >
        {!selected ? (
          <Flex align="center" gap={4} justify="center" style={{ width: '100%' }}>
            <PlusOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
            <Text style={{ fontSize: 10, color: '#8c8c8c' }}>Select script</Text>
          </Flex>
        ) : (
          <Flex align="center" gap={4} style={{ width: '100%' }}>
            <Avatar
              size={20}
              shape="square"
              icon={<SettingOutlined />}
              style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
            />
            <Text strong style={{ fontSize: 10, flex: 1, minWidth: 0 }} ellipsis>
              {selected.name}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 11 }} />}
              onClick={openScriptEditor}
              title="Edit script"
              style={{ flexShrink: 0, width: 20, height: 20, minWidth: 20, padding: 0 }}
            />
          </Flex>
        )}
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: '#1890ff' }} />

      <TaskPickerModal
        title="Select script"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={selected?.id}
        onSelect={onSelect}
        pipelineNodeId={id}
        pipelineReturnUrl={pipelineReturnUrl}
      />
    </div>
  );
};

export default TaskNode;
