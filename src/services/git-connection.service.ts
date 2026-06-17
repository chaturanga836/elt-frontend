import api from './api';

function wsParams(workspaceId: number) {
  return { params: { workspace_id: workspaceId } };
}

export interface GitConnection {
  id: number;
  provider: string;
  account_login?: string | null;
  repo_full_name?: string | null;
  default_branch: string;
  scopes: string[];
  last_sync_at?: string | null;
  last_sync_sha?: string | null;
  status: string;
  created_at?: string | null;
}

export interface GitConnectionCreate {
  provider: 'github' | 'gitlab' | 'bitbucket';
  account_login?: string;
  repo_full_name?: string;
  default_branch?: string;
  access_token: string;
  scopes?: string[];
}

export const GitConnectionService = {
  list: async (workspaceId: number) => {
    const response = await api.get<{ items: GitConnection[]; total: number }>(
      '/git-connections/',
      wsParams(workspaceId),
    );
    return response.data;
  },

  create: async (workspaceId: number, payload: GitConnectionCreate) => {
    const response = await api.post<GitConnection>('/git-connections/', payload, wsParams(workspaceId));
    return response.data;
  },

  revoke: async (workspaceId: number, connectionId: number) => {
    await api.delete(`/git-connections/${connectionId}`, wsParams(workspaceId));
  },

  startGitHubOAuth: async (workspaceId: number) => {
    const response = await api.post<{ authorize_url: string }>(
      '/git-connections/github/start',
      {},
      wsParams(workspaceId),
    );
    return response.data;
  },
};
