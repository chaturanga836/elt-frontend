import axios from 'axios';
import { resolvePublicApiBaseUrl } from '@/lib/publicUrls';

const publicApi = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

publicApi.interceptors.request.use((config) => {
  config.baseURL = resolvePublicApiBaseUrl();
  return config;
});

export type SignupRequest = {
  username: string;
  password: string;
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
