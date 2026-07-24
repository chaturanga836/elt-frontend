'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, Button, Layout, Menu, Space, theme, Typography } from 'antd';
import {
  ApiOutlined,
  DatabaseOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  GithubOutlined,
  GoogleOutlined,
  SettingOutlined,
  SwapOutlined,
  GroupOutlined,
  TableOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  AppstoreOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { logoutFromKeycloak } from '@/lib/keycloak';
import AppBrand from '@/components/brand/AppBrand';
import NotificationBell from '@/features/notifications/NotificationBell';
import { projectPath } from '@/lib/paths';
import { WorkspaceService, WorkspaceItem } from '@/services/workspace.service';

const { Sider, Content } = Layout;
const { Text } = Typography;

type SideWrapperProps = {
  workspaceId: number;
  children: React.ReactNode;
};

export default function SideWrapper({ workspaceId, children }: SideWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceItem | null>(null);
  const email = useAuthStore((s) => s.email);
  const username = useAuthStore((s) => s.username);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const base = projectPath(workspaceId);
  const apiRest = projectPath(workspaceId, 'api/rest');
  const apiGroups = projectPath(workspaceId, 'api/rest/groups');
  const dbSql = projectPath(workspaceId, 'db/sql');
  const dbTables = projectPath(workspaceId, 'db/tables');
  const storageBase = projectPath(workspaceId, 'storage');
  const realtimeBase = projectPath(workspaceId, 'realtime');
  const realtimeLogsBase = projectPath(workspaceId, 'realtime/logs');
  const queueBase = projectPath(workspaceId, 'queue');
  const queueLogsBase = projectPath(workspaceId, 'queue/logs');
  const cronBase = projectPath(workspaceId, 'cron');
  const servicesGithub = projectPath(workspaceId, 'services/github');
  const authOAuth2 = projectPath(workspaceId, 'services/auth/oauth2');
  const authKeycloak = projectPath(workspaceId, 'services/auth/keycloak');
  const authGithub = projectPath(workspaceId, 'services/auth/github');
  const authGoogle = projectPath(workspaceId, 'services/auth/google');

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    let cancelled = false;
    WorkspaceService.get(workspaceId)
      .then((ws) => {
        if (!cancelled) setWorkspace(ws);
      })
      .catch(() => {
        if (!cancelled) setWorkspace(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const menuItems = [
    {
      key: 'api-group',
      icon: <ApiOutlined />,
      label: 'API (REST)',
      children: [
        { key: apiGroups, icon: <GroupOutlined />, label: 'Groups' },
        { key: apiRest, icon: <UnorderedListOutlined />, label: 'Endpoints' },
      ],
    },
    {
      key: 'db-group',
      icon: <DatabaseOutlined />,
      label: 'DB',
      children: [
        { key: dbSql, icon: <CodeOutlined />, label: 'SQL Editor' },
        { key: dbTables, icon: <TableOutlined />, label: 'Tables' },
      ],
    },
    {
      key: storageBase,
      icon: <CloudOutlined />,
      label: 'Storage',
    },
    {
      key: 'realtime-group',
      icon: <ThunderboltOutlined />,
      label: 'Realtime',
      children: [
        { key: realtimeBase, icon: <UnorderedListOutlined />, label: 'Overview' },
        { key: realtimeLogsBase, icon: <HistoryOutlined />, label: 'Logs' },
      ],
    },
    {
      key: 'queue-group',
      icon: <InboxOutlined />,
      label: 'Queue',
      children: [
        { key: queueBase, icon: <UnorderedListOutlined />, label: 'Queues' },
        { key: queueLogsBase, icon: <HistoryOutlined />, label: 'Logs' },
      ],
    },
    {
      key: cronBase,
      icon: <ClockCircleOutlined />,
      label: 'Cron',
    },
    {
      key: 'services-group',
      icon: <AppstoreOutlined />,
      label: 'Services',
      children: [
        {
          key: 'auth-group',
          icon: <SafetyCertificateOutlined />,
          label: 'Auth',
          children: [
            { key: authOAuth2, icon: <LockOutlined />, label: 'OAuth 2' },
            { key: authKeycloak, icon: <KeyOutlined />, label: 'Keycloak' },
            { key: authGithub, icon: <GithubOutlined />, label: 'GitHub' },
            { key: authGoogle, icon: <GoogleOutlined />, label: 'Google' },
          ],
        },
        {
          key: servicesGithub,
          icon: <GithubOutlined />,
          label: 'Git Connection',
        },
      ],
    },
    {
      key: projectPath(workspaceId, 'settings'),
      icon: <SettingOutlined />,
      label: 'Project Settings',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Account',
    },
  ];

  const path = pathname.replace(/\/workspaces\//, '/projects/');

  const getSelectedMenuKey = () => {
    if (path.includes('/api/rest/groups')) {
      return apiGroups;
    }
    if (path.includes('/api/rest') || (path.includes('/connections') && !path.includes('/connections/'))) {
      return apiRest;
    }
    if (path.includes('/db/sql')) return dbSql;
    if (path.includes('/db/tables')) return dbTables;
    if (path.includes('/storage') && !path.includes('/connections/storage')) return storageBase;
    if (path.includes('/realtime/logs')) return realtimeLogsBase;
    if (path.includes('/realtime')) return realtimeBase;
    if (path.includes('/queue/logs')) return queueLogsBase;
    if (path.includes('/queue')) return queueBase;
    if (path.includes('/cron')) return cronBase;
    if (path.includes('/services/auth/oauth2')) return authOAuth2;
    if (path.includes('/services/auth/keycloak')) return authKeycloak;
    if (path.includes('/services/auth/github')) return authGithub;
    if (path.includes('/services/auth/google')) return authGoogle;
    if (path.includes('/services/github')) return servicesGithub;
    if (path.includes('/task')) return servicesGithub;
    if (path.includes('/settings') && path.startsWith(`${base}/`)) {
      return projectPath(workspaceId, 'settings');
    }
    if (path === '/settings') return '/settings';
    return path;
  };

  const getOpenKeys = () => {
    const keys: string[] = [];
    if (path.includes('/api/rest') || path.includes('/connections')) keys.push('api-group');
    if (path.includes('/db/')) keys.push('db-group');
    if (path.includes('/queue')) keys.push('queue-group');
    if (path.includes('/realtime')) keys.push('realtime-group');
    if (path.includes('/services/')) {
      keys.push('services-group');
      if (path.includes('/services/auth')) keys.push('auth-group');
    }
    return keys;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        width={220}
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          background: '#0f1128',
        }}
      >
        <div style={{ margin: collapsed ? '16px 12px' : '16px', minHeight: collapsed ? 56 : 48 }}>
          <AppBrand variant={collapsed ? 'sider-collapsed' : 'sider'} showTagline={false} />
        </div>

        {!collapsed && (
          <div style={{ padding: '0 12px 12px' }}>
            <Text
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, display: 'block' }}
              ellipsis
            >
              {workspace?.name ?? `Project #${workspaceId}`}
            </Text>
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              style={{ color: 'rgba(255,255,255,0.75)', padding: 0, height: 'auto' }}
              onClick={() => router.push('/projects')}
            >
              Switch project
            </Button>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedMenuKey()]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={({ key }) => {
            if (!key.endsWith('-group')) {
              router.push(key);
            }
          }}
        />
        <div
          style={{
            marginTop: 'auto',
            padding: collapsed ? '12px 8px' : '12px',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {collapsed ? (
            <Button
              type="text"
              style={{ color: '#fff', width: '100%' }}
              onClick={async () => {
                localStorage.removeItem('token');
                clearAuth();
                await logoutFromKeycloak(`${window.location.origin}/login`);
              }}
            >
              Out
            </Button>
          ) : (
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              <Space>
                <Avatar size="small">{(username || email || 'U').slice(0, 1).toUpperCase()}</Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <Text style={{ color: '#fff', display: 'block' }}>{username || 'User'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                    {email || 'No email'}
                  </Text>
                </div>
              </Space>
              <Button
                block
                onClick={async () => {
                  localStorage.removeItem('token');
                  clearAuth();
                  await logoutFromKeycloak(`${window.location.origin}/login`);
                }}
              >
                Logout
              </Button>
            </Space>
          )}
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 220,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
        }}
      >
        <Content style={{ background: colorBgContainer }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '8px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <NotificationBell />
          </div>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
