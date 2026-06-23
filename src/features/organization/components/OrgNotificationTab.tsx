'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import Link from 'next/link';
import {
  NotificationService,
  OrgNotificationRegistryItem,
} from '@/services/notification.service';
import { projectPath } from '@/lib/paths';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

type NotificationSettings = {
  enabled: boolean;
  provisioned_at?: string | null;
  broker_instance_ref?: string | null;
  ws_url?: string | null;
};

export default function OrgNotificationTab() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [registry, setRegistry] = useState<OrgNotificationRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notificationSettings, reg] = await Promise.all([
        NotificationService.getOrgSettings(),
        NotificationService.listOrgRegistry(),
      ]);
      setSettings(notificationSettings);
      setRegistry(reg.items);
    } catch (err) {
      notification.error({
        message: 'Failed to load notification settings',
        description: getApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggle = async (enabled: boolean) => {
    setSaving(true);
    try {
      const updated = await NotificationService.updateOrgSettings({ enabled });
      setSettings(updated);
      notification.success({
        message: enabled ? 'Provisioning realtime notifications' : 'Notifications disabled',
      });
      await load();
    } catch (err) {
      notification.error({
        message: 'Could not update notification settings',
        description: getApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        Realtime notifications
      </Title>
      <Paragraph type="secondary">
        Enable Centrifugo for org-wide realtime messaging, inbox delivery, and SDK publish/subscribe.
      </Paragraph>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Space>
            <Text>Enable notifications</Text>
            <Switch
              checked={settings?.enabled ?? false}
              loading={saving}
              onChange={(checked) => void onToggle(checked)}
            />
          </Space>
          {settings?.provisioned_at && (
            <Text type="secondary">
              Provisioned {new Date(settings.provisioned_at).toLocaleString()}
              {settings.broker_instance_ref ? ` · ${settings.broker_instance_ref}` : ''}
            </Text>
          )}
          {settings?.ws_url && (
            <Text type="secondary" copyable>
              {settings.ws_url}
            </Text>
          )}
        </Space>
      </Card>

      <Card title="Channel activity" loading={loading}>
        <Table
          rowKey={(row) => `${row.workspace_id}-${row.channel}`}
          dataSource={registry}
          pagination={false}
          locale={{ emptyText: 'No publishes yet' }}
          columns={[
            { title: 'Project', dataIndex: 'workspace_name', key: 'workspace_name' },
            { title: 'Channel', dataIndex: 'channel', key: 'channel', ellipsis: true },
            {
              title: '24h publishes',
              dataIndex: 'publish_count_24h',
              key: 'publish_count_24h',
              render: (v: number) => <Tag color={v > 0 ? 'blue' : 'default'}>{v}</Tag>,
            },
            {
              title: 'Last publish',
              dataIndex: 'last_publish_at',
              key: 'last_publish_at',
              render: (v: string | null) => (v ? new Date(v).toLocaleString() : '—'),
            },
            {
              title: '',
              key: 'actions',
              render: (_: unknown, row: OrgNotificationRegistryItem) => (
                <Link href={projectPath(row.workspace_id, 'realtime/logs')}>Logs</Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
