'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, Button, Layout, Menu, Space, theme, Typography } from 'antd';
import {
  ProjectOutlined,
  PlusCircleOutlined,
  AppstoreOutlined,
  SettingOutlined,
  HistoryOutlined,
  UnorderedListOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  GroupOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { logoutFromKeycloak } from '@/lib/keycloak';
import AppBrand from '@/components/brand/AppBrand';
import { workspacePath } from '@/lib/paths';
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

  const base = workspacePath(workspaceId);
  const pipeBase = workspacePath(workspaceId, 'pipe');
  const workflowBase = workspacePath(workspaceId, 'workflow');
  const connectionsBase = workspacePath(workspaceId, 'connections');

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
      key: 'pipelines-group',
      icon: <ProjectOutlined />,
      label: 'Pipelines',
      children: [
        {
          key: pipeBase,
          icon: <UnorderedListOutlined />,
          label: 'All Pipelines',
        },
        {
          key: `${pipeBase}/history`,
          icon: <HistoryOutlined />,
          label: 'Run History',
        },
      ],
    },
    {
      key: 'workflows-group',
      icon: <NodeIndexOutlined />,
      label: 'Workflows',
      children: [
        {
          key: workflowBase,
          icon: <UnorderedListOutlined />,
          label: 'All Workflows',
        },
        {
          key: `${workflowBase}/new`,
          icon: <PlusCircleOutlined />,
          label: 'New Workflow',
        },
      ],
    },
    {
      key: 'connections-group',
      icon: <ApiOutlined />,
      label: 'Connections',
      children: [
        {
          key: `${connectionsBase}/rest-api/groups`,
          icon: <GroupOutlined />,
          label: 'Groups',
        },
        {
          key: connectionsBase,
          icon: <AppstoreOutlined />,
          label: 'Standalone',
        },
      ],
    },
    {
      key: workspacePath(workspaceId, 'task'),
      icon: <AppstoreOutlined />,
      label: 'Tasks',
    },
    {
      key: workspacePath(workspaceId, 'external-links'),
      icon: <SafetyCertificateOutlined />,
      label: 'External Links',
    },
    {
      key: workspacePath(workspaceId, 'reports'),
      icon: <FilePdfOutlined />,
      label: 'Reports',
    },
    {
      key: workspacePath(workspaceId, 'settings'),
      icon: <SettingOutlined />,
      label: 'Workspace Settings',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Account',
    },
  ];

  const wsPrefix = `${base}/`;

  const getSelectedMenuKey = () => {
    if (pathname.includes('/pipe/history')) {
      return `${pipeBase}/history`;
    }
    if (pathname.includes('/workflow/new')) {
      return `${workflowBase}/new`;
    }
    if (pathname.includes('/workflow')) {
      return workflowBase;
    }
    if (pathname.includes('/connections/rest-api/groups')) {
      return `${connectionsBase}/rest-api/groups`;
    }
    if (pathname.includes('/connections')) {
      return connectionsBase;
    }
    if (pathname.includes('/external-links')) {
      return workspacePath(workspaceId, 'external-links');
    }
    if (pathname.includes('/reports')) {
      return workspacePath(workspaceId, 'reports');
    }
    if (pathname.includes('/settings') && pathname.startsWith(wsPrefix)) {
      return workspacePath(workspaceId, 'settings');
    }
    if (pathname === '/settings') {
      return '/settings';
    }
    if (pathname.includes('/task')) {
      return workspacePath(workspaceId, 'task');
    }
    if (pathname.includes('/pipe')) {
      return pipeBase;
    }
    return pathname;
  };

  const getSelectedParentKeys = () => {
    const keys: string[] = [];
    if (pathname.includes('/pipe')) {
      keys.push('pipelines-group');
    }
    if (pathname.includes('/workflow')) {
      keys.push('workflows-group');
    }
    if (pathname.includes('/connections')) {
      keys.push('connections-group');
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
              {workspace?.name ?? `Workspace #${workspaceId}`}
            </Text>
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              style={{ color: 'rgba(255,255,255,0.75)', padding: 0, height: 'auto' }}
              onClick={() => router.push('/workspaces')}
            >
              Switch workspace
            </Button>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedMenuKey()]}
          defaultOpenKeys={getSelectedParentKeys()}
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
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
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
        <Content style={{ background: colorBgContainer }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
