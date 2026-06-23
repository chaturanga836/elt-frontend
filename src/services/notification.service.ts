import api from './api';

export type NotificationSettings = {
  enabled: boolean;
  provisioned_at?: string | null;
  broker_instance_ref?: string | null;
  ws_url?: string | null;
  provisioning_status?: 'idle' | 'provisioning' | 'ready' | 'failed';
};

export type WorkspaceNotificationStatus = {
  enabled: boolean;
  ws_url?: string | null;
  provisioning_status?: 'idle' | 'provisioning' | 'ready' | 'failed';
};

export type NotificationLogItem = {
  id: number;
  org_id: number;
  workspace_id?: number | null;
  action: string;
  actor?: string | null;
  channel?: string | null;
  recipient_count?: number | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NotificationItem = {
  id: number;
  org_id: number;
  workspace_id?: number | null;
  event_type: string;
  title: string;
  body?: string | null;
  payload: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
};

export type OrgNotificationRegistryItem = {
  workspace_id: number;
  workspace_name: string;
  channel: string;
  publish_count_24h: number;
  last_publish_at?: string | null;
};

export const NotificationService = {
  getOrgSettings: async (): Promise<NotificationSettings> => {
    const res = await api.get<NotificationSettings>('/organization/settings/notification');
    return res.data;
  },

  updateOrgSettings: async (body: { enabled: boolean }): Promise<NotificationSettings> => {
    const res = await api.put<NotificationSettings>('/organization/settings/notification', body, {
      timeout: 180_000,
    });
    return res.data;
  },

  listOrgRegistry: async (): Promise<{ items: OrgNotificationRegistryItem[]; total: number }> => {
    const res = await api.get<{ items: OrgNotificationRegistryItem[]; total: number }>(
      '/organization/settings/notifications/registry',
    );
    return res.data;
  },

  getStatus: async (workspaceId: number): Promise<WorkspaceNotificationStatus> => {
    const res = await api.get<WorkspaceNotificationStatus>(
      `/workspaces/${workspaceId}/notification-status`,
    );
    return res.data;
  },

  updateOrgSettingsFromProject: async (
    workspaceId: number,
    body: { enabled: boolean },
  ): Promise<NotificationSettings> => {
    const res = await api.put<NotificationSettings>(
      `/workspaces/${workspaceId}/notification-settings`,
      body,
      { timeout: 180_000 },
    );
    return res.data;
  },

  listProjectLogs: async (
    workspaceId: number,
    params?: { page?: number; limit?: number; action?: string },
  ): Promise<{ items: NotificationLogItem[]; total: number }> => {
    const res = await api.get<{ items: NotificationLogItem[]; total: number }>(
      `/workspaces/${workspaceId}/notifications/logs`,
      { params },
    );
    return res.data;
  },

  listOrgLogs: async (
    params?: { page?: number; limit?: number; action?: string },
  ): Promise<{ items: NotificationLogItem[]; total: number }> => {
    const res = await api.get<{ items: NotificationLogItem[]; total: number }>(
      '/notifications/logs',
      { params },
    );
    return res.data;
  },

  listInbox: async (params?: {
    page?: number;
    limit?: number;
    unread_only?: boolean;
  }): Promise<{ items: NotificationItem[]; total: number; unread: number }> => {
    const res = await api.get<{ items: NotificationItem[]; total: number; unread: number }>(
      '/notifications',
      { params },
    );
    return res.data;
  },

  markRead: async (notificationId: number): Promise<NotificationItem> => {
    const res = await api.patch<NotificationItem>(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<{ marked: number }> => {
    const res = await api.post<{ marked: number }>('/notifications/read-all');
    return res.data;
  },
};

export function channelNamed(orgId: number, workspaceId: number, name: string): string {
  return `org:${orgId}:ws:${workspaceId}:channel:${name}`;
}

export function channelForWorkspace(orgId: number, workspaceId: number): string {
  return `org:${orgId}:ws:${workspaceId}`;
}
