'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Table, Typography, Tag, Space, Spin, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { connectionService } from '@/services/connection.service';
import { RestConnectionGroupDetail } from '@/types/restConnectionGroup';
import { useConnectionStore } from '@/store/useConnectionStore';

const { Title, Text } = Typography;
const TENANT = 'trial_user_001';

export default function RestApiGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.groupId);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<RestConnectionGroupDetail | null>(null);
  const setGroupContext = useConnectionStore((s) => s.setGroupContext);
  const loadFromEndpoint = useConnectionStore((s) => s.loadFromEndpoint);

  const load = async () => {
    setLoading(true);
    try {
      const data = await connectionService.getRestGroup(groupId, TENANT);
      setGroup(data);
      setGroupContext(groupId, data.name);
    } catch {
      message.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) load();
    return () => setGroupContext(null, null);
  }, [groupId, setGroupContext]);

  if (loading || !group) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 80,
      render: (m: number) => {
        const labels: Record<number, string> = { 1: 'GET', 2: 'POST', 3: 'PUT', 4: 'DELETE' };
        return <Tag>{labels[m] || m}</Tag>;
      },
    },
    { title: 'Path', dataIndex: 'path', key: 'path' },
    {
      title: 'Full URL',
      dataIndex: 'effective_url',
      ellipsis: true,
      render: (url: string) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {url}
        </Text>
      ),
    },
    {
      title: '',
      key: 'edit',
      width: 80,
      render: (_: unknown, row: { id: number }) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => {
            const ep = group.endpoints.find((e) => e.id === row.id);
            if (ep) {
              loadFromEndpoint(ep as Record<string, unknown>);
              setGroupContext(groupId, group.name);
              router.push(`/connections/rest-api/${row.id}/edit`);
            }
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-8">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        className="px-0 mb-4"
        onClick={() => router.push('/connections/rest-api/groups')}
      >
        Back to groups
      </Button>

      <div className="mb-6">
        <Title level={2} style={{ margin: 0 }}>
          {group.name}
        </Title>
        <Space className="mt-2">
          <Tag>{group.provider_key}</Tag>
          <Text type="secondary">{group.base_url}</Text>
        </Space>
      </div>

      <Card title={`Endpoints (${group.endpoints.length})`}>
        <Table
          rowKey="id"
          dataSource={group.endpoints}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
