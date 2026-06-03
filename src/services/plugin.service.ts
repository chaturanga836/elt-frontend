import api from './api';

export type PluginCatalogItem = {
  key: string;
  name: string;
  description?: string;
  version: string;
  category?: string;
  capabilities: string[];
  settings_schema?: Record<string, unknown>;
  is_available: boolean;
  enabled: boolean;
  settings: Record<string, unknown>;
};

export const PluginService = {
  getCatalog: async (workspaceId: number) => {
    const res = await api.get<{ workspace_id: number; plugins: PluginCatalogItem[] }>(
      '/plugins/catalog',
      { params: { workspace_id: workspaceId } },
    );
    return res.data;
  },

  updatePlugin: async (
    workspaceId: number,
    pluginKey: string,
    body: { enabled: boolean; settings?: Record<string, unknown>; org_id?: number },
  ) => {
    const res = await api.put(
      `/plugins/workspaces/${workspaceId}/${pluginKey}`,
      { org_id: 1, ...body },
    );
    return res.data as {
      scraper_api_key?: string;
      enabled: boolean;
    };
  },

  regenerateScraperKey: async (workspaceId: number) => {
    const res = await api.post<{ workspace_id: number; scraper_api_key: string }>(
      `/plugins/workspaces/${workspaceId}/scraping/regenerate-key`,
    );
    return res.data;
  },
};
