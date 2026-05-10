'use client';

import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  ProjectOutlined,
  PlusCircleOutlined,
  AppstoreOutlined,
  SettingOutlined,
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

  const menuItems = [
    {
      key: '/pipe/list',
      icon: <ProjectOutlined />,
      label: 'Pipelines',
    },
    {
      key: '/pipe',
      icon: <PlusCircleOutlined />,
      label: 'New Pipeline',
    },
    {
      key: '/connections',
      icon: <AppstoreOutlined />,
      label: 'Connections',
    },
        {
      key: '/task',
      icon: <AppstoreOutlined />,
      label: 'Tasks',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

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
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
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