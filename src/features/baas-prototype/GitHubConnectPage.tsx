'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
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

export default function GitHubConnectPage() {
  const workspaceId = useWorkspaceId();
  const [connections, setConnections] = useState<GitConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

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

  const handleConnect = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await GitConnectionService.create(workspaceId, {
        provider: 'github',
        account_login: values.account_login,
        repo_full_name: values.repo_full_name || undefined,
        default_branch: values.default_branch || 'main',
        access_token: values.access_token,
        scopes: ['repo'],
      });
      notification.success({ message: 'GitHub connected' });
      setConnectOpen(false);
      form.resetFields();
      await loadConnections();
    } catch {
      notification.error({ message: 'Failed to connect GitHub' });
    } finally {
      setSubmitting(false);
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
      title: 'Account / Repository',
      key: 'repo',
      render: (_: unknown, row: GitConnection) => (
        <Space>
          <GithubOutlined />
          <Text strong>{row.repo_full_name || row.account_login || `Connection #${row.id}`}</Text>
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
        Connect GitHub with a personal access token. OAuth redirect can be enabled via server env vars.
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={() => setConnectOpen(true)}
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

      <Modal
        title="Connect GitHub"
        open={connectOpen}
        onCancel={() => setConnectOpen(false)}
        onOk={() => void handleConnect()}
        confirmLoading={submitting}
        okText="Connect"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="account_login" label="GitHub username or org">
            <Input placeholder="acme" />
          </Form.Item>
          <Form.Item name="repo_full_name" label="Repository (optional)">
            <Input placeholder="acme/api-functions" />
          </Form.Item>
          <Form.Item name="default_branch" label="Default branch" initialValue="main">
            <Input />
          </Form.Item>
          <Form.Item
            name="access_token"
            label="Personal access token"
            rules={[{ required: true, message: 'Token is required' }]}
          >
            <Input.Password placeholder="ghp_..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
