'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Avatar, Typography, Flex } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { TaskResponse } from '@/services/task.service';
import TaskPickerModal from '@/features/orchestration/TaskPickerModal';

const { Text } = Typography;

const TaskNode = ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = (data.config as TaskResponse | null) || null;

  const onSelect = (item: TaskResponse) => {
    updateNodeData(id, {
      config: item,
      task_id: item.id,
    });
    setPickerOpen(false);
  };

  return (
    <div className="custom-node">
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
            <Text style={{ fontSize: 10, color: '#8c8c8c' }}>Select Task</Text>
          </Flex>
        ) : (
          <Flex align="center" gap={6} style={{ width: '100%' }}>
            <Avatar
              size={20}
              shape="square"
              icon={<SettingOutlined />}
              style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
            />
            <Text strong style={{ fontSize: 10 }} ellipsis>
              {selected.name}
            </Text>
          </Flex>
        )}
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: '#1890ff' }} />

      <TaskPickerModal
        title="Select pipeline task"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={selected?.id}
        onSelect={onSelect}
      />
    </div>
  );
};

export default TaskNode;
