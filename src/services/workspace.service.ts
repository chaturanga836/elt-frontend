import api from './api';

export type WorkspaceItem = {
  id: number;
  org_id: number;
  name: string;
  description?: string | null;
  timezone: string;
  created_at?: string | null;
};

export type WorkspaceListResponse = {
  items: WorkspaceItem[];
  total: number;
  page: number;
  limit: number;
};

export const WorkspaceService = {
  list: async (params: {
    org_id?: number;
    query?: string;
    page?: number;
    limit?: number;
  }): Promise<WorkspaceListResponse> => {
    const res = await api.get<WorkspaceListResponse>('/workspaces/', { params });
    return res.data;
  },

  get: async (workspaceId: number): Promise<WorkspaceItem> => {
    const res = await api.get<WorkspaceItem>(`/workspaces/${workspaceId}`);
    return res.data;
  },

  create: async (
    orgId: number,
    body: { name: string; description?: string; timezone?: string },
  ): Promise<WorkspaceItem> => {
    const res = await api.post<WorkspaceItem>(`/workspaces/${orgId}`, body);
    return res.data;
  },

  update: async (
    workspaceId: number,
    body: { name?: string; description?: string; timezone?: string },
  ): Promise<WorkspaceItem> => {
    const res = await api.patch<WorkspaceItem>(`/workspaces/${workspaceId}`, body);
    return res.data;
  },
};
