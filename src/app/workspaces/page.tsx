'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import { PlusOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceItem, WorkspaceService } from '@/services/workspace.service';

const { Title, Text } = Typography;

export default function WorkspacesPage() {
  const router = useRouter();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const orgId = useWorkspaceStore((s) => s.orgId);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspaceId);

  const [data, setData] = useState<{ items: WorkspaceItem[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [params, setParams] = useState({ page: 1, limit: 100 });

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await WorkspaceService.list({
        org_id: orgId,
        query: searchText || undefined,
        page: params.page,
        limit: params.limit,
      });
      setData({ items: res.items, total: res.total });
    } catch {
      notification.error({ message: 'Failed to load workspaces' });
    } finally {
      setLoading(false);
    }
  }, [orgId, searchText, params]);

  useEffect(() => {
    const t = setTimeout(() => void fetchWorkspaces(), 300);
    return () => clearTimeout(t);
  }, [fetchWorkspaces]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: WorkspaceItem, b: WorkspaceItem) => a.id - b.id,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Timezone',
      dataIndex: 'timezone',
      key: 'timezone',
      render: (tz: string) => <Tag>{tz}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: WorkspaceItem) => (
        <Button
          type="link"
          icon={<SettingOutlined />}
          onClick={() => {
            setCurrentWorkspaceId(record.id);
            router.push(`/workspaces/${record.id}/settings`);
          }}
        >
          Settings
        </Button>
      ),
    },
  ];

  const showEmpty = !loading && data.total === 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Workspaces
          </Title>
          <Text type="secondary">
            Select a workspace or create one to manage pipelines, connections, and plugins.
          </Text>
        </div>
        {isSuperAdmin && (
          <Link href="/workspaces/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Create a workspace
            </Button>
          </Link>
        )}
      </div>

      {!showEmpty && (
        <Card className="mb-4">
          <Input
            placeholder="Search by name or ID"
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setParams((p) => ({ ...p, page: 1 }));
            }}
            style={{ maxWidth: 400 }}
          />
        </Card>
      )}

      {showEmpty ? (
        <Card>
          <Empty
            description={
              isSuperAdmin
                ? 'No workspaces yet. Create your first workspace to get started.'
                : 'You are not assigned to any workspace yet. Contact your administrator.'
            }
          >
            {isSuperAdmin && (
              <Link href="/workspaces/new">
                <Button type="primary" icon={<PlusOutlined />}>
                  Create a workspace
                </Button>
              </Link>
            )}
          </Empty>
        </Card>
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data.items}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: data.total,
            showSizeChanger: false,
            showTotal: (total) => `${total} workspaces`,
            onChange: (page) => setParams((p) => ({ ...p, page })),
          }}
          onRow={(record) => ({
            onDoubleClick: () => {
              setCurrentWorkspaceId(record.id);
              router.push(`/workspaces/${record.id}/settings`);
            },
          })}
        />
      )}
    </div>
  );
}
