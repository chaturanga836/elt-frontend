'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Radio,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import Link from 'next/link';
import { OrganizationSettingsService } from '@/services/organization-settings.service';
import { projectPath } from '@/lib/paths';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

type QueueSettings = {
  enabled: boolean;
  broker: 'postgres' | 'redis' | 'rabbitmq';
  provisioned_at?: string | null;
  broker_instance_ref?: string | null;
};

type OrgQueueRow = {
  workspace_id: number;
  workspace_name: string;
  queue_id: number;
  queue_name: string;
  depth: number;
  created_at?: string | null;
};

export default function OrgQueueTab() {
  const [settings, setSettings] = useState<QueueSettings | null>(null);
  const [queues, setQueues] = useState<OrgQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [queueSettings, orgQueues] = await Promise.all([
        OrganizationSettingsService.getQueueSettings(),
        OrganizationSettingsService.listOrgQueues(),
      ]);
      setSettings(queueSettings);
      setQueues(orgQueues.items);
    } catch (err) {
      notification.error({ message: 'Failed to load queue settings', description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async (next: QueueSettings) => {
    setSaving(true);
    try {
      const updated = await OrganizationSettingsService.updateQueueSettings({
        enabled: next.enabled,
        broker: next.broker,
      });
      setSettings(updated);
      notification.success({ message: 'Queue settings saved' });
      void load();
    } catch (err) {
      notification.error({ message: 'Could not save queue settings', description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Card loading={loading && !settings} title="Account queue setup">
        <Paragraph type="secondary">
          Enable queue once for the entire account. On free tier, choose PostgreSQL (built-in) or Redis
          (dedicated broker per account). All projects share this broker configuration.
        </Paragraph>
        {settings && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Space>
              <Text>Enabled</Text>
              <Switch
                checked={settings.enabled}
                loading={saving}
                onChange={(enabled) => void saveSettings({ ...settings, enabled })}
              />
            </Space>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>Broker</Text>
              <Radio.Group
                value={settings.broker}
                disabled={!settings.enabled || saving}
                onChange={(e) => void saveSettings({ ...settings, broker: e.target.value })}
              >
                <Radio.Button value="postgres">PostgreSQL</Radio.Button>
                <Radio.Button value="redis">Redis</Radio.Button>
                <Radio.Button value="rabbitmq" disabled>
                  RabbitMQ (soon)
                </Radio.Button>
              </Radio.Group>
            </div>
            {settings.provisioned_at && (
              <Text type="secondary">
                Provisioned {new Date(settings.provisioned_at).toLocaleString()}
                {settings.broker_instance_ref ? ` · ${settings.broker_instance_ref}` : ''}
              </Text>
            )}
          </Space>
        )}
      </Card>

      <Card
        title="All project queues"
        extra={
          <Button onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
        }
      >
        <Table
          rowKey={(r) => `${r.workspace_id}-${r.queue_id}`}
          loading={loading}
          dataSource={queues}
          pagination={false}
          columns={[
            { title: 'Project', dataIndex: 'workspace_name', key: 'workspace_name' },
            {
              title: 'Project ID',
              dataIndex: 'workspace_id',
              key: 'workspace_id',
              width: 100,
            },
            { title: 'Queue', dataIndex: 'queue_name', key: 'queue_name' },
            {
              title: 'Depth',
              dataIndex: 'depth',
              key: 'depth',
              width: 90,
              render: (n: number) => (n > 0 ? <Tag color="blue">{n}</Tag> : <Tag>0</Tag>),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 120,
              render: (_: unknown, row: OrgQueueRow) => (
                <Link href={projectPath(row.workspace_id, 'queue')}>
                  <Button type="link" size="small">
                    Open
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
