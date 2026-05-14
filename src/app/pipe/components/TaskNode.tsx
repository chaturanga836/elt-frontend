'use client';
import { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Modal, Input, Avatar, Typography, Flex, Empty, Spin } from 'antd';
import { SearchOutlined, SettingOutlined, CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';
import { TaskService, TaskResponse } from '@/services/task.service';
import { useDebouncedFetch } from '@/features/connections/hooks/useDebouncedFetch';

const { Text } = Typography;

const TaskNode = ({ id, data }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const selected = data.config || null;

  const { 
    data: taskResponse, 
    searching, 
    performFetch 
  } = useDebouncedFetch(TaskService.getTaskList);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    performFetch({
      query: value,
      limit: 15,
      sort_by: 'updated_at',
      sort_order: 'desc'
    });
  };

  useEffect(() => {
    if (isModalOpen) {
      performFetch({
        query: '',
        limit: 15,
        sort_by: 'updated_at',
        sort_order: 'desc'
      });
    }
  }, [isModalOpen, performFetch]);

  const onSelect = (item: TaskResponse) => {
    updateNodeData(id, { 
      config: item, 
      task_id: item.id 
    });
    setIsModalOpen(false);
  };

  const tasks = taskResponse?.items || [];

  return (
    <div className="custom-node">
      {/* Left Handle (Input) */}
      <Handle type="target" position={Position.Left} style={{ background: '#1890ff' }} />
      
      <Card 
        size="small" 
        hoverable
        style={{ 
          width: 120, 
          height: 45, 
          borderRadius: '6px', 
          display: 'flex', 
          alignItems: 'center',
          border: selected ? `1px solid #1890ff` : '1px dashed #d9d9d9',
          cursor: 'pointer'
        }}
        styles={{ body: { padding: '4px 8px', width: '100%' } }}
        onClick={() => setIsModalOpen(true)}
      >
        {!selected ? (
          <Flex align="center" gap={4} justify="center" style={{ width: '100%' }}>
            <PlusOutlined style={{ fontSize: '10px', color: '#8c8c8c' }}/>
            <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>Select Task</Text>
          </Flex>
        ) : (
          <Flex align="center" gap={6} style={{ width: '100%' }}>
            <Avatar 
              size={20} 
              shape="square" 
              icon={<SettingOutlined />} 
              style={{ backgroundColor: '#1890ff', flexShrink: 0 }} 
            />
            <Text strong style={{ fontSize: '10px' }} ellipsis>
              {selected.name}
            </Text>
          </Flex>
        )}
      </Card>

      {/* Right Handle (Output) */}
      <Handle type="source" position={Position.Right} style={{ background: '#1890ff' }} />

      <Modal
        title="Select Pipeline Task"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <Input 
          prefix={<SearchOutlined />} 
          placeholder="Search tasks..." 
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ marginBottom: '16px' }}
          allowClear
        />

        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {searching ? (
            <Flex justify="center" style={{ padding: '20px' }}><Spin /></Flex>
          ) : tasks.length > 0 ? (
            tasks.map((task: TaskResponse) => (
              <div
                key={task.id}
                onClick={() => onSelect(task)}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  background: selected?.id === task.id ? '#e6f7ff' : '#fff',
                }}
              >
                <Flex align="center" justify="space-between">
                  <Flex vertical>
                    <Text strong style={{ fontSize: '12px' }}>{task.name}</Text>
                    <Text type="secondary" style={{ fontSize: '10px' }}>ID: {task.id}</Text>
                  </Flex>
                  {selected?.id === task.id && <CheckCircleFilled style={{ color: '#52c41a' }} />}
                </Flex>
              </div>
            ))
          ) : (
            <Empty description="No tasks found" />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TaskNode;