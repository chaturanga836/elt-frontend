'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, Input, Card } from 'antd';
import {
  PlayCircleOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import PipelineBackfillModal from './PipelineBackfillModal';
import { PipelineService } from '@/services/pipe.service';
import Link from 'next/link';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

export default function PipelineListPage() {
  const workspaceId = useWorkspaceId();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, size: 10 });
  const [searchText, setSearchText] = useState('');
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillTarget, setBackfillTarget] = useState<{
    uuid: string;
    name: string;
  } | null>(null);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      // Passing search and pagination params to the service
      const response = await PipelineService.getPipelines({
        workspace_id: workspaceId,
        page: pagination.page,
        size: pagination.size,
        // name: searchText
      });
      setData(response);
    } catch (err) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [pagination, searchText, workspaceId]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const handleTableChange = (newPagination: any) => {
    setPagination({
      page: newPagination.current,
      size: newPagination.pageSize
    });
  };


  const handleRunPipeline = async (pipeline_uuid: string) => {
    console.log(`Run pipeline ${pipeline_uuid}`);
    try{
      console.log("here we are");
      const res = await PipelineService.runPipe(pipeline_uuid);
      console.info(res);
    }catch(e){
      console.error(e);
    }
    
  }

  const columns = [
    {
      title: 'Pipeline Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Link href={workspacePath(workspaceId, `pipe/${record.pipeline_uuid}`)}>
          <span style={{ color: '#1890ff', fontWeight: 600 }}>{text}</span>
        </Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_draft',
      key: 'is_draft',
      render: (isDraft: boolean | undefined) =>
        isDraft ? <Tag color="gold">Draft</Tag> : <Tag color="green">Published</Tag>,
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
          <Button
            icon={<PlayCircleOutlined />}
            size="small"
            disabled={record.is_draft}
            title={record.is_draft ? 'Publish the pipeline before running' : undefined}
            onClick={() => handleRunPipeline(record.pipeline_uuid)}
          >
            Run
          </Button>
          <Button
            icon={<CalendarOutlined />}
            size="small"
            disabled={record.is_draft}
            title={record.is_draft ? 'Publish before backfill' : 'One run per day in a date range'}
            onClick={() => {
              setBackfillTarget({ uuid: record.pipeline_uuid, name: record.name });
              setBackfillOpen(true);
            }}
          >
            Backfill
          </Button>
          <Link href={workspacePath(workspaceId, `pipe/${record.pipeline_uuid}`)}>
            <Button icon={<EditOutlined />} size="small" type="primary" ghost>Edit</Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Data Pipelines" extra={
        <Link href={workspacePath(workspaceId, 'pipe/new?reset=1')}>
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

      <PipelineBackfillModal
        open={backfillOpen}
        pipelineUuid={backfillTarget?.uuid ?? null}
        pipelineName={backfillTarget?.name}
        onClose={() => {
          setBackfillOpen(false);
          setBackfillTarget(null);
        }}
      />
    </div>
  );
}