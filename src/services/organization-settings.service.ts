import api from './api';
import { GitConnection } from './git-connection.service';
import { StudioProject } from './studio.service';

export type OrgRole = 'owner' | 'admin' | 'developer';

export type OrgMember = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  role: OrgRole;
  is_active: boolean;
  created_at?: string | null;
};

export type OrgInvitation = {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  actor_email: string;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export function normalizeOrgRole(role: string): OrgRole {
  if (role === 'owner' || role === 'admin' || role === 'developer') {
    return role;
  }
  return 'developer';
}

export function canManageOrgQueue(role: string, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  const normalized = normalizeOrgRole(role);
  return normalized === 'owner' || normalized === 'admin';
}

export function canManageOrgSettings(role: string, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return normalizeOrgRole(role) === 'owner';
}

export function canCreateProjects(role: string, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  const normalized = normalizeOrgRole(role);
  return normalized === 'owner' || normalized === 'admin';
}

export const OrganizationSettingsService = {
  listMembers: async (): Promise<OrgMember[]> => {
    const res = await api.get<OrgMember[]>('/organization/settings/members');
    return res.data;
  },

  listInvitations: async (): Promise<OrgInvitation[]> => {
    const res = await api.get<OrgInvitation[]>('/organization/settings/members/invitations');
    return res.data;
  },

  inviteMember: async (body: { email: string; role: OrgRole }): Promise<OrgInvitation> => {
    const res = await api.post<OrgInvitation>('/organization/settings/members/invitations', body);
    return res.data;
  },

  updateMemberRole: async (body: { email: string; role: OrgRole }): Promise<OrgMember> => {
    const res = await api.patch<OrgMember>('/organization/settings/members/role', body);
    return res.data;
  },

  listProjects: async (): Promise<{ items: StudioProject[]; total: number }> => {
    const res = await api.get<{ items: StudioProject[]; total: number }>(
      '/organization/settings/projects',
    );
    return res.data;
  },

  listAuditLogs: async (page = 1, limit = 50): Promise<{ items: AuditEvent[]; total: number }> => {
    const res = await api.get<{ items: AuditEvent[]; total: number }>(
      '/organization/settings/audit-logs',
      { params: { page, limit } },
    );
    return res.data;
  },

  listGitConnections: async (): Promise<{ items: GitConnection[]; total: number }> => {
    const res = await api.get<{ items: GitConnection[]; total: number }>(
      '/organization/settings/git-connections',
    );
    return res.data;
  },

  startGitHubOAuth: async (): Promise<{ authorize_url: string }> => {
    const res = await api.post<{ authorize_url: string }>(
      '/organization/settings/git-connections/github/start',
    );
    return res.data;
  },

  revokeGitConnection: async (connectionId: number): Promise<void> => {
    await api.delete(`/organization/settings/git-connections/${connectionId}`);
  },

  getQueueSettings: async (): Promise<{
    enabled: boolean;
    broker: 'postgres' | 'redis' | 'rabbitmq';
    provisioned_at?: string | null;
    broker_instance_ref?: string | null;
  }> => {
    const res = await api.get('/organization/settings/queue');
    return res.data;
  },

  updateQueueSettings: async (body: {
    enabled: boolean;
    broker: 'postgres' | 'redis' | 'rabbitmq';
  }) => {
    const res = await api.put('/organization/settings/queue', body);
    return res.data;
  },

  listOrgQueues: async (): Promise<{
    items: Array<{
      workspace_id: number;
      workspace_name: string;
      queue_id: number;
      queue_name: string;
      depth: number;
      created_at?: string | null;
    }>;
    total: number;
  }> => {
    const res = await api.get('/organization/settings/queues');
    return res.data;
  },
};
