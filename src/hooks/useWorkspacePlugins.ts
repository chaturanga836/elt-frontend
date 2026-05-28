'use client';

import { useCallback, useEffect, useState } from 'react';
import { PluginCatalogItem, PluginService } from '@/services/plugin.service';

export function useWorkspacePlugins(workspaceId: number | null) {
  const [plugins, setPlugins] = useState<PluginCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setPlugins([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await PluginService.getCatalog(workspaceId);
      setPlugins(data.plugins);
    } catch {
      setError('Failed to load plugins');
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { plugins, loading, error, refresh };
}
