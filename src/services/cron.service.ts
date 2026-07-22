import api from './api';

export type CronJobItem = {
  id: number;
  name: string;
  schedule: string;
  target: string;
  enabled: boolean;
  history_log: boolean;
  payload?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CronJobLogItem = {
  id: number;
  job_id: number;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  actor?: string | null;
  created_at: string;
};

export type CronJobCreateBody = {
  name: string;
  schedule: string;
  target: string;
  enabled?: boolean;
  history_log?: boolean;
  payload?: Record<string, unknown>;
};

export type CronJobUpdateBody = {
  schedule?: string;
  target?: string;
  enabled?: boolean;
  history_log?: boolean;
  payload?: Record<string, unknown>;
};

export const CronService = {
  list: async (workspaceId: number): Promise<{ items: CronJobItem[]; total: number }> => {
    const res = await api.get<{ items: CronJobItem[]; total: number }>(
      `/workspaces/${workspaceId}/cron-jobs`,
    );
    return res.data;
  },

  create: async (workspaceId: number, body: CronJobCreateBody): Promise<CronJobItem> => {
    const res = await api.post<CronJobItem>(`/workspaces/${workspaceId}/cron-jobs`, body);
    return res.data;
  },

  update: async (
    workspaceId: number,
    name: string,
    body: CronJobUpdateBody,
  ): Promise<CronJobItem> => {
    const res = await api.patch<CronJobItem>(
      `/workspaces/${workspaceId}/cron-jobs/${encodeURIComponent(name)}`,
      body,
    );
    return res.data;
  },

  delete: async (workspaceId: number, name: string): Promise<void> => {
    await api.delete(`/workspaces/${workspaceId}/cron-jobs/${encodeURIComponent(name)}`);
  },

  listLogs: async (
    workspaceId: number,
    name: string,
    params?: { page?: number; limit?: number },
  ): Promise<{ items: CronJobLogItem[]; total: number; history_log: boolean }> => {
    const res = await api.get<{ items: CronJobLogItem[]; total: number; history_log: boolean }>(
      `/workspaces/${workspaceId}/cron-jobs/${encodeURIComponent(name)}/logs`,
      { params },
    );
    return res.data;
  },
};
