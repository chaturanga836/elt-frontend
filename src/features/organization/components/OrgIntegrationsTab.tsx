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
import { GithubOutlined, LinkOutlined } from '@ant-design/icons';
import { GitConnection } from '@/services/git-connection.service';
import { OrganizationSettingsService } from '@/services/organization-settings.service';

const { Text, Paragraph } = Typography;

const GITHUB_OAUTH_MESSAGE_TYPE = 'github-oauth';

function apiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://144.24.127.112:8000/api/v1';
  return new URL(base).origin;
}

export default function OrgIntegrationsTab() {
  const [connections, setConnections] = useState<GitConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await OrganizationSettingsService.listGitConnections();
      setConnections(res.items || []);
    } catch {
      notification.error({ message: 'Failed to load Git connections' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
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
      const { authorize_url } = await OrganizationSettingsService.startGitHubOAuth();
      const popup = window.open(authorize_url, 'github-oauth', 'width=600,height=700');
      if (!popup) {
        setConnecting(false);
        notification.error({ message: 'Popup blocked — allow popups and try again' });
      }
    } catch {
      setConnecting(false);
      notification.error({ message: 'Failed to start GitHub OAuth' });
    }
  };

  const handleRevoke = async (connectionId: number) => {
    try {
      await OrganizationSettingsService.revokeGitConnection(connectionId);
      notification.success({ message: 'Connection revoked' });
      void loadConnections();
    } catch {
      notification.error({ message: 'Failed to revoke connection' });
    }
  };

  const accountConnections = connections.filter((c) => !c.repo_full_name);

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Connect Git at the account level so all projects can use shared provider credentials.
          Per-project repo imports continue to work from each project&apos;s GitHub service page.
        </Paragraph>
      </div>

      <Card>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex justify-between items-center">
            <Space>
              <GithubOutlined style={{ fontSize: 24 }} />
              <div>
                <Text strong>GitHub</Text>
                <br />
                <Text type="secondary">OAuth connection shared across your account</Text>
              </div>
            </Space>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              loading={connecting}
              onClick={() => void handleConnect()}
            >
              Connect GitHub
            </Button>
          </div>

          <Table
            rowKey="id"
            loading={loading}
            dataSource={accountConnections}
            pagination={false}
            locale={{ emptyText: 'No GitHub accounts connected yet' }}
            columns={[
              {
                title: 'Account',
                dataIndex: 'account_login',
                key: 'account_login',
                render: (login: string | null) => login || '—',
              },
              {
                title: 'Provider',
                dataIndex: 'provider',
                key: 'provider',
                render: (p: string) => <Tag>{p}</Tag>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => <Tag color="green">{s}</Tag>,
              },
              {
                title: 'Connected',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (v: string | null) => (v ? new Date(v).toLocaleString() : '—'),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: unknown, row: GitConnection) => (
                  <Button danger type="link" onClick={() => void handleRevoke(row.id)}>
                    Revoke
                  </Button>
                ),
              },
            ]}
          />
        </Space>
      </Card>
    </Space>
  );
}
