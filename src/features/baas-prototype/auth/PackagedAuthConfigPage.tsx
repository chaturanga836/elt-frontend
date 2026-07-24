'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, notification } from 'antd';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import AuthProviderPageShell from './AuthProviderPageShell';
import { loadAuthProviderConfig, saveAuthProviderConfig } from './authProviderStorage';
import type { AuthProviderId, PackagedAuthConfig } from './types';

type PackagedProvider = Exclude<AuthProviderId, 'oauth2'>;

type Props = {
  provider: PackagedProvider;
};

export default function PackagedAuthConfigPage({ provider }: Props) {
  const workspaceId = useWorkspaceId();
  const [form] = Form.useForm<PackagedAuthConfig>();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const config = loadAuthProviderConfig(workspaceId, provider);
    setEnabled(config.enabled);
    form.setFieldsValue(config);
  }, [workspaceId, provider, form]);

  const onEnabledChange = (next: boolean) => {
    setEnabled(next);
    const current = form.getFieldsValue(true) as PackagedAuthConfig;
    saveAuthProviderConfig(workspaceId, provider, { ...current, enabled: next });
  };

  const onFinish = async (values: Omit<PackagedAuthConfig, 'enabled'>) => {
    setSaving(true);
    try {
      const config: PackagedAuthConfig = { ...values, enabled };
      saveAuthProviderConfig(workspaceId, provider, config);
      notification.success({ message: 'Auth configuration saved' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthProviderPageShell
      provider={provider}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
    >
      <Card title="Provider settings">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="displayName"
            label="Display name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder={`e.g. ${provider === 'github' ? 'GitHub Login' : 'Sign in'}`} />
          </Form.Item>

          {provider === 'keycloak' ? (
            <>
              <Form.Item
                name="serverUrl"
                label="Keycloak server URL"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="https://keycloak.example.com" />
              </Form.Item>
              <Form.Item
                name="realm"
                label="Realm"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="my-realm" />
              </Form.Item>
            </>
          ) : null}

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
          <Form.Item
            name="callbackUrl"
            label="Callback URL"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="https://your-app.com/auth/callback" />
          </Form.Item>
          <Form.Item name="scopes" label="Scopes">
            <Input />
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
