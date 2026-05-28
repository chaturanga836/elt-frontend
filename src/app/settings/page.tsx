'use client';

import React from 'react';
import { Avatar, Card, Descriptions, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const username = useAuthStore((s) => s.username);
  const email = useAuthStore((s) => s.email);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const realmRoles = useAuthStore((s) => s.realmRoles);
  const workspaceIds = useAuthStore((s) => s.workspaceIds);

  return (
    <div className="p-8 max-w-2xl">
      <Title level={2} style={{ marginTop: 0 }}>
        Account
      </Title>
      <Text type="secondary">Your profile after sign-in.</Text>

      <Card className="mt-6">
        <Space align="start" size="large">
          <Avatar size={64}>{(username || email || 'U').slice(0, 1).toUpperCase()}</Avatar>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Username">{username || '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Platform role">
              {isSuperAdmin ? <Tag color="gold">Super Admin</Tag> : <Tag>User</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Realm roles">
              {realmRoles.length ? realmRoles.map((r) => <Tag key={r}>{r}</Tag>) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Workspace access">
              {workspaceIds.length
                ? workspaceIds.map((id) => <Tag key={id}>WS #{id}</Tag>)
                : 'No workspace groups assigned'}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <Card className="mt-4" title="Workspace administration">
        <Text type="secondary">
          Manage workspaces, invitations, timezones, and plugins from the{' '}
          <Link href="/workspaces">workspaces</Link> page.
          {isSuperAdmin && ' As super admin, you can create new workspaces.'}
        </Text>
      </Card>
    </div>
  );
}
