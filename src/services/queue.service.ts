import api from './api';

export type QueueBroker = 'postgres' | 'redis' | 'rabbitmq';

export type QueueItem = {
  id: number;
  name: string;
  description?: string | null;
  max_depth: number;
  depth: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type QueueLogItem = {
  id: number;
  queue_id: number;
  action: string;
  message_id?: number | null;
  actor?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WorkspaceQueueStatus = {
  enabled: boolean;
  broker: QueueBroker;
};

export const QueueService = {
  getStatus: async (workspaceId: number): Promise<WorkspaceQueueStatus> => {
    const res = await api.get<WorkspaceQueueStatus>(
      `/workspaces/${workspaceId}/queue-status`,
    );
    return res.data;
  },

  updateOrgSettings: async (
    workspaceId: number,
    body: { enabled: boolean; broker: QueueBroker },
  ): Promise<WorkspaceQueueStatus> => {
    const res = await api.put<WorkspaceQueueStatus>(
      `/workspaces/${workspaceId}/queue-settings`,
      body,
    );
    return res.data;
  },

  list: async (workspaceId: number): Promise<{ items: QueueItem[]; total: number }> => {
    const res = await api.get<{ items: QueueItem[]; total: number }>(
      `/workspaces/${workspaceId}/queues`,
    );
    return res.data;
  },

  create: async (
    workspaceId: number,
    body: { name: string; description?: string; max_depth?: number },
  ): Promise<QueueItem> => {
    const res = await api.post<QueueItem>(`/workspaces/${workspaceId}/queues`, body);
    return res.data;
  },

  get: async (workspaceId: number, name: string): Promise<QueueItem> => {
    const res = await api.get<QueueItem>(`/workspaces/${workspaceId}/queues/${encodeURIComponent(name)}`);
    return res.data;
  },

  delete: async (workspaceId: number, name: string): Promise<void> => {
    await api.delete(`/workspaces/${workspaceId}/queues/${encodeURIComponent(name)}`);
  },

  listLogs: async (
    workspaceId: number,
    name: string,
    params?: { page?: number; limit?: number; action?: string },
  ): Promise<{ items: QueueLogItem[]; total: number }> => {
    const res = await api.get<{ items: QueueLogItem[]; total: number }>(
      `/workspaces/${workspaceId}/queues/${encodeURIComponent(name)}/logs`,
      { params },
    );
    return res.data;
  },

  listProjectLogs: async (
    workspaceId: number,
    params?: { page?: number; limit?: number; action?: string },
  ): Promise<{ items: (QueueLogItem & { queue_name: string })[]; total: number }> => {
    const res = await api.get<{ items: (QueueLogItem & { queue_name: string })[]; total: number }>(
      `/workspaces/${workspaceId}/queues/logs`,
      { params },
    );
    return res.data;
  },

  peek: async (workspaceId: number, name: string) => {
    const res = await api.get<{ id: number; payload: unknown; created_at?: string | null }>(
      `/workspaces/${workspaceId}/queues/${encodeURIComponent(name)}/peek`,
      { validateStatus: (s) => s === 200 || s === 204 },
    );
    if (res.status === 204) return null;
    return res.data;
  },
};
