'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, Select, Space, Table, Tag, Typography, notification } from 'antd';
import {
  OrganizationSettingsService,
  OrgMember,
  OrgRole,
} from '@/services/organization-settings.service';

const ROLES: { label: string; value: OrgRole; description: string }[] = [
  {
    label: 'Owner',
    value: 'owner',
    description: 'Full access including account settings',
  },
  {
    label: 'Admin',
    value: 'admin',
    description: 'Full project access; cannot change account settings',
  },
  {
    label: 'Developer',
    value: 'developer',
    description: 'Project content only; no account or project settings',
  },
];

const { Text } = Typography;

export default function OrgMembersTab() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<
    Awaited<ReturnType<typeof OrganizationSettingsService.listInvitations>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, inv] = await Promise.all([
        OrganizationSettingsService.listMembers(),
        OrganizationSettingsService.listInvitations(),
      ]);
      setMembers(m);
      setInvitations(inv);
    } catch {
      notification.error({ message: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async (values: { email: string; role: OrgRole }) => {
    try {
      setInviting(true);
      await OrganizationSettingsService.inviteMember(values);
      notification.success({ message: 'Invitation sent' });
      form.resetFields();
      void load();
    } catch {
      notification.error({ message: 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (email: string, role: OrgRole) => {
    try {
      await OrganizationSettingsService.updateMemberRole({ email, role });
      notification.success({ message: 'Role updated' });
      void load();
    } catch {
      notification.error({ message: 'Failed to update role' });
    }
  };

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Text type="secondary">
          Invite members by email and assign an account role. Owners manage account settings;
          admins manage projects; developers work on project content only.
        </Text>
      </div>

      <Form
        form={form}
        layout="inline"
        onFinish={invite}
        initialValues={{ role: 'developer' }}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
        >
          <Input placeholder="user@example.com" style={{ width: 260 }} />
        </Form.Item>
        <Form.Item name="role">
          <Select
            style={{ width: 160 }}
            options={ROLES.map((r) => ({ label: r.label, value: r.value }))}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={inviting}>
            Invite member
          </Button>
        </Form.Item>
      </Form>

      <Table
        rowKey="email"
        loading={loading}
        dataSource={members}
        pagination={false}
        columns={[
          { title: 'Email', dataIndex: 'email', key: 'email' },
          {
            title: 'Name',
            key: 'name',
            render: (_: unknown, row: OrgMember) =>
              row.display_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || '—',
          },
          {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: OrgRole, row: OrgMember) => (
              <Select
                value={role}
                style={{ width: 160 }}
                options={ROLES.map((r) => ({ label: r.label, value: r.value }))}
                onChange={(v) => void changeRole(row.email, v)}
              />
            ),
          },
          {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => (
              <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
            ),
          },
        ]}
      />

      {invitations.length > 0 && (
        <>
          <h4>Pending invitations</h4>
          <Table
            rowKey="id"
            dataSource={invitations}
            pagination={false}
            columns={[
              { title: 'Email', dataIndex: 'email', key: 'email' },
              { title: 'Role', dataIndex: 'role', key: 'role' },
              { title: 'Invited by', dataIndex: 'invited_by', key: 'invited_by' },
              {
                title: 'Expires',
                dataIndex: 'expires_at',
                key: 'expires_at',
                render: (v: string) => new Date(v).toLocaleString(),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => <Tag>{s}</Tag>,
              },
            ]}
          />
        </>
      )}
    </Space>
  );
}
