'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Descriptions, Space, Table, Tag, Typography, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CodeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import {
  NotificationLogItem,
  NotificationService,
  channelNamed,
} from '@/services/notification.service';
import { StudioService } from '@/services/studio.service';
import { projectPath } from '@/lib/paths';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

const ACTION_COLORS: Record<string, string> = {
  publish: 'blue',
  subscribe_token: 'purple',
  delivery: 'green',
  enable: 'cyan',
  disable: 'orange',
};

export default function RealtimeMonitorPage() {
  const workspaceId = useWorkspaceId();
  const [orgId, setOrgId] = useState<number | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [account, status, logRes] = await Promise.all([
        StudioService.getAccount(),
        NotificationService.getStatus(workspaceId),
        NotificationService.listProjectLogs(workspaceId, { page: 1, limit: 15 }),
      ]);
      setOrgId(account.organization.id);
      setWsUrl(status.ws_url ?? null);
      setLogs(logRes.items);
    } catch (err) {
      notification.error({
        message: 'Failed to load realtime monitor',
        description: getApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const exampleChannel = orgId != null ? channelNamed(orgId, workspaceId, 'orders') : 'org:{orgId}:ws:{workspaceId}:channel:orders';

  const sdkSnippet = `// JavaScript — use in your app (not this studio)
import { EltRuntimeClient, EltRealtimeClient, channelNamed } from '@elt/sdk';

const runtime = new EltRuntimeClient({
  baseUrl: process.env.ELT_API_URL,
  apiKey: process.env.ELT_API_KEY,
  workspaceId: ${workspaceId},
});

// Publish from your backend job or server
await runtime.notificationPublish('orders', { event: 'order.created', id: 99 });

// Subscribe in your frontend app
const realtime = new EltRealtimeClient({
  baseUrl: process.env.ELT_API_URL,
  getAccessToken: () => userJwtFromYourAuth,
});
await realtime.connect();
realtime.subscribe('${exampleChannel}', (data) => console.log(data));`;

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Realtime monitor
      </Title>
      <Paragraph type="secondary">
        Observability for your org&apos;s Centrifugo service. Subscribe and publish happen in{' '}
        <strong>your application</strong> via the SDK — not in this studio.
      </Paragraph>

      <Card loading={loading} style={{ marginTop: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Service">
            <Space>
              <Tag color="purple">Centrifugo</Tag>
              <Badge status="success" text="Enabled for account" />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="WebSocket URL (for your app)">
            {wsUrl ? (
              <Text copyable code>
                {wsUrl}
              </Text>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Channel naming">
            <Text code copyable>
              {exampleChannel}
            </Text>
          </Descriptions.Item>
        </Descriptions>
        <Space style={{ marginTop: 16 }}>
          <Link href={projectPath(workspaceId, 'realtime/logs')}>
            <Button>View full logs</Button>
          </Link>
          <Button onClick={() => void load()}>Refresh</Button>
        </Space>
      </Card>

      <Card title="Recent activity" style={{ marginTop: 16 }} loading={loading}>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={logs}
          locale={{ emptyText: 'No publish or delivery events yet' }}
          columns={[
            {
              title: 'Time',
              dataIndex: 'created_at',
              width: 170,
              render: (v: string) => new Date(v).toLocaleString(),
            },
            {
              title: 'Action',
              dataIndex: 'action',
              width: 120,
              render: (v: string) => <Tag color={ACTION_COLORS[v] ?? 'default'}>{v}</Tag>,
            },
            { title: 'Actor', dataIndex: 'actor', ellipsis: true, width: 140 },
            { title: 'Channel', dataIndex: 'channel', ellipsis: true },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 80,
              render: (v: string) =>
                v === 'ok' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                ),
            },
          ]}
        />
      </Card>

      <Card
        title={
          <Space>
            <CodeOutlined />
            SDK usage (your app)
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <Paragraph type="secondary">
          Install <Text code>@elt/sdk</Text> in your project. Connection tokens are minted by the API
          when your app calls <Text code>GET /notifications/realtime-token</Text> with a user JWT.
        </Paragraph>
        <pre
          style={{
            margin: 0,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 6,
            fontSize: 12,
            overflow: 'auto',
          }}
        >
          {sdkSnippet}
        </pre>
      </Card>
    </div>
  );
}
