import api from './api';

export type StudioAccountUser = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role: string;
  keycloak_id: string;
};

export type StudioAccountOrganization = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  realm_id: string;
  settings: Record<string, unknown>;
};

export type StudioAccount = {
  user: StudioAccountUser;
  organization: StudioAccountOrganization;
  realm_roles: string[];
  is_super_admin: boolean;
  project_ids: number[];
};

export type ProjectCredentialsCreated = {
  client_key: string;
  client_secret: string;
};

export type ProjectCredentialsMeta = {
  client_key: string;
  secret_prefix: string;
  created_at?: string | null;
  rotated_at?: string | null;
};

export type StudioProject = {
  project_id: number;
  org_id: number;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  region?: string | null;
  settings: Record<string, unknown>;
  created_at?: string | null;
  credentials?: ProjectCredentialsCreated | null;
  credentials_meta?: ProjectCredentialsMeta | null;
};

export const StudioService = {
  getAccount: async (): Promise<StudioAccount> => {
    const res = await api.get<StudioAccount>('/studio/account');
    return res.data;
  },

  createProject: async (
    body: { name: string; description?: string; slug?: string; region?: string },
    orgId?: number,
  ): Promise<StudioProject> => {
    const res = await api.post<StudioProject>('/studio/projects', body, {
      params: orgId ? { org_id: orgId } : undefined,
    });
    return res.data;
  },

  getProjectCredentials: async (projectId: number): Promise<ProjectCredentialsMeta> => {
    const res = await api.get<ProjectCredentialsMeta>(
      `/studio/projects/${projectId}/credentials`,
      { params: { workspace_id: projectId } },
    );
    return res.data;
  },

  regenerateProjectCredentials: async (
    projectId: number,
  ): Promise<ProjectCredentialsCreated> => {
    const res = await api.post<ProjectCredentialsCreated>(
      `/studio/projects/${projectId}/credentials/regenerate`,
      undefined,
      { params: { workspace_id: projectId } },
    );
    return res.data;
  },
};
