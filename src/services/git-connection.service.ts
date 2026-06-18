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

export interface GitHubRepoSummary {
  full_name: string;
  name: string;
  owner_login: string;
  private: boolean;
  default_branch: string;
  description?: string | null;
  updated_at?: string | null;
}

export interface GitHubBranchSummary {
  name: string;
  sha: string;
  protected: boolean;
}

export interface GitRepoImportRequest {
  repo_full_name: string;
  default_branch?: string;
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

  listGitHubRepos: async (workspaceId: number, connectionId: number, page = 1) => {
    const response = await api.get<{ items: GitHubRepoSummary[]; page: number; per_page: number }>(
      `/git-connections/${connectionId}/github/repos`,
      { params: { workspace_id: workspaceId, page, per_page: 100 } },
    );
    return response.data;
  },

  listGitHubBranches: async (
    workspaceId: number,
    connectionId: number,
    repoFullName: string,
  ) => {
    const response = await api.get<{ items: GitHubBranchSummary[]; repo_full_name: string }>(
      `/git-connections/${connectionId}/github/branches`,
      {
        params: {
          workspace_id: workspaceId,
          repo_full_name: repoFullName,
          per_page: 100,
        },
      },
    );
    return response.data;
  },

  importRepository: async (
    workspaceId: number,
    connectionId: number,
    payload: GitRepoImportRequest,
  ) => {
    const response = await api.post<GitConnection>(
      `/git-connections/${connectionId}/import`,
      payload,
      wsParams(workspaceId),
    );
    return response.data;
  },
};
