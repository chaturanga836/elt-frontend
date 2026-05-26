// src/services/external-link.service.ts
import api from './api';

export interface ExternalLinkPayload {
  name: string;
  url: string;
  description?: string;
  category?: string;
  org_id?: number;
  workspace_id?: number;
}

export interface ExternalLinkResponse {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  org_id: number;
  workspace_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalLinkListResponse {
  items: ExternalLinkResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ExternalLinkListParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  org_id?: number;
  workspace_id?: number;
  signal?: AbortSignal;
}

export const ExternalLinkService = {
  create: async (payload: ExternalLinkPayload): Promise<ExternalLinkResponse> => {
    const response = await api.post('/external-links/', payload);
    return response.data;
  },

  list: async (params: ExternalLinkListParams): Promise<ExternalLinkListResponse> => {
    const { signal, ...rest } = params;
    const response = await api.get('/external-links/', { params: rest, signal });
    return response.data;
  },

  get: async (id: number): Promise<ExternalLinkResponse> => {
    const response = await api.get(`/external-links/${id}`);
    return response.data;
  },

  update: async (id: number, payload: Partial<ExternalLinkPayload>): Promise<ExternalLinkResponse> => {
    const response = await api.put(`/external-links/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/external-links/${id}`);
  },

  validateCode: async (code: string): Promise<{
    is_valid: boolean;
    blocked_urls: string[];
    message: string;
  }> => {
    const response = await api.get('/external-links/validate/urls', {
      params: { code },
    });
    return response.data;
  },
};
