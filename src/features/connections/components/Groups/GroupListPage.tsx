'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Table, Typography, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, FolderOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connectionService } from '@/services/connection.service';
import { RestConnectionGroup } from '@/types/restConnectionGroup';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { workspacePath } from '@/lib/paths';

const { Title, Text } = Typography;

export default function GroupListPage() {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<RestConnectionGroup[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setGroups(await connectionService.listRestGroups(workspaceId));
    } catch {
      message.error('Failed to load connection groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    {
      title: 'Group',
      key: 'name',
      render: (_: unknown, row: RestConnectionGroup) => (
        <Space>
          <FolderOutlined className="text-blue-500" />
          <Text strong>{row.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Provider',
      dataIndex: 'provider_key',
      render: (key: string) => <Tag>{key}</Tag>,
    },
    {
      title: 'Base URL',
      dataIndex: 'base_url',
      ellipsis: true,
    },
    {
      title: 'Endpoints',
      dataIndex: 'endpoint_count',
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: RestConnectionGroup) => (
        <Space>
          <Button type="link" onClick={() => router.push(workspacePath(workspaceId, `connections/rest-api/groups/${row.id}`))}>
            Open
          </Button>
          <Popconfirm
            title="Delete group and all endpoints?"
            onConfirm={async () => {
              await connectionService.deleteRestGroup(row.id, workspaceId);
              message.success('Group deleted');
              load();
            }}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        className="px-0 mb-4"
        onClick={() => router.push(workspacePath(workspaceId, 'connections'))}
      >
        Back to Connections
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            REST API Groups
          </Title>
          <Text type="secondary">
            Share base URL and credentials across multiple endpoints
          </Text>
        </div>
        <Space>
          <Button onClick={() => router.push(workspacePath(workspaceId, 'connections/rest-api'))}>
            Standalone REST
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push(workspacePath(workspaceId, 'connections/rest-api/groups/new'))}
          >
            New Group
          </Button>
        </Space>
      </div>

      <Card>
        <Table rowKey="id" loading={loading} dataSource={groups} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
