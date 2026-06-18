import axios from 'axios';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://144.24.127.112:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export type SignupRequest = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  org_name?: string;
  create_default_project?: boolean;
  project_name?: string;
};

export type SignupResponse = {
  organization_id: number;
  user_id: number;
  project_id?: number | null;
  email: string;
  access_token?: string | null;
  refresh_token?: string | null;
};

export const AuthService = {
  signup: async (body: SignupRequest): Promise<SignupResponse> => {
    const res = await publicApi.post<SignupResponse>('/auth/signup', body);
    return res.data;
  },
};
