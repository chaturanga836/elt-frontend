'use client';
import { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Modal, Input, Avatar, Typography, Flex, Empty, Spin } from 'antd';
import { SearchOutlined, RocketFilled, CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { TaskService, TaskResponse } from '@/services/task.service';
import { useDebouncedFetch } from '@/features/connections/hooks/useDebouncedFetch';
import { TaskSelectionModal } from './TaskSelectionModal';
import { set } from 'lodash';

const { Text } = Typography;

const StartNode = ({ id, data }: any) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = data.config || null;

  const { data: taskResponse, searching, performFetch } = useDebouncedFetch(TaskService.getTaskList);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performFetch({ query: value, limit: 15 });
  };

  // useEffect(() => {
  //   if (isModalOpen) performFetch({ query: '', limit: 15 });
  // }, [isModalOpen, performFetch]);

  const onSelect = (item: TaskResponse) => {
    updateNodeData(id, { config: item, task_id: item.id });
    setOpen(false);
  };

  return (
    <div className="start-node">
      <Card 
        size="small" 
        hoverable
        style={{ 
          width: 120, 
          height: 45, 
          background: '#f6ffed', 
          border: selected ? '1px solid #52c41a' : '1px dashed #b7eb8f',
          cursor: 'pointer' 
        }}
        styles={{ body: { padding: '4px 8px' } }}
        onClick={() => setOpen(true)}
      >
        <Flex align="center" gap={6}>
          <Avatar 
            size={20} 
            shape="square" 
            icon={<RocketFilled />} 
            style={{ backgroundColor: '#52c41a' }} 
          />
          <Text strong style={{ fontSize: '10px' }} ellipsis>
            {selected ? selected.name : 'Start Logic'}
          </Text>
        </Flex>
      </Card>
      <Handle type="source" position={Position.Right} style={{ background: '#52c41a' }} />

<TaskSelectionModal 
        title="Assign Start Logic"
        open={open}
        onClose={() => setOpen(false)}
        selectedId={data.config?.id}
        onSelect={(task) => onSelect(task)}
      />
    </div>
  );
};

export default StartNode;