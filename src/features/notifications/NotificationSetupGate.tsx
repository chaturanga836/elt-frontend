'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Result, Space, Typography, notification } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import Link from 'next/link';
import {
  NotificationService,
  WorkspaceNotificationStatus,
} from '@/services/notification.service';
import { StudioService } from '@/services/studio.service';
import { canManageOrgQueue } from '@/services/organization-settings.service';
import { organizationSettingsPath } from '@/lib/paths';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

type Props = {
  workspaceId: number;
  status: WorkspaceNotificationStatus;
  onEnabled?: () => void;
  failed?: boolean;
};

export default function NotificationSetupGate({
  workspaceId,
  status,
  onEnabled,
  failed = false,
}: Props) {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const [canManage, setCanManage] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [enabling, setEnabling] = useState(false);

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

  const enableNotifications = async () => {
    setEnabling(true);
    try {
      await NotificationService.updateOrgSettingsFromProject(workspaceId, { enabled: true });
      notification.success({ message: 'Provisioning realtime notifications' });
      onEnabled?.();
    } catch (err) {
      notification.error({
        message: 'Could not enable notifications',
        description: getApiErrorMessage(err),
      });
    } finally {
      setEnabling(false);
    }
  };

  const subtitle = failed
    ? 'Centrifugo could not be started. Try again or check server logs for infra-service and elt-worker.'
    : canManage
      ? 'Realtime notifications are turned off for this account. Enable to use channels, inbox, and SDK publish.'
      : 'An account owner or admin must enable notifications in account settings.';

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        <ThunderboltOutlined style={{ marginRight: 8 }} />
        Realtime
      </Title>
      <Card>
        <Result
          status={failed ? 'error' : 'info'}
          title={failed ? 'Notification provisioning failed' : 'Notifications are not enabled'}
          subTitle={subtitle}
          extra={
            canManage ? (
              <Space orientation="vertical" size={16}>
                <Button
                  type="primary"
                  loading={enabling}
                  disabled={checkingAccess}
                  onClick={() => void enableNotifications()}
                >
                  {failed ? 'Retry provisioning' : 'Enable notifications'}
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
          After enablement, subscribe to channels and publish events from the UI or SDK.
        </Paragraph>
      </Card>
    </div>
  );
}
