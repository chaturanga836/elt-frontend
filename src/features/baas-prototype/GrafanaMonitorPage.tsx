'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Empty, Space, Spin, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { StudioService } from '@/services/studio.service';
import {
  resolvePublicGrafanaUrl,
  resolvePublicUrlFromLocalhostDefault,
} from '@/lib/publicUrls';
import { getApiErrorMessage } from '@/lib/formatApiError';

const { Title, Text, Paragraph } = Typography;

function resolveEmbedUrl(apiUrl: string | null | undefined): string | null {
  const fromApi = (apiUrl || '').trim();
  if (fromApi) {
    return resolvePublicUrlFromLocalhostDefault(fromApi);
  }
  return resolvePublicGrafanaUrl();
}

export default function GrafanaMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [grafanaUrl, setGrafanaUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const config = await StudioService.getMonitoringConfig();
        if (cancelled) return;
        if (config.enabled && config.grafana_url) {
          setGrafanaUrl(resolveEmbedUrl(config.grafana_url));
        } else {
          setGrafanaUrl(resolvePublicGrafanaUrl());
        }
      } catch (err) {
        if (cancelled) return;
        // Fall back to build-time / local default if the API is older or unreachable.
        setGrafanaUrl(resolvePublicGrafanaUrl());
        if (!resolvePublicGrafanaUrl()) {
          setError(getApiErrorMessage(err, 'Could not load monitoring configuration'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          Loading Grafana…
        </Paragraph>
      </div>
    );
  }

  if (!grafanaUrl) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Grafana
        </Title>
        {error ? (
          <Alert type="error" showIcon style={{ marginBottom: 16 }} title={error} />
        ) : null}
        <Empty
          description={
            <Space orientation="vertical" size={4}>
              <Text>Monitoring is not configured for this platform.</Text>
              <Text type="secondary">
                Enable Grafana in the installer (Install for me or Connect existing), then reopen
                this page. The API must have <Text code>GRAFANA_URL</Text> set from install.
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
