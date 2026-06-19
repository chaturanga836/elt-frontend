'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
  notification,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useWorkspacePlugins } from '@/hooks/useWorkspacePlugins';
import { PluginService } from '@/services/plugin.service';

const { Text, Paragraph } = Typography;

const SCRAPING_PLUGIN_KEY = 'scraping';

type Props = {
  workspaceId: number;
};

export default function WorkspacePluginsTab({ workspaceId }: Props) {
  const { plugins, loading, error, refresh } = useWorkspacePlugins(workspaceId);
  const [toggling, setToggling] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [scraperKey, setScraperKey] = useState<string | null>(null);

  const copyScraperKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      message.success('API key copied to clipboard');
    } catch {
      message.error('Could not copy to clipboard');
    }
  };

  const onToggle = async (pluginKey: string, enabled: boolean) => {
    try {
      setToggling(pluginKey);
      const res = await PluginService.updatePlugin(workspaceId, pluginKey, { enabled });
      if (res.scraper_api_key) {
        setScraperKey(res.scraper_api_key);
      }
      if (!enabled && pluginKey === SCRAPING_PLUGIN_KEY) {
        setScraperKey(null);
      }
      notification.success({
        message: enabled ? 'Plugin enabled' : 'Plugin disabled',
        description:
          res.scraper_api_key && pluginKey === SCRAPING_PLUGIN_KEY
            ? 'Copy your scraper API key below. REST group Scrape URL was (re)created — key is shown once.'
            : undefined,
      });
      await refresh();
    } catch {
      notification.error({ message: 'Failed to update plugin' });
    } finally {
      setToggling(null);
    }
  };

  const onRegenerateKey = () => {
    Modal.confirm({
      title: 'Regenerate scraper API key?',
      content:
        'The current key will stop working immediately. Update any jobs or scripts that use it.',
      okText: 'Regenerate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setRegenerating(true);
          const res = await PluginService.regenerateScraperKey(workspaceId);
          setScraperKey(res.scraper_api_key);
          message.success('New scraper API key generated');
        } catch {
          message.error('Failed to regenerate API key');
        } finally {
          setRegenerating(false);
        }
      },
    });
  };

  if (error) {
    return <Alert type="error" title={error} />;
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Paragraph type="secondary">
        Activate plugins to unlock scraping, AI templates, and related Task Canvas tools for
        this workspace.
      </Paragraph>
      {plugins.map((plugin) => {
        const isScraping = plugin.key === SCRAPING_PLUGIN_KEY;
        const showKeyPanel = isScraping && plugin.enabled;

        return (
          <Card key={plugin.key} loading={loading} size="small">
            <div className="flex justify-between items-start gap-4">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong>{plugin.name}</Text>
                <div>
                  <Text type="secondary">{plugin.description}</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    v{plugin.version} · {plugin.category}
                  </Text>
                </div>

                {showKeyPanel ? (
                  <div style={{ marginTop: 16, maxWidth: 520 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                      Scraper API key
                      {scraperKey
                        ? ' — copy now; it will not be shown again after you leave this page.'
                        : ' — hidden after first view. Regenerate if you lost it.'}
                    </Text>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        readOnly
                        value={scraperKey ?? ''}
                        placeholder="••••••••••••••••••••••••••••••••"
                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                      />
                      <Tooltip title={scraperKey ? 'Copy to clipboard' : 'Generate a key first'}>
                        <Button
                          icon={<CopyOutlined />}
                          disabled={!scraperKey}
                          onClick={() => scraperKey && void copyScraperKey(scraperKey)}
                        />
                      </Tooltip>
                    </Space.Compact>
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={regenerating}
                      onClick={onRegenerateKey}
                      style={{ paddingLeft: 0, marginTop: 4 }}
                    >
                      Regenerate API key
                    </Button>
                  </div>
                ) : null}
              </div>
              <Switch
                checked={plugin.enabled}
                loading={toggling === plugin.key}
                disabled={!plugin.is_available}
                onChange={(checked) => void onToggle(plugin.key, checked)}
              />
            </div>
          </Card>
        );
      })}
    </Space>
  );
}
