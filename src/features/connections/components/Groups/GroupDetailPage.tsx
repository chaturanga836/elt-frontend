'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Modal, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { connectionService } from '@/services/connection.service';
import { RestConnectionGroupDetail } from '@/types/restConnectionGroup';
import { useConnectionStore } from '@/store/useConnectionStore';
import { AUTH_LABELS } from './AuthFields';
import GroupSettingsDrawer from './GroupSettingsDrawer';
import RestApiForm from '../RestApiForm';

const { Title, Text } = Typography;
const TENANT = 'trial_user_001';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.groupId);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<RestConnectionGroupDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const setGroupContext = useConnectionStore((s) => s.setGroupContext);
  const loadFromEndpoint = useConnectionStore((s) => s.loadFromEndpoint);
  const reset = useConnectionStore((s) => s.reset);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const openAddEndpoint = () => {
    reset();
    setGroupContext(groupId, group?.name || null);
    setAddModalOpen(true);
  };

  const onEndpointSaved = () => {
    setAddModalOpen(false);
    reset();
    load();
  };

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

  const groupVars = (group.variables as Array<{ key: string; value: string }>) || [];

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

      <div className="flex items-start justify-between mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {group.name}
          </Title>
          <Space className="mt-2" wrap>
            <Tag>{group.provider_key}</Tag>
            <Text type="secondary">{group.base_url}</Text>
            <Tag color="blue">{AUTH_LABELS[group.auth_type] || 'None'}</Tag>
            {groupVars.length > 0 && (
              <Tag color="green">
                {groupVars.length} variable{groupVars.length > 1 ? 's' : ''}
              </Tag>
            )}
          </Space>
        </div>
        <Button icon={<SettingOutlined />} onClick={() => setDrawerOpen(true)}>
          Group Settings
        </Button>
      </div>

      <Card
        title={`Endpoints (${group.endpoints.length})`}
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAddEndpoint}>
            Add Endpoint
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={group.endpoints}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>

      <GroupSettingsDrawer
        group={group}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
      />

      <Modal
        title={`Add Endpoint to ${group.name}`}
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); reset(); }}
        footer={null}
        width={900}
        destroyOnClose
        afterClose={() => { reset(); setGroupContext(groupId, group.name); }}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <RestApiForm onSaved={onEndpointSaved} />
        </div>
      </Modal>
    </div>
  );
}
