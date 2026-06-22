'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Radio, Result, Space, Typography, notification } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { QueueBroker, QueueService, WorkspaceQueueStatus } from '@/services/queue.service';
import { StudioService } from '@/services/studio.service';
import { canManageOrgQueue } from '@/services/organization-settings.service';
import { organizationSettingsPath } from '@/lib/paths';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

type Props = {
  workspaceId: number;
  status: WorkspaceQueueStatus;
  onEnabled?: () => void;
};

export default function QueueSetupGate({ workspaceId, status, onEnabled }: Props) {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const [canManage, setCanManage] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [broker, setBroker] = useState<QueueBroker>(status.broker ?? 'postgres');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await StudioService.getAccount();
        if (!cancelled) {
          setCanManage(canManageOrgQueue(account.user.role, isSuperAdmin));
        }
      } catch {
        if (!cancelled) {
          setCanManage(isSuperAdmin);
        }
      } finally {
        if (!cancelled) {
          setCheckingAccess(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const enableQueue = async () => {
    setEnabling(true);
    try {
      await QueueService.updateOrgSettings(workspaceId, { enabled: true, broker });
      notification.success({ message: 'Queue enabled for this account' });
      onEnabled?.();
    } catch (err) {
      notification.error({
        message: 'Could not enable queue',
        description: getApiErrorMessage(err),
      });
    } finally {
      setEnabling(false);
    }
  };

  const subtitle = status.enabled
    ? 'Queue is being configured. Refresh in a moment.'
    : canManage
      ? 'Queue is turned off for this account. Enable it below to create project queues.'
      : 'An account owner or admin must enable queue in account settings before you can create project queues.';

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        <InboxOutlined style={{ marginRight: 8 }} />
        Queue
      </Title>
      <Card>
        <Result
          status="info"
          title="Queue is not enabled for this account"
          subTitle={subtitle}
          extra={
            canManage && !status.enabled ? (
              <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>Broker</Text>
                  <Radio.Group
                    value={broker}
                    disabled={enabling || checkingAccess}
                    onChange={(e) => setBroker(e.target.value)}
                  >
                    <Radio.Button value="postgres">PostgreSQL</Radio.Button>
                    <Radio.Button value="redis">Redis</Radio.Button>
                  </Radio.Group>
                </div>
                <Button type="primary" loading={enabling} disabled={checkingAccess} onClick={() => void enableQueue()}>
                  Enable queue
                </Button>
                <Link href={organizationSettingsPath()}>
                  <Button type="link" style={{ padding: 0 }}>
                    Open account settings
                  </Button>
                </Link>
              </Space>
            ) : (
              <Link href={organizationSettingsPath()}>
                <Button type="primary">Open account settings</Button>
              </Link>
            )
          }
        />
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          After enablement, create named queues in this project and use the SDK to push and pop messages.
        </Paragraph>
      </Card>
    </div>
  );
}
