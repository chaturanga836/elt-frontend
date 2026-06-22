'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flex, Spin } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import QueueSetupGate from '@/features/queue/QueueSetupGate';
import { QueueService, WorkspaceQueueStatus } from '@/services/queue.service';

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  const workspaceId = useWorkspaceId();
  const [status, setStatus] = useState<WorkspaceQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const next = await QueueService.getStatus(workspaceId);
      setStatus(next);
    } catch {
      setStatus({ enabled: false, broker: 'postgres' });
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
      <QueueSetupGate
        workspaceId={workspaceId}
        status={status ?? { enabled: false, broker: 'postgres' }}
        onEnabled={loadStatus}
      />
    );
  }

  return <>{children}</>;
}
