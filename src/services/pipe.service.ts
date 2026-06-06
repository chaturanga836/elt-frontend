import { CanvasStructure, PipelineCreatePayload } from '@/types/pipetypes';
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
  pipeline_name?: string;
  status?: number;
  start_date?: string; // ISO String format
  end_date?: string;   // ISO String format
  page?: number;
  limit?: number;
}

export interface PipelineNodeLog {
  id: number;
  node_uuid: string;
  node_name: string;
  step_index: number;
  status: number;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  stdout_logs: string | null;
  error_traceback: string | null;
  execution_time_ms: number | null;
  executed_at: string;
}

export interface PipelineRunDetail {
  run: {
    id: number;
    pipeline_uuid: string;
    pipeline_name?: string | null;
    pipeline_id: number;
    org_id: number;
    workspace_id: number;
    status: number;
    error_summary: string | null;
    canvas_snapshot: unknown;
    started_at: string;
    finished_at: string | null;
  };
  node_logs: PipelineNodeLog[];
}

export interface PipelineDebugStepPlan {
  total_steps: number;
  steps: Array<{
    step_index: number;
    node_uuid: string;
    node_name: string;
    node_type: number | null;
    kind: string;
    node_config?: Record<string, unknown>;
  }>;
}

export interface PipelineDebugVariableBindings {
  inputs: Array<{
    key: string;
    source_path?: string;
    value: unknown;
    description?: string;
  }>;
  outputs: Array<{
    key: string;
    value: unknown;
    description?: string;
  }>;
  connection_variables: Array<{
    key: string;
    mapping: string;
    resolved_value: unknown;
  }>;
}

export interface PipelineDebugStepResult {
  step_index: number;
  total_steps: number;
  is_last: boolean;
  node_uuid: string;
  node_name: string;
  node_type: number | null;
  node_config?: Record<string, unknown>;
  status: number;
  skipped: boolean;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  stdout_logs: string | null;
  error_traceback: string | null;
  execution_time_ms: number | null;
  next_payload: unknown;
  step_succeeded: boolean;
  variable_bindings?: PipelineDebugVariableBindings;
}

export interface PipelineDebugStepRequest {
  step_index: number;
  current_payload?: unknown;
  prior_run_succeeded?: boolean;
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
    const response = await api.get<{
      pipeline: {
        id: number;
        pipeline_uuid: string;
        name: string;
        canvas_structure?: CanvasStructure;
      };
      nodes: Array<{
        node_uuid: string;
        node_type: number;
        node_config?: Record<string, unknown>;
        task_id?: number | null;
      }>;
    }>(`/pipelines/${uuid}`);
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

  getPipelineRunDetail: async (runId: number): Promise<PipelineRunDetail> => {
    const response = await api.get(`/sync/runs/${runId}`);
    return response.data;
  },

  getDebugSteps: async (
    uuid: string,
    priorRunSucceeded = true,
  ): Promise<PipelineDebugStepPlan> => {
    const response = await api.get(`/sync/debug-steps/${uuid}`, {
      params: { prior_run_succeeded: priorRunSucceeded },
    });
    return response.data;
  },

  runDebugStep: async (
    uuid: string,
    body: PipelineDebugStepRequest,
  ): Promise<PipelineDebugStepResult> => {
    const response = await api.post(`/sync/debug-step/${uuid}`, body);
    return response.data;
  },
};