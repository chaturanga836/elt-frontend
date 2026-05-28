'use client';

import React, { useState } from 'react';
import { Alert, Card, Space, Switch, Typography, notification } from 'antd';
import { useWorkspacePlugins } from '@/hooks/useWorkspacePlugins';
import { PluginService } from '@/services/plugin.service';

const { Text, Paragraph } = Typography;

type Props = {
  workspaceId: number;
};

export default function WorkspacePluginsTab({ workspaceId }: Props) {
  const { plugins, loading, error, refresh } = useWorkspacePlugins(workspaceId);
  const [toggling, setToggling] = useState<string | null>(null);

  const onToggle = async (pluginKey: string, enabled: boolean) => {
    try {
      setToggling(pluginKey);
      const res = await PluginService.updatePlugin(workspaceId, pluginKey, { enabled });
      if (res.scraper_api_key) {
        notification.info({
          message: 'Scraper API key (copy now)',
          description: res.scraper_api_key,
          duration: 0,
        });
      }
      notification.success({
        message: enabled ? 'Plugin enabled' : 'Plugin disabled',
      });
      await refresh();
    } catch {
      notification.error({ message: 'Failed to update plugin' });
    } finally {
      setToggling(null);
    }
  };

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Paragraph type="secondary">
        Activate plugins to unlock scraping, AI templates, and related Task Canvas tools for
        this workspace.
      </Paragraph>
      {plugins.map((plugin) => (
        <Card key={plugin.key} loading={loading} size="small">
          <div className="flex justify-between items-start gap-4">
            <div>
              <Text strong>{plugin.name}</Text>
              <div>
                <Text type="secondary">{plugin.description}</Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  v{plugin.version} · {plugin.category}
                </Text>
              </div>
            </div>
            <Switch
              checked={plugin.enabled}
              loading={toggling === plugin.key}
              disabled={!plugin.is_available}
              onChange={(checked) => void onToggle(plugin.key, checked)}
            />
          </div>
        </Card>
      ))}
    </Space>
  );
}
