'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Select, notification } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import AuthProviderPageShell from './AuthProviderPageShell';
import { loadAuthProviderConfig, saveAuthProviderConfig } from './authProviderStorage';
import type { OAuth2AuthConfig } from './types';

export default function OAuth2AuthConfigPage() {
  const workspaceId = useWorkspaceId();
  const [form] = Form.useForm<OAuth2AuthConfig>();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const config = loadAuthProviderConfig(workspaceId, 'oauth2');
    setEnabled(config.enabled);
    form.setFieldsValue(config);
  }, [workspaceId, form]);

  const onEnabledChange = (next: boolean) => {
    setEnabled(next);
    const current = form.getFieldsValue(true) as OAuth2AuthConfig;
    saveAuthProviderConfig(workspaceId, 'oauth2', { ...current, enabled: next });
  };

  const onFinish = async (values: Omit<OAuth2AuthConfig, 'enabled'>) => {
    setSaving(true);
    try {
      const config: OAuth2AuthConfig = { ...values, enabled };
      saveAuthProviderConfig(workspaceId, 'oauth2', config);
      notification.success({ message: 'OAuth 2 configuration saved' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthProviderPageShell provider="oauth2" enabled={enabled} onEnabledChange={onEnabledChange}>
      <Card title="Provider settings">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="displayName"
            label="Display name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g. Company SSO" />
          </Form.Item>
          <Form.Item
            name="grantType"
            label="Grant type"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              options={[
                { value: 'authorization_code', label: 'Authorization Code' },
                { value: 'pkce', label: 'Authorization Code with PKCE' },
                { value: 'client_credentials', label: 'Client Credentials' },
                { value: 'password', label: 'Password Credentials' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="authUrl"
            label="Authorization URL"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="https://example.com/oauth2/authorize" />
          </Form.Item>
          <Form.Item
            name="tokenUrl"
            label="Token URL"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="https://example.com/oauth2/token" />
          </Form.Item>
          <Form.Item name="refreshUrl" label="Refresh token URL">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item
            name="callbackUrl"
            label="Callback URL"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="https://your-app.com/auth/callback" />
          </Form.Item>
          <Form.Item
            name="clientId"
            label="Client ID"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="clientSecret"
            label="Client secret"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="scopes" label="Scopes">
            <Input placeholder="openid email profile" />
          </Form.Item>
          <Form.Item
            name="clientAuthMethod"
            label="Client authentication"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              options={[
                { value: 'client_secret_post', label: 'Send client ID & secret in body' },
                { value: 'basic_auth', label: 'HTTP Basic Auth header' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save configuration
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </AuthProviderPageShell>
  );
}
