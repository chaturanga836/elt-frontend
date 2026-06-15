'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flex, Spin } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import WorkspaceDatabaseSetup from '@/features/baas-prototype/WorkspaceDatabaseSetup';
import WorkspaceDatabaseShell from '@/features/baas-prototype/WorkspaceDatabaseShell';
import {
  WorkspaceDatabaseService,
  WorkspaceDatabaseStatus,
} from '@/services/workspaceDatabase.service';

export default function DbLayout({ children }: { children: React.ReactNode }) {
  const workspaceId = useWorkspaceId();
  const [status, setStatus] = useState<WorkspaceDatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const next = await WorkspaceDatabaseService.getStatus(workspaceId);
      setStatus(next);
    } catch {
      setStatus({ provisioned: false });
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

  if (!status?.provisioned) {
    return (
      <WorkspaceDatabaseSetup
        workspaceId={workspaceId}
        onProvisioned={(next) => setStatus(next)}
      />
    );
  }

  return (
    <WorkspaceDatabaseShell
      workspaceId={workspaceId}
      status={status}
      onStatusChange={setStatus}
    >
      {children}
    </WorkspaceDatabaseShell>
  );
}
