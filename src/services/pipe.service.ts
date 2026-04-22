import api from './api';

export interface PipelineTask {
task_key: string;
  task_name: string; // Add this field
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
export interface PipelinePayload {
  pipeline_uuid: string;
  name: string;
  org_id: number;
  workspace_id: number;
  tasks: PipelineTask[];
}

export const PipelineService = {
  savePipeline: async (payload: PipelinePayload) => {
    // The interceptor in api.ts handles tokens and global error alerts
    const response = await api.post('/pipelines/', payload);
    return response.data;
  },

  // You can add more methods here later
  getPipeline: async (uuid: string) => {
    const response = await api.get(`/pipelines/${uuid}`);
    return response.data;
  },

getPipelines: async (params: PipelineFilterParams) => {
    const response = await api.get('/pipelines/', { 
      params: params 
    });
    return response.data; // Returns { items, total, page, size, pages }
  },
};