'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import { GithubOutlined, LinkOutlined, ImportOutlined } from '@ant-design/icons';
import {
  GitConnection,
  GitConnectionService,
} from '@/services/git-connection.service';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const { Title, Text } = Typography;

const GITHUB_OAUTH_MESSAGE_TYPE = 'github-oauth';

export default function GitHubConnectPage() {
  const workspaceId = useWorkspaceId();
  const [connections, setConnections] = useState<GitConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GitConnectionService.list(workspaceId);
      setConnections(res.items || []);
    } catch {
      notification.error({ message: 'Failed to load Git connections' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; ok?: boolean; message?: string } | null;
      if (!data || data.type !== GITHUB_OAUTH_MESSAGE_TYPE) return;

      setConnecting(false);
      if (data.ok) {
        notification.success({
          message: 'GitHub connected',
          description: data.message || undefined,
        });
        void loadConnections();
      } else {
        notification.error({
          message: 'Failed to connect GitHub',
          description: data.message || undefined,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadConnections]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { authorize_url } = await GitConnectionService.startGitHubOAuth(workspaceId);
      const popup = window.open(
        authorize_url,
        'github-oauth',
        'width=600,height=700,scrollbars=yes',
      );
      if (!popup) {
        setConnecting(false);
        window.location.href = authorize_url;
      }
    } catch {
      setConnecting(false);
      notification.error({ message: 'Failed to start GitHub authorization' });
    }
  };

  const handleRevoke = async (connectionId: number) => {
    try {
      await GitConnectionService.revoke(workspaceId, connectionId);
      notification.success({ message: 'Connection revoked' });
      await loadConnections();
    } catch {
      notification.error({ message: 'Failed to revoke connection' });
    }
  };

  const columns = [
    {
      title: 'GitHub account',
      key: 'account',
      render: (_: unknown, row: GitConnection) => (
        <Space>
          <GithubOutlined />
          <Text strong>{row.account_login || `Connection #${row.id}`}</Text>
          {row.repo_full_name ? (
            <Text type="secondary">({row.repo_full_name})</Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Branch',
      dataIndex: 'default_branch',
      render: (b: string) => <Tag>{b}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: GitConnection) => (
        <Space>
          <Button
            size="small"
            icon={<ImportOutlined />}
            onClick={() => notification.info({ message: 'Import from repo (coming soon)' })}
          >
            Import
          </Button>
          <Button size="small" danger onClick={() => void handleRevoke(row.id)}>
            Revoke
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        GitHub
      </Title>
      <Text type="secondary">
        Authorize GitHub in the popup to link your account to this workspace.
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            loading={connecting}
            onClick={() => void handleConnect()}
          >
            Connect GitHub
          </Button>
        </Space>
      </Card>

      <Card title="Linked connections" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={connections}
          pagination={false}
        />
      </Card>
    </div>
  );
}
