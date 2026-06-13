'use client';

import React from 'react';
import { Button, Card, Space, Table, Tag, Typography, notification } from 'antd';
import { GithubOutlined, LinkOutlined, ImportOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MOCK_REPOS = [
  {
    key: '1',
    repo: 'acme/api-functions',
    branch: 'main',
    functions: 8,
    lastSync: '2026-06-11 10:30',
    status: 'connected',
  },
  {
    key: '2',
    repo: 'acme/etl-workers',
    branch: 'develop',
    functions: 3,
    lastSync: '2026-06-10 16:45',
    status: 'connected',
  },
];

export default function GitHubConnectPage() {
  const columns = [
    {
      title: 'Repository',
      dataIndex: 'repo',
      render: (repo: string) => (
        <Space>
          <GithubOutlined />
          <Text strong>{repo}</Text>
        </Space>
      ),
    },
    { title: 'Branch', dataIndex: 'branch', render: (b: string) => <Tag>{b}</Tag> },
    { title: 'Functions', dataIndex: 'functions', width: 100 },
    { title: 'Last sync', dataIndex: 'lastSync', width: 160 },
    {
      title: 'Status',
      dataIndex: 'status',
      render: () => <Tag color="green">Connected</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button
          size="small"
          icon={<ImportOutlined />}
          onClick={() => notification.success({ message: 'Import started (prototype)' })}
        >
          Import
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        GitHub
      </Title>
      <Text type="secondary">Connect repositories to deploy sync and async functions. Prototype — mock linked repos.</Text>

      <Card style={{ marginTop: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={() => notification.info({ message: 'GitHub OAuth simulated (prototype)' })}
          >
            Connect GitHub
          </Button>
          <Button icon={<GithubOutlined />}>Browse organizations</Button>
        </Space>
      </Card>

      <Card title="Linked repositories" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={MOCK_REPOS} pagination={false} />
      </Card>
    </div>
  );
}
