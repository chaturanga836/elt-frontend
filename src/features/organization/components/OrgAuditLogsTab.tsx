'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Table, Tag, notification } from 'antd';
import {
  AuditEvent,
  OrganizationSettingsService,
} from '@/services/organization-settings.service';

function formatAction(action: string): string {
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}

export default function OrgAuditLogsTab() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await OrganizationSettingsService.listAuditLogs(page, limit);
      setEvents(res.items);
      setTotal(res.total);
    } catch {
      notification.error({ message: 'Failed to load audit logs' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={events}
      pagination={{
        current: page,
        pageSize: limit,
        total,
        showTotal: (t) => `${t} events`,
        onChange: setPage,
      }}
      columns={[
        {
          title: 'Time',
          dataIndex: 'created_at',
          key: 'created_at',
          width: 180,
          render: (v: string) => new Date(v).toLocaleString(),
        },
        { title: 'Actor', dataIndex: 'actor_email', key: 'actor_email', width: 220 },
        {
          title: 'Action',
          dataIndex: 'action',
          key: 'action',
          render: (action: string) => <Tag>{formatAction(action)}</Tag>,
        },
        {
          title: 'Resource',
          key: 'resource',
          render: (_: unknown, row: AuditEvent) =>
            row.resource_type
              ? `${row.resource_type}${row.resource_id ? ` #${row.resource_id}` : ''}`
              : '—',
        },
        {
          title: 'Details',
          dataIndex: 'details',
          key: 'details',
          ellipsis: true,
          render: (details: Record<string, unknown>) =>
            Object.keys(details).length ? JSON.stringify(details) : '—',
        },
      ]}
    />
  );
}
