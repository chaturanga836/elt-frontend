'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import router
import { Modal, Input, Typography, Flex, Empty, Spin, Button, Divider } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleFilled } from '@ant-design/icons';
import { TaskService, TaskResponse } from '@/services/task.service';
import { useDebouncedFetch } from '@/features/connections/hooks/useDebouncedFetch';

const { Text } = Typography;

interface TaskSelectionModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSelect: (task: TaskResponse) => void;
  selectedId?: number | string | null;
}

export const TaskSelectionModal = ({ title, open, onClose, onSelect, selectedId }: TaskSelectionModalProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: taskResponse, searching, performFetch } = useDebouncedFetch(TaskService.getTaskList);

  const fetchTasks = () => {
    performFetch({ query: searchQuery, limit: 15, sort_by: 'updated_at', sort_order: 'desc' });
  };

  useEffect(() => {
    if (open) {
      fetchTasks();
    }
  }, [open]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    performFetch({ query: val, limit: 15 });
  };

  const handleAddNewTask = () => {
    // This triggers the (...)task/new intercept route modal
    router.push('/task/new');
  };

  const tasks = taskResponse?.items || [];

  return (
    <Modal 
      title={title} 
      open={open} 
      onCancel={onClose} 
      footer={null} 
      centered 
      width={420}
    >
      <Flex vertical gap={12}>
        <Input 
          prefix={<SearchOutlined />} 
          placeholder="Search tasks..." 
          value={searchQuery}
          onChange={handleSearch}
          allowClear
        />

        {/* The Action Button to Intercept Route */}
        <Button 
          type="dashed" 
          block 
          icon={<PlusOutlined />} 
          onClick={handleAddNewTask}
          style={{ height: '40px' }}
        >
          Create New Task Definition
        </Button>

        <Divider style={{ margin: '4px 0' }} />

        <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
          {searching ? (
            <Flex justify="center" style={{ padding: '20px' }}><Spin /></Flex>
          ) : tasks.length > 0 ? (
            tasks.map((task:TaskResponse) => (
              <div
                key={task.id}
                onClick={() => onSelect(task)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  border: selectedId === task.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selectedId === task.id ? '#e6f7ff' : '#fff',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1890ff')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = selectedId === task.id ? '#1890ff' : '#f0f0f0')}
              >
                <Flex align="center" justify="space-between">
                  <Flex vertical>
                    <Text strong style={{ fontSize: '13px' }}>{task.name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Ref: {task.id ?? 'N/A'}
                    </Text>
                  </Flex>
                  {selectedId === task.id && <CheckCircleFilled style={{ color: '#52c41a', fontSize: '16px' }} />}
                </Flex>
              </div>
            ))
          ) : (
            <Empty description="No tasks found" />
          )}
        </div>
      </Flex>
    </Modal>
  );
};