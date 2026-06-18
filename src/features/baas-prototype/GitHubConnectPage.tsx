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
import { getApiErrorMessage } from '@/lib/formatApiError';
import ImportRepoModal from '@/features/baas-prototype/ImportRepoModal';

const { Title, Text } = Typography;

const GITHUB_OAUTH_MESSAGE_TYPE = 'github-oauth';

function apiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://144.24.127.112:8000/api/v1';
  return new URL(base).origin;
}

export default function GitHubConnectPage() {
  const workspaceId = useWorkspaceId();
  const [connections, setConnections] = useState<GitConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [importConnection, setImportConnection] = useState<GitConnection | null>(null);

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
      // OAuth popup lands on the API callback (:8000), not the app origin (:3000).
      if (event.origin !== apiOrigin()) return;
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
    } catch (error) {
      setConnecting(false);
      notification.error({
        message: 'Failed to start GitHub authorization',
        description: getApiErrorMessage(error),
      });
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
      render: (b: string, row: GitConnection) =>
        row.repo_full_name ? <Tag>{b}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Last sync',
      key: 'last_sync',
      render: (_: unknown, row: GitConnection) =>
        row.last_sync_sha ? (
          <Text code>{row.last_sync_sha.slice(0, 7)}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
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
          {!row.repo_full_name ? (
            <Button
              size="small"
              icon={<ImportOutlined />}
              onClick={() => setImportConnection(row)}
            >
              Import
            </Button>
          ) : null}
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

      <ImportRepoModal
        open={importConnection !== null}
        connection={importConnection}
        workspaceId={workspaceId}
        onClose={() => setImportConnection(null)}
        onImported={() => void loadConnections()}
      />
    </div>
  );
}
