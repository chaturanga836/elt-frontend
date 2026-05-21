import { PipelineCreatePayload } from '@/types/pipetypes';
import api from './api';

export interface PipelineTask {
  task_key: string;
  task_name: string; 
  connection_id: number;
  depends_on: string[];
  transform_code: string;
  func_name: string;
  input_mapping?: Record<string, any>;
}

export interface PipelineFilterParams {
  org_id?: number;
  workspace_id?: number;
  page?: number;
  size?: number;
  name?: string;
}

// 1. Explicitly structure incoming log details matching your FastAPI backend
export interface PipelineRunHistoryParams {
  pipeline_uuid?: string;
  status?: number;
  start_date?: string; // ISO String format
  end_date?: string;   // ISO String format
  page?: number;
  limit?: number;
}

export const PipelineService = {
  savePipeline: async (payload: PipelineCreatePayload) => {
    const response = await api.post('/pipelines/', payload);
    return response.data;
  },

  UpdatePipeline: async (id: number, payload: PipelineCreatePayload) => {
    const response = await api.put(`/pipelines/${id}`, payload);
    return response.data;
  },

  getPipeline: async (uuid: string) => {
    const response = await api.get(`/pipelines/${uuid}`);
    return response.data;
  },

  getPipelines: async (params: PipelineFilterParams) => {
    const response = await api.get('/pipelines/', { 
      params: params 
    });
    return response.data; 
  },

  runPipe: async (uuid: string) => {
    const response = await api.post(`/sync/run/${uuid}`);
    return response.data;
  },

  // 2. Add the dynamic log retrieval method hooked to your /api/v1/sync/runs endpoint
  getPipelineRuns: async (params: PipelineRunHistoryParams) => {
    const response = await api.get('/sync/runs', {
      params: params
    });
    return response.data; // Returns { meta: { total_records, page, limit, total_pages }, results: [...] }
  },
};