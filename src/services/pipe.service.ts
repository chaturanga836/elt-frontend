import { CanvasStructure, PipelineCreatePayload } from '@/types/pipetypes';
import api from './api';

function wsParams(workspaceId: number) {
  return { params: { workspace_id: workspaceId } };
}

export interface PipelineFilterParams {
  workspace_id: number;
  org_id?: number;
  page?: number;
  size?: number;
  name?: string;
}

export interface PipelineRunHistoryParams {
  workspace_id: number;
  pipeline_uuid?: string;
  pipeline_name?: string;
  status?: number;
  start_date?: string;
  end_date?: string;
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

export interface PipelineRunContext {
  payload?: unknown;
  globals?: Record<string, unknown>;
  total_steps?: number;
  run_succeeded?: boolean;
}

export interface PipelineRunSummary {
  id: number;
  pipeline_uuid: string;
  pipeline_name?: string | null;
  pipeline_id: number;
  org_id: number;
  workspace_id: number;
  status: number;
  error_summary: string | null;
  canvas_snapshot?: unknown;
  graph_snapshot?: unknown;
  input_payload?: unknown;
  current_step_index?: number | null;
  backfill_batch_id?: string | null;
  run_context?: PipelineRunContext | null;
  can_resume?: boolean;
  started_at: string;
  finished_at: string | null;
}

export interface PipelineRunDetail {
  run: PipelineRunSummary;
  node_logs: PipelineNodeLog[];
}

export interface ResumePipelineRunResponse {
  message: string;
  run_id: number;
  resume_from_step: number;
  status: string;
}

export interface PipelineBackfillResponse {
  message: string;
  backfill_batch_id: string;
  pipeline_uuid: string;
  pipeline_id: number;
  start_date: string;
  end_date: string;
  date_field: string;
  total_days: number;
  runs: Array<{
    run_id: number;
    sync_date: string;
    input_payload: Record<string, unknown>;
  }>;
}

export interface PipelineBackfillStatus {
  backfill_batch_id: string;
  pipeline_uuid: string;
  total_runs: number;
  runs: Array<{
    id: number;
    status: number;
    input_payload: Record<string, unknown> | null;
    error_summary: string | null;
    started_at: string;
    finished_at: string | null;
  }>;
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
  next_globals?: Record<string, unknown>;
  step_succeeded: boolean;
  variable_bindings?: PipelineDebugVariableBindings;
}

export interface PipelineDebugStepRequest {
  step_index: number;
  current_payload?: unknown;
  current_globals?: Record<string, unknown>;
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

  getPipeline: async (workspaceId: number, uuid: string) => {
    const response = await api.get<{
      pipeline: {
        id: number;
        pipeline_uuid: string;
        name: string;
        is_draft?: boolean;
        canvas_structure?: CanvasStructure;
      };
      nodes: Array<{
        node_uuid: string;
        node_type: number;
        node_config?: Record<string, unknown>;
        task_id?: number | null;
      }>;
    }>(`/pipelines/${uuid}`, wsParams(workspaceId));
    return response.data;
  },

  getPipelines: async (params: PipelineFilterParams) => {
    const response = await api.get('/pipelines/', { params });
    return response.data;
  },

  runPipe: async (workspaceId: number, uuid: string, inputPayload?: Record<string, unknown>) => {
    const response = await api.post(
      `/sync/run/${uuid}`,
      { input_payload: inputPayload ?? undefined },
      wsParams(workspaceId),
    );
    return response.data;
  },

  runPipelineBackfill: async (
    workspaceId: number,
    uuid: string,
    body: {
      start_date: string;
      end_date: string;
      date_field?: string;
      input_payload?: Record<string, unknown>;
    },
  ): Promise<PipelineBackfillResponse> => {
    const response = await api.post(`/sync/run/${uuid}/backfill`, body, wsParams(workspaceId));
    return response.data;
  },

  getPipelineBackfill: async (workspaceId: number, batchId: string): Promise<PipelineBackfillStatus> => {
    const response = await api.get(`/sync/backfills/${batchId}`, wsParams(workspaceId));
    return response.data;
  },

  getPipelineRuns: async (params: PipelineRunHistoryParams) => {
    const response = await api.get('/sync/runs', { params });
    return response.data;
  },

  getPipelineRunDetail: async (workspaceId: number, runId: number): Promise<PipelineRunDetail> => {
    const response = await api.get(`/sync/runs/${runId}`, wsParams(workspaceId));
    return response.data;
  },

  resumePipelineRun: async (
    workspaceId: number,
    runId: number,
    body?: { from_step_index?: number },
  ): Promise<ResumePipelineRunResponse> => {
    const response = await api.post(`/sync/runs/${runId}/resume`, body ?? {}, wsParams(workspaceId));
    return response.data;
  },

  getDebugSteps: async (
    workspaceId: number,
    uuid: string,
    priorRunSucceeded = true,
  ): Promise<PipelineDebugStepPlan> => {
    const response = await api.get(`/sync/debug-steps/${uuid}`, {
      params: { workspace_id: workspaceId, prior_run_succeeded: priorRunSucceeded },
    });
    return response.data;
  },

  runDebugStep: async (
    workspaceId: number,
    uuid: string,
    body: PipelineDebugStepRequest,
  ): Promise<PipelineDebugStepResult> => {
    const response = await api.post(`/sync/debug-step/${uuid}`, body, wsParams(workspaceId));
    return response.data;
  },
};
