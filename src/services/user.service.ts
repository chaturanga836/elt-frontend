import api from './api';

export type UserProfile = {
  sub: string | null;
  email: string | null;
  username: string | null;
  realm_roles: string[];
  is_super_admin: boolean;
  workspace_ids: number[];
  workspace_groups: string[];
};

export const UserService = {
  getMe: async (): Promise<UserProfile> => {
    const res = await api.get<UserProfile>('/users/me');
    return res.data;
  },
};
