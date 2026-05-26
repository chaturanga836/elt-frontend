'use client';

import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
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

const { Sider, Content } = Layout;

export default function SideWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Nested grouping structures inside AntD require unique parenting keys
  const menuItems = [
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
          zIndex: 1000 
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