import api from './api';

export type AgentLlmSettings = {
  provider: string;
  model: string;
  api_key?: string | null;
  base_url?: string | null;
};

export type AgentDatabaseSettings = {
  enabled: boolean;
  db_type: 'postgres' | 'mysql' | 'mongodb' | string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string | null;
  ssl_mode: string;
  auth_source?: string | null;
};

export type AgentSettingsPublic = {
  llm: AgentLlmSettings;
  database: AgentDatabaseSettings;
  configured: boolean;
};

export type AgentSettingsUpdate = {
  llm: AgentLlmSettings;
  database: AgentDatabaseSettings;
};

export type AgentLlmCatalog = {
  providers: string[];
  suggested_models: Record<string, string[]>;
};

export type AgentDatabaseTypeInfo = {
  key: string;
  label: string;
  default_port: number;
  supports_ssl: boolean;
  database_label: string;
};

export type AgentDatabaseCatalog = {
  types: AgentDatabaseTypeInfo[];
};

export const WorkspaceAgentSettingsService = {
  getLlmCatalog: async () => {
    const res = await api.get<AgentLlmCatalog>('/workspaces/catalog/llm');
    return res.data;
  },

  getDatabaseCatalog: async () => {
    const res = await api.get<AgentDatabaseCatalog>('/workspaces/catalog/databases');
    return res.data;
  },

  get: async (workspaceId: number) => {
    const res = await api.get<AgentSettingsPublic>(
      `/workspaces/${workspaceId}/agent-settings`,
    );
    return res.data;
  },

  update: async (workspaceId: number, payload: AgentSettingsUpdate) => {
    const res = await api.put<AgentSettingsPublic>(
      `/workspaces/${workspaceId}/agent-settings`,
      payload,
    );
    return res.data;
  },

  testDatabase: async (workspaceId: number, payload: AgentSettingsUpdate) => {
    const res = await api.post<{ success: boolean; message: string }>(
      `/workspaces/${workspaceId}/agent-settings/test-database`,
      payload,
    );
    return res.data;
  },
};
