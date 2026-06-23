'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flex, Spin } from 'antd';
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
    setLoading(true);
    try {
      const next = await NotificationService.getStatus(workspaceId);
      setStatus(next);
    } catch {
      setStatus({ enabled: false });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 360 }}>
        <Spin size="large" />
      </Flex>
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
