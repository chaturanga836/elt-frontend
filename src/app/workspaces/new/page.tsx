'use client';

import React, { useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Typography, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceService } from '@/services/workspace.service';
import { COMMON_TIMEZONES } from '@/constants/timezones';

const { Title, Text } = Typography;

export default function NewWorkspacePage() {
  const router = useRouter();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const orgId = useWorkspaceStore((s) => s.orgId);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspaceId);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  if (!isSuperAdmin) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4}>Access denied</Title>
          <Text type="secondary">Only super administrators can create workspaces.</Text>
          <div style={{ marginTop: 16 }}>
            <Link href="/workspaces">
              <Button>Back to workspaces</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const onFinish = async (values: {
    name: string;
    description?: string;
    timezone: string;
  }) => {
    try {
      setLoading(true);
      const ws = await WorkspaceService.create(orgId, values);
      setCurrentWorkspaceId(ws.id);
      notification.success({ message: 'Workspace created' });
      router.push(`/workspaces/${ws.id}/settings`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace';
      notification.error({ message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Link href="/workspaces">
          <Button type="text" icon={<ArrowLeftOutlined />}>
            Back
          </Button>
        </Link>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Create workspace
          </Title>
          <Text type="secondary">Set up a new workspace for your team.</Text>
        </div>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ timezone: 'UTC' }}
          >
            <Form.Item
              name="name"
              label="Workspace name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input placeholder="e.g. Research Team" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Optional description" />
            </Form.Item>
            <Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}>
              <Select
                showSearch
                options={COMMON_TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Create workspace
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
