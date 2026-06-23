'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flex, Result, Spin } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import NotificationSetupGate from '@/features/notifications/NotificationSetupGate';
import {
  NotificationService,
  WorkspaceNotificationStatus,
} from '@/services/notification.service';

export default function RealtimeLayout({ children }: { children: React.ReactNode }) {
  const workspaceId = useWorkspaceId();
  const [status, setStatus] = useState<WorkspaceNotificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const next = await NotificationService.getStatus(workspaceId);
      setStatus(next);
      return next;
    } catch {
      const fallback = { enabled: false, provisioning_status: 'idle' as const };
      setStatus(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status?.provisioning_status !== 'provisioning') {
      return;
    }
    const timer = window.setInterval(() => {
      void loadStatus();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [status?.provisioning_status, loadStatus]);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (status?.provisioning_status === 'provisioning') {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Result
          icon={<Spin size="large" />}
          title="Provisioning realtime notifications"
          subTitle="Starting Centrifugo for your account. This usually takes under a minute."
        />
      </Flex>
    );
  }

  if (status?.provisioning_status === 'failed') {
    return (
      <NotificationSetupGate
        workspaceId={workspaceId}
        status={status}
        onEnabled={loadStatus}
        failed
      />
    );
  }

  if (!status?.enabled) {
    return (
      <NotificationSetupGate
        workspaceId={workspaceId}
        status={status ?? { enabled: false }}
        onEnabled={loadStatus}
      />
    );
  }

  return <>{children}</>;
}
