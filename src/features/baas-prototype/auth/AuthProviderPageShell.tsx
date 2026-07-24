'use client';

import React from 'react';
import { Alert, Card, Space, Switch, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { AUTH_PROVIDER_META, AuthProviderId } from './types';

const { Title, Text, Paragraph } = Typography;

type Props = {
  provider: AuthProviderId;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: React.ReactNode;
};

export default function AuthProviderPageShell({
  provider,
  enabled,
  onEnabledChange,
  children,
}: Props) {
  const meta = AUTH_PROVIDER_META[provider];
  const installCmd = meta.packageName ? `npm install ${meta.packageName}` : null;

  const copyInstall = async () => {
    if (!installCmd) return;
    try {
      await copyToClipboard(installCmd);
      message.success('Install command copied');
    } catch {
      message.error('Could not copy to clipboard');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <Space orientation="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {meta.label}
        </Title>
        <Text type="secondary">{meta.description}</Text>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Text strong>Enable provider</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
              When enabled, apps in this project can use this auth integration.
            </Paragraph>
          </div>
          <Switch checked={enabled} onChange={onEnabledChange} />
        </Space>
      </Card>

      {installCmd ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Platform package"
          description={
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              <Text>
                Use the DT Orch package in your app. Configure credentials below; the package
                handles the OAuth flow.
              </Text>
              <Space>
                <Text code>{installCmd}</Text>
                <CopyOutlined
                  role="button"
                  aria-label="Copy install command"
                  style={{ cursor: 'pointer' }}
                  onClick={() => void copyInstall()}
                />
              </Space>
              <Text code style={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                {`import { createAuth } from '${meta.packageName}';\n\nconst auth = createAuth({\n  clientId: process.env.AUTH_CLIENT_ID!,\n  clientSecret: process.env.AUTH_CLIENT_SECRET!,\n  callbackUrl: process.env.AUTH_CALLBACK_URL!,\n});`}
              </Text>
            </Space>
          }
        />
      ) : (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Bring your own OAuth 2.0 provider"
          description="Point authorize and token URLs at any standards-compatible IdP. No platform package is required."
        />
      )}

      {children}
    </div>
  );
}
