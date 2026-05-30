import api from './api';

export type DefaultOrganization = {
  organization_id: number;
  name: string;
  realm_id: string;
  description?: string | null;
  is_active: boolean;
};

export const OrganizationService = {
  getDefault: async (): Promise<DefaultOrganization> => {
    const res = await api.get<DefaultOrganization>('/organization/default');
    return res.data;
  },
};
