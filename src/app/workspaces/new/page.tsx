'use client';

import React, { useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Typography, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceService } from '@/services/workspace.service';
import { projectPath } from '@/lib/paths';
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
          <Text type="secondary">Only super administrators can create projects.</Text>
          <div style={{ marginTop: 16 }}>
            <Link href="/projects">
              <Button>Back to projects</Button>
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
      notification.success({ message: 'Project created' });
      router.push(projectPath(ws.id, 'workflow'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      notification.error({ message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Link href="/projects">
          <Button type="text" icon={<ArrowLeftOutlined />}>
            Back
          </Button>
        </Link>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Create project
          </Title>
          <Text type="secondary">Set up a new BaaS project for your team.</Text>
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
              label="Project name"
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
                Create project
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
