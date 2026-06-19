'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Input,
  Spin,
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
import { StudioService } from '@/services/studio.service';
import AppBrand from '@/components/brand/AppBrand';
import { projectPath } from '@/lib/paths';

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
  const [accountLoading, setAccountLoading] = useState(true);
  const [canCreateProject, setCanCreateProject] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [params, setParams] = useState({ page: 1, limit: 100 });
  const autoEntered = useRef(false);

  const openWorkspace = useCallback(
    (id: number) => {
      setCurrentWorkspaceId(id);
      router.push(projectPath(id, 'workflow'));
    },
    [router, setCurrentWorkspaceId],
  );

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

      if (!autoEntered.current && res.total === 1 && res.items[0]) {
        autoEntered.current = true;
        openWorkspace(res.items[0].id);
        return;
      }
    } catch {
      notification.error({ message: 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  }, [orgId, searchText, params, openWorkspace]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await StudioService.getAccount();
        if (!cancelled) {
          setCanCreateProject(isSuperAdmin || account.user.role === 'admin');
        }
      } catch {
        if (!cancelled) {
          setCanCreateProject(isSuperAdmin);
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

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
          onClick={(e) => {
            e.stopPropagation();
            setCurrentWorkspaceId(record.id);
            router.push(projectPath(record.id, 'settings'));
          }}
        >
          Settings
        </Button>
      ),
    },
  ];

  const showEmpty = !loading && !accountLoading && data.total === 0;

  if ((loading || accountLoading) && data.total === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (showEmpty) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <Empty
            description={
              canCreateProject
                ? "You don't have a project yet. Create your first project to get started."
                : 'You are not assigned to any project yet. Contact your administrator.'
            }
          >
            {canCreateProject && (
              <Link href="/projects/new">
                <Button type="primary" size="large" icon={<PlusOutlined />}>
                  Create project
                </Button>
              </Link>
            )}
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8" style={{ minHeight: '100vh' }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div style={{ marginBottom: 12 }}>
            <AppBrand variant="header" />
          </div>
          <Title level={2} style={{ margin: 0 }}>
            Projects
          </Title>
          <Text type="secondary">Select a project to manage API, database, storage, and workflows.</Text>
        </div>
        {canCreateProject && (
          <Link href="/projects/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Create project
            </Button>
          </Link>
        )}
      </div>

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
          showTotal: (total) => `${total} projects`,
          onChange: (page) => setParams((p) => ({ ...p, page })),
        }}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => openWorkspace(record.id),
        })}
      />
    </div>
  );
}
