'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, Select, Space, Table, Tag, Typography, notification } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { NotificationLogItem, NotificationService } from '@/services/notification.service';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  publish: 'blue',
  subscribe_token: 'purple',
  delivery: 'green',
  enable: 'cyan',
  disable: 'orange',
};

export default function NotificationLogsPage() {
  const workspaceId = useWorkspaceId();
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await NotificationService.listProjectLogs(workspaceId, { page, limit: 50, action });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err) {
      notification.error({
        message: 'Failed to load notification logs',
        description: getApiErrorMessage(err),
      });
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
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (v: string) => <Tag color={ACTION_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    { title: 'Actor', dataIndex: 'actor', key: 'actor', width: 140, ellipsis: true },
    { title: 'Channel', dataIndex: 'channel', key: 'channel', ellipsis: true },
    {
      title: 'Recipients',
      dataIndex: 'recipient_count',
      key: 'recipient_count',
      width: 100,
      render: (v: number | null | undefined) => (v != null ? v : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => <Tag color={v === 'ok' ? 'success' : 'error'}>{v}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Notification logs
      </Title>
      <Text type="secondary">Publish, subscribe, and delivery events for this project.</Text>

      <Card style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Filter by action"
            style={{ width: 200 }}
            value={action}
            onChange={(v) => {
              setPage(1);
              setAction(v);
            }}
            options={[
              { value: 'publish', label: 'publish' },
              { value: 'subscribe_token', label: 'subscribe_token' },
              { value: 'delivery', label: 'delivery' },
              { value: 'enable', label: 'enable' },
              { value: 'disable', label: 'disable' },
            ]}
          />
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={logs}
          columns={columns}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            onChange: setPage,
            showTotal: (t) => `${t} events`,
          }}
        />
      </Card>
    </div>
  );
}
