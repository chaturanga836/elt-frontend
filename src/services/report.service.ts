import api from './api';

export type ReportSectionColumn = {
  key: string;
  label: string;
  format?: 'join' | 'json';
};

export type ReportSection = {
  type: 'fields' | 'table' | 'key_value';
  title: string;
  paths?: { label: string; path: string }[];
  array_path?: string;
  columns?: ReportSectionColumn[];
  object_path?: string;
};

export type ReportLayout = {
  sections: ReportSection[];
};

export type ReportDefinition = {
  id: number;
  org_id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  pipeline_uuid?: string | null;
  data_root_path?: string | null;
  layout: ReportLayout;
  created_at: string;
  updated_at: string;
};

export type ReportPreset = {
  key: string;
  name: string;
  description: string;
  data_root_path: string;
  layout: ReportLayout;
};

export type ReportPreview = {
  run_id: number;
  definition_id: number;
  definition_name: string;
  data: Record<string, unknown>;
  html: string;
  csv: string;
};

export const ReportService = {
  listPresets: async () => {
    const res = await api.get<{ items: ReportPreset[] }>('/reports/presets');
    return res.data.items;
  },

  list: async (params: {
    workspace_id: number;
    org_id?: number;
    pipeline_uuid?: string;
    query?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<{
      items: ReportDefinition[];
      total: number;
      page: number;
      limit: number;
    }>('/reports/', { params: { org_id: 1, ...params } });
    return res.data;
  },

  get: async (id: number) => {
    const res = await api.get<ReportDefinition>(`/reports/${id}`);
    return res.data;
  },

  create: async (payload: {
    name: string;
    description?: string;
    pipeline_uuid?: string;
    data_root_path?: string;
    layout: ReportLayout;
    workspace_id: number;
    org_id?: number;
  }) => {
    const res = await api.post<ReportDefinition>('/reports/', {
      org_id: 1,
      ...payload,
    });
    return res.data;
  },

  update: async (
    id: number,
    payload: Partial<{
      name: string;
      description: string;
      pipeline_uuid: string;
      data_root_path: string;
      layout: ReportLayout;
    }>,
  ) => {
    const res = await api.put<ReportDefinition>(`/reports/${id}`, payload);
    return res.data;
  },

  remove: async (id: number) => {
    await api.delete(`/reports/${id}`);
  },

  preview: async (runId: number, definitionId: number) => {
    const res = await api.post<ReportPreview>('/reports/preview', {
      run_id: runId,
      definition_id: definitionId,
    });
    return res.data;
  },

  downloadExport: async (
    runId: number,
    definitionId: number,
    format: 'html' | 'csv' | 'json',
    filename: string,
  ) => {
    const res = await api.get(`/reports/runs/${runId}/export`, {
      params: { definition_id: definitionId, format },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type:
        format === 'json'
          ? 'application/json'
          : format === 'csv'
            ? 'text/csv'
            : 'text/html',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
