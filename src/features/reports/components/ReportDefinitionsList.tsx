'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Space,
  Table,
  Typography,
  notification,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { ReportDefinition, ReportService } from '@/services/report.service';
import { workspacePath } from '@/lib/paths';

const { Title, Text } = Typography;

type Props = {
  workspaceId: number;
};

export default function ReportDefinitionsList({ workspaceId }: Props) {
  const [items, setItems] = useState<ReportDefinition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ReportService.list({
        workspace_id: workspaceId,
        query: search || undefined,
        page,
        limit: 20,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      notification.error({ message: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, page]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = async (id: number) => {
    try {
      await ReportService.remove(id);
      notification.success({ message: 'Report deleted' });
      void load();
    } catch {
      notification.error({ message: 'Failed to delete report' });
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ReportDefinition) => (
        <Link href={workspacePath(workspaceId, `reports/${record.id}/edit`)}>{name}</Link>
      ),
    },
    {
      title: 'Pipeline',
      dataIndex: 'pipeline_uuid',
      key: 'pipeline_uuid',
      ellipsis: true,
      render: (v: string | null) => v || <Text type="secondary">Any</Text>,
    },
    {
      title: 'Data path',
      dataIndex: 'data_root_path',
      key: 'data_root_path',
      width: 120,
      render: (v: string | null) => v || <Text type="secondary">(root)</Text>,
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ReportDefinition) => (
        <Space>
          <Link href={workspacePath(workspaceId, `reports/${record.id}/edit`)}>
            <Button type="text" icon={<EditOutlined />} />
          </Link>
          <Popconfirm title="Delete this report?" onConfirm={() => onDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Reports
          </Title>
          <Text type="secondary">
            Custom templates to export pipeline run data as HTML, CSV, or JSON.
          </Text>
        </div>
        <Link href={workspacePath(workspaceId, 'reports/new')}>
          <Button type="primary" icon={<PlusOutlined />}>
            New report
          </Button>
        </Link>
      </div>

      <Card className="mb-4">
        <Input.Search
          placeholder="Search by name"
          allowClear
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 360 }}
        />
      </Card>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (t) => `${t} reports`,
        }}
      />
    </div>
  );
}
