'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, Select, Space, Table, Tag, Typography, notification } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { QueueLogItem, QueueService } from '@/services/queue.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

type LogRow = QueueLogItem & { queue_name: string };

const ACTION_COLORS: Record<string, string> = {
  push: 'blue',
  pop: 'green',
  peek: 'default',
  create: 'purple',
  delete: 'red',
};

export default function QueueLogsPage() {
  const workspaceId = useWorkspaceId();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await QueueService.listProjectLogs(workspaceId, { page, limit: 50, action });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err) {
      notification.error({ message: 'Failed to load queue logs', description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, action]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: 'Queue', dataIndex: 'queue_name', key: 'queue_name', width: 160 },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (v: string) => <Tag color={ACTION_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    { title: 'Actor', dataIndex: 'actor', key: 'actor', width: 140, ellipsis: true },
    {
      title: 'Message ID',
      dataIndex: 'message_id',
      key: 'message_id',
      width: 100,
      render: (v: number | null | undefined) => (v ? v : '—'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Queue logs
      </Title>
      <Text type="secondary">Push, pop, peek, and management events for this project&apos;s queues.</Text>

      <Card style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Filter by action"
            style={{ width: 180 }}
            value={action}
            onChange={(v) => {
              setPage(1);
              setAction(v);
            }}
            options={[
              { value: 'push', label: 'push' },
              { value: 'pop', label: 'pop' },
              { value: 'peek', label: 'peek' },
              { value: 'create', label: 'create' },
              { value: 'delete', label: 'delete' },
            ]}
          />
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={logs}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
