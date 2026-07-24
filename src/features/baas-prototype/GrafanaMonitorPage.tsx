'use client';

import React, { useMemo } from 'react';
import { Alert, Button, Empty, Space, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { resolvePublicGrafanaUrl } from '@/lib/publicUrls';

const { Title, Text, Paragraph } = Typography;

export default function GrafanaMonitorPage() {
  const grafanaUrl = useMemo(() => resolvePublicGrafanaUrl(), []);

  if (!grafanaUrl) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Grafana
        </Title>
        <Empty
          description={
            <Space orientation="vertical" size={4}>
              <Text>Monitoring is not configured for this platform.</Text>
              <Text type="secondary">
                Enable Grafana in the installer (bundled or external), or set{' '}
                <Text code>NEXT_PUBLIC_GRAFANA_URL</Text> and rebuild Studio.
              </Text>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 49px)',
        minHeight: 480,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Grafana
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Platform metrics and dashboards
          </Paragraph>
        </div>
        <Button
          type="link"
          icon={<LinkOutlined />}
          href={grafanaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ margin: '12px 16px 0', flexShrink: 0 }}
        title="Sign in with your Grafana admin credentials if prompted."
        description="Embedding must be allowed on the Grafana server (enabled for the bundled monitoring stack)."
      />

      <iframe
        title="Grafana"
        src={grafanaUrl}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          marginTop: 12,
          background: '#111',
        }}
        allow="fullscreen"
      />
    </div>
  );
}
