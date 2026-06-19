'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Space, Spin, Typography, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { StudioService } from '@/services/studio.service';
import { projectPath } from '@/lib/paths';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text } = Typography;

export default function NewWorkspacePage() {
  const router = useRouter();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const orgId = useWorkspaceStore((s) => s.orgId);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspaceId);
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [canCreateProject, setCanCreateProject] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await StudioService.getAccount();
        if (!cancelled) {
          setCanCreateProject(isSuperAdmin || account.user.role === 'admin');
        }
      } catch {
        if (!cancelled) {
          setCanCreateProject(isSuperAdmin);
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  if (accountLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!canCreateProject) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4}>Access denied</Title>
          <Text type="secondary">
            Only organization administrators can create projects.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Link href="/projects">
              <Button>Back to projects</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const onFinish = async (values: { name: string; description?: string }) => {
    try {
      setLoading(true);
      const project = await StudioService.createProject(
        { name: values.name, description: values.description },
        orgId,
      );
      setCurrentWorkspaceId(project.project_id);
      notification.success({ message: 'Project created' });
      router.push(projectPath(project.project_id, 'workflow'));
    } catch (err: unknown) {
      notification.error({
        message: getApiErrorMessage(err, 'Failed to create project'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
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
          <Form form={form} layout="vertical" onFinish={onFinish}>
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
