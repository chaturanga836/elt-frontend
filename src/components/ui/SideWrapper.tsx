'use client';

import React, { useState } from 'react';
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
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { logoutFromKeycloak } from '@/lib/keycloak';

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function SideWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const email = useAuthStore((s) => s.email);
  const username = useAuthStore((s) => s.username);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Nested grouping structures inside AntD require unique parenting keys
  const menuItems = [
    {
      key: '/workspaces',
      icon: <AppstoreOutlined />,
      label: 'Workspaces',
    },
    {
      key: 'pipelines-group',
      icon: <ProjectOutlined />,
      label: 'Pipelines',
      children: [
        {
          key: '/pipe',
          icon: <UnorderedListOutlined />,
          label: 'All Pipelines',
        },
        {
          key: '/pipe/history',
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
          key: '/workflow',
          icon: <UnorderedListOutlined />,
          label: 'All Workflows',
        },
        {
          key: '/workflow/new',
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
          key: '/connections/rest-api/groups',
          icon: <GroupOutlined />,
          label: 'Groups',
        },
        {
          key: '/connections',
          icon: <AppstoreOutlined />,
          label: 'Standalone',
        },
      ],
    },
    {
      key: '/task',
      icon: <AppstoreOutlined />,
      label: 'Tasks',
    },
    {
      key: '/external-links',
      icon: <SafetyCertificateOutlined />,
      label: 'External Links',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const getSelectedMenuKey = () => {
    if (pathname.startsWith('/pipe/history')) {
      return '/pipe/history';
    }
    if (pathname.startsWith('/workflow/new')) {
      return '/workflow/new';
    }
    if (pathname.startsWith('/workflow')) {
      return '/workflow';
    }
    if (pathname.startsWith('/connections/rest-api/groups')) {
      return '/connections/rest-api/groups';
    }
    if (pathname.startsWith('/connections')) {
      return '/connections';
    }
    if (pathname.startsWith('/external-links')) {
      return '/external-links';
    }
    if (pathname.startsWith('/workspaces')) {
      return '/workspaces';
    }
    if (pathname === '/settings') {
      return '/settings';
    }
    return pathname;
  };

  const getSelectedParentKeys = () => {
    const keys: string[] = [];
    if (pathname.startsWith('/pipe')) {
      keys.push('pipelines-group');
    }
    if (pathname.startsWith('/workflow')) {
      keys.push('workflows-group');
    }
    if (pathname.startsWith('/connections')) {
      keys.push('connections-group');
    }
    return keys;
  };

  if (pathname === '/login' || pathname === '/auth/callback') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

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
        <div style={{ 
          height: 32, 
          margin: '16px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: collapsed ? '12px' : '14px'
        }}>
          {collapsed ? 'ELT' : 'ELT ENGINE'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedMenuKey()]}
          defaultOpenKeys={getSelectedParentKeys()}
          items={menuItems}
          onClick={({ key }) => {
            // Only route if clicking actionable items with path keys, not group container headers
            if (!key.endsWith('-group')) {
              router.push(key);
            }
          }}
        />
        <div style={{ marginTop: 'auto', padding: collapsed ? '12px 8px' : '12px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
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
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{email || 'No email'}</Text>
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

      {/* This layout shifts based on sidebar width */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 220, 
        transition: 'margin-left 0.2s',
        minHeight: '100vh' 
      }}>
        <Content style={{ background: colorBgContainer }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}