'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, Input, Card } from 'antd';
import { PlayCircleOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PipelineService } from '@/services/pipe.service';
import Link from 'next/link';

export default function PipelineListPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, size: 10 });
  const [searchText, setSearchText] = useState('');

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      // Passing search and pagination params to the service
      const response = await PipelineService.getPipelines({
        org_id: 1,
        workspace_id: 1,
        page: pagination.page,
        size: pagination.size,
        name: searchText
      });
      setData(response);
    } catch (err) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [pagination, searchText]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const handleTableChange = (newPagination: any) => {
    setPagination({
      page: newPagination.current,
      size: newPagination.pageSize
    });
  };

  const columns = [
    {
      title: 'Pipeline Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Link href={`/pipe/${record.pipeline_uuid}`}>
          <span style={{ color: '#1890ff', fontWeight: 600 }}>{text}</span>
        </Link>
      ),
    },
    {
      title: 'Latest Version',
      dataIndex: 'version',
      key: 'version',
      render: (v: number) => <Tag color="blue">v{v}</Tag>
    },
    {
      title: 'Last Modified',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_:any, record: any) => (
        <Space>
          <Button icon={<PlayCircleOutlined />} size="small">Run</Button>
          <Link href={`/pipe/${record.pipeline_uuid}`}>
            <Button icon={<EditOutlined />} size="small" type="primary" ghost>Edit</Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Data Pipelines" extra={
        <Link href="/pipeline/new">
          <Button type="primary" icon={<PlusOutlined />}>Create Pipeline</Button>
        </Link>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>
        
        <Table 
          columns={columns}
          dataSource={data.items}
          rowKey="id" 
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.size,
            total: data.total,
            showSizeChanger: true
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}