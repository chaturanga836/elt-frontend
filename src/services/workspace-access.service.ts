import api from './api';

export type WorkspaceRole =
  | 'workspace_user'
  | 'workspace_viewer'
  | 'workspace_editor'
  | 'workspace_admin';

export type Invitation = {
  id: string;
  workspace_id: number;
  email: string;
  role: WorkspaceRole;
  status: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
};

export type WorkspaceMember = {
  email: string;
  role: WorkspaceRole;
  source: string;
  user_id?: string | null;
};

export const WorkspaceAccessService = {
  listInvitations: async (workspaceId: number): Promise<Invitation[]> => {
    const res = await api.get<Invitation[]>(
      `/workspace-access/workspaces/${workspaceId}/invitations`,
    );
    return res.data;
  },

  createInvitation: async (
    workspaceId: number,
    body: { email: string; role: WorkspaceRole; expires_in_days?: number },
  ): Promise<Invitation> => {
    const res = await api.post<Invitation>(
      `/workspace-access/workspaces/${workspaceId}/invitations`,
      body,
    );
    return res.data;
  },

  listMembers: async (workspaceId: number): Promise<WorkspaceMember[]> => {
    const res = await api.get<WorkspaceMember[]>(
      `/workspace-access/workspaces/${workspaceId}/members`,
    );
    return res.data;
  },

  updateMemberRole: async (
    workspaceId: number,
    body: { email: string; role: WorkspaceRole },
  ): Promise<WorkspaceMember> => {
    const res = await api.patch<WorkspaceMember>(
      `/workspace-access/workspaces/${workspaceId}/members/role`,
      body,
    );
    return res.data;
  },
};
