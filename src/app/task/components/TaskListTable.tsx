'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Input, Card, notification } from 'antd';
import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { TaskService, TaskResponse } from '@/services/task.service';
import Link from 'next/link';

export default function TaskListTable() {
  const [data, setData] = useState<{ items: TaskResponse[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  
  // State for search and pagination/sorting
  const [searchText, setSearchText] = useState('');
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    sort_by: 'updated_at',
    sort_order: 'desc' as 'asc' | 'desc'
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      // Using the consolidated service method
      const response = await TaskService.getTaskList({
        ...params,
        query: searchText
      });
      setData({ items: response.items, total: response.total });
    } catch (err) {
      notification.error({ message: "Failed to fetch tasks" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params, searchText]);

  useEffect(() => {
    // Debouncing the search text so it doesn't hit the API on every keystroke
    const handler = setTimeout(() => {
      fetchTasks();
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchTasks]);

  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    setParams(prev => ({
      ...prev,
      page: newPagination.current,
      limit: newPagination.pageSize,
      sort_by: sorter.field || 'updated_at',
      sort_order: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true, // Prevents long descriptions from breaking the table
    },
    {
      title: 'Last Modified',
      dataIndex: 'updated_at',
      key: 'updated_at',
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, record: TaskResponse) => (
        <Space>
          <Link href={`/task/${record.id}`}>
            <Button icon={<EditOutlined />} size="small" type="primary" ghost>
              View/Edit
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Independent Task Library" 
        extra={
          <Link href="/task/new">
            <Button type="primary" icon={<PlusOutlined />}>Create New Task</Button>
          </Link>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search tasks by name or ID..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350 }}
            allowClear
          />
        </div>
        
        <Table 
          columns={columns}
          dataSource={data.items}
          rowKey="id" 
          loading={loading}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: data.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'] // Max 100 as per your backend limit
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}