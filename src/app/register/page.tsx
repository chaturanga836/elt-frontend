'use client';

import Link from 'next/link';
import { Button, Form, Input, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import { profileFromAccessToken, storeAuthTokens } from '@/lib/keycloak';
import { isSuperAdminToken } from '@/lib/jwt';
import { AuthService } from '@/services/auth.service';
import { OrganizationService } from '@/services/organization.service';
import { UserService } from '@/services/user.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { getApiErrorMessage } from '@/lib/formatApiError';

type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  first_name?: string;
  last_name?: string;
  org_name?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm<RegisterFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setOrgId = useWorkspaceStore((s) => s.setOrgId);

  useEffect(() => {
    if (isAuthenticated) router.replace('/workspaces');
  }, [isAuthenticated, router]);

  const onFinish = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      const result = await AuthService.signup({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        org_name: values.org_name,
        create_default_project: false,
      });

      if (!result.access_token) {
        message.success('Account created. Please sign in.');
        router.push('/login');
        return;
      }

      storeAuthTokens(result.access_token, result.refresh_token ?? undefined);

      const kcProfile = profileFromAccessToken(result.access_token);
      let isSuperAdmin = isSuperAdminToken(result.access_token);
      let realmRoles: string[] = [];
      let workspaceIds: number[] = [];

      try {
        const me = await UserService.getMe();
        isSuperAdmin = me.is_super_admin;
        realmRoles = me.realm_roles;
        workspaceIds = me.workspace_ids;
      } catch {
        /* profile optional if backend unreachable */
      }

      try {
        const org = await OrganizationService.getDefault();
        setOrgId(org.organization_id);
      } catch {
        /* default org optional */
      }

      setAuth({
        token: result.access_token,
        username: kcProfile?.username || values.email,
        email: result.email,
        isSuperAdmin,
        realmRoles,
        workspaceIds,
      });

      message.success('Account created successfully');
      router.replace('/workspaces');
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your organization and default workspace in one step."
      wide
      footer={
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="you@company.com" autoComplete="email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Password is required' },
            { min: 8, message: 'At least 8 characters' },
          ]}
        >
          <Input.Password placeholder="Minimum 8 characters" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Repeat password" autoComplete="new-password" />
        </Form.Item>

        <Form.Item name="first_name" label="First name (optional)">
          <Input placeholder="Jane" autoComplete="given-name" />
        </Form.Item>

        <Form.Item name="last_name" label="Last name (optional)">
          <Input placeholder="Doe" autoComplete="family-name" />
        </Form.Item>

        <Form.Item name="org_name" label="Organization name (optional)">
          <Input placeholder="Acme Data Team" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<UserAddOutlined />}
            loading={submitting}
            style={{ height: 48 }}
          >
            Create account
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
}
