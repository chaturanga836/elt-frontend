'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Spin, Tabs, Typography, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceItem, WorkspaceService } from '@/services/workspace.service';
import WorkspaceGeneralTab from '@/features/workspaces/components/WorkspaceGeneralTab';
import WorkspaceMembersTab from '@/features/workspaces/components/WorkspaceMembersTab';
import WorkspacePluginsTab from '@/features/workspaces/components/WorkspacePluginsTab';

const { Title, Text } = Typography;

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = Number(params.id);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspaceId);
  const [workspace, setWorkspace] = useState<WorkspaceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(workspaceId)) return;
    setCurrentWorkspaceId(workspaceId);
    (async () => {
      try {
        setLoading(true);
        const ws = await WorkspaceService.get(workspaceId);
        setWorkspace(ws);
      } catch {
        notification.error({ message: 'Workspace not found' });
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId, setCurrentWorkspaceId]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8">
        <Link href="/workspaces">
          <Button icon={<ArrowLeftOutlined />}>Back to workspaces</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/workspaces">
        <Button type="text" icon={<ArrowLeftOutlined />} className="mb-4">
          All workspaces
        </Button>
      </Link>
      <Title level={2} style={{ marginTop: 0 }}>
        {workspace.name}
      </Title>
      <Text type="secondary">Workspace ID {workspace.id} · Settings</Text>

      <Card className="mt-6">
        <Tabs
          items={[
            {
              key: 'general',
              label: 'General',
              children: (
                <WorkspaceGeneralTab workspace={workspace} onUpdated={setWorkspace} />
              ),
            },
            {
              key: 'members',
              label: 'Users & invitations',
              children: <WorkspaceMembersTab workspaceId={workspace.id} />,
            },
            {
              key: 'plugins',
              label: 'Plugins',
              children: <WorkspacePluginsTab workspaceId={workspace.id} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
