'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, Select, Space, Table, Tag, notification } from 'antd';
import {
  WorkspaceAccessService,
  WorkspaceMember,
  WorkspaceRole,
} from '@/services/workspace-access.service';

const ROLES: { label: string; value: WorkspaceRole }[] = [
  { label: 'Admin', value: 'workspace_admin' },
  { label: 'Editor', value: 'workspace_editor' },
  { label: 'Viewer', value: 'workspace_viewer' },
  { label: 'Member', value: 'workspace_user' },
];

type Props = {
  workspaceId: number;
};

export default function WorkspaceMembersTab({ workspaceId }: Props) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<
    Awaited<ReturnType<typeof WorkspaceAccessService.listInvitations>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, inv] = await Promise.all([
        WorkspaceAccessService.listMembers(workspaceId),
        WorkspaceAccessService.listInvitations(workspaceId),
      ]);
      setMembers(m);
      setInvitations(inv);
    } catch {
      notification.error({ message: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async (values: { email: string; role: WorkspaceRole }) => {
    try {
      setInviting(true);
      await WorkspaceAccessService.createInvitation(workspaceId, values);
      notification.success({ message: 'Invitation sent' });
      form.resetFields();
      void load();
    } catch {
      notification.error({ message: 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (email: string, role: WorkspaceRole) => {
    try {
      await WorkspaceAccessService.updateMemberRole(workspaceId, { email, role });
      notification.success({ message: 'Role updated' });
      void load();
    } catch {
      notification.error({ message: 'Failed to update role' });
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form
        form={form}
        layout="inline"
        onFinish={invite}
        initialValues={{ role: 'workspace_user' }}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
        >
          <Input placeholder="user@example.com" style={{ width: 260 }} />
        </Form.Item>
        <Form.Item name="role">
          <Select style={{ width: 140 }} options={ROLES} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={inviting}>
            Invite user
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
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: WorkspaceRole, row: WorkspaceMember) => (
              <Select
                value={role}
                style={{ width: 160 }}
                options={ROLES}
                onChange={(v) => void changeRole(row.email, v)}
              />
            ),
          },
          {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (s: string) => <Tag>{s}</Tag>,
          },
        ]}
      />

      {invitations.length > 0 && (
        <>
          <h4>Pending invitations</h4>
          <Table
            rowKey="id"
            size="small"
            dataSource={invitations.filter((i) => i.status === 'pending')}
            pagination={false}
            columns={[
              { title: 'Email', dataIndex: 'email' },
              { title: 'Role', dataIndex: 'role' },
              { title: 'Status', dataIndex: 'status' },
              { title: 'Expires', dataIndex: 'expires_at' },
            ]}
          />
        </>
      )}
    </Space>
  );
}
