import api from './api';

export type WorkspaceDatabaseEngine = 'postgres' | 'mysql';

export type WorkspaceDatabaseEngineInfo = {
  key: WorkspaceDatabaseEngine;
  label: string;
  available: boolean;
};

export type WorkspaceDatabaseCatalog = {
  engines: WorkspaceDatabaseEngineInfo[];
};

export type WorkspaceDatabaseItem = {
  id: number;
  name: string;
  engine: WorkspaceDatabaseEngine;
  status: string;
  provisioned_at?: string;
  instance_ref?: string;
  container_created?: boolean;
};

export type WorkspaceDatabaseListResponse = {
  databases: WorkspaceDatabaseItem[];
  has_databases: boolean;
};

export type WorkspaceDatabaseStatus = {
  provisioned: boolean;
  engine?: WorkspaceDatabaseEngine;
  name?: string;
  provisioned_at?: string;
  databases?: WorkspaceDatabaseItem[];
};

export type WorkspaceDatabaseCreateBody = {
  engine: WorkspaceDatabaseEngine;
  name: string;
};

export const WorkspaceDatabaseService = {
  async getCatalog(): Promise<WorkspaceDatabaseCatalog> {
    const res = await api.get<WorkspaceDatabaseCatalog>('/workspaces/catalog/workspace-databases');
    return res.data;
  },

  async list(workspaceId: number): Promise<WorkspaceDatabaseListResponse> {
    const res = await api.get<WorkspaceDatabaseListResponse>(`/workspaces/${workspaceId}/databases`);
    return res.data;
  },

  async getStatus(workspaceId: number): Promise<WorkspaceDatabaseStatus> {
    const res = await api.get<WorkspaceDatabaseStatus>(`/workspaces/${workspaceId}/database`);
    return res.data;
  },

  async create(
    workspaceId: number,
    body: WorkspaceDatabaseCreateBody,
  ): Promise<WorkspaceDatabaseStatus> {
    const res = await api.post<WorkspaceDatabaseStatus>(
      `/workspaces/${workspaceId}/databases`,
      body,
    );
    return res.data;
  },
};
