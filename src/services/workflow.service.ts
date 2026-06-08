import { WorkflowCreatePayload } from '@/types/workflow';
import api from './api';

export const WorkflowService = {
  saveWorkflow: async (payload: WorkflowCreatePayload) => {
    const response = await api.post('/workflows/', payload);
    return response.data;
  },

  updateWorkflow: async (id: number, payload: WorkflowCreatePayload) => {
    const response = await api.put(`/workflows/${id}`, { ...payload, id });
    return response.data;
  },

  getWorkflow: async (uuid: string) => {
    const response = await api.get(`/workflows/${uuid}`);
    return response.data;
  },

  listWorkflows: async (workspaceId: number, page = 1, size = 20) => {
    const response = await api.get('/workflows/', {
      params: { workspace_id: workspaceId, page, size },
    });
    return response.data;
  },

  runWorkflow: async (uuid: string) => {
    const response = await api.post(`/workflows/run/${uuid}`);
    return response.data;
  },

  listWorkflowRuns: async (
    workspaceId: number,
    workflowUuid?: string,
    page = 1,
    limit = 20,
  ) => {
    const response = await api.get('/workflows/runs', {
      params: {
        workspace_id: workspaceId,
        workflow_uuid: workflowUuid,
        page,
        limit,
      },
    });
    return response.data;
  },

  getWorkflowRun: async (runId: number) => {
    const response = await api.get(`/workflows/runs/${runId}`);
    return response.data;
  },

  listPipelines: async (workspaceId: number) => {
    const response = await api.get('/pipelines/', {
      params: { workspace_id: workspaceId, page: 1, size: 100 },
    });
    return response.data;
  },

  getDebugSteps: async (
    uuid: string,
    body?: { current_payload?: unknown; prior_run_succeeded?: boolean },
  ) => {
    const response = await api.post(`/workflows/debug-steps/${uuid}`, body ?? {});
    return response.data as WorkflowDebugStepPlan;
  },

  runDebugStep: async (uuid: string, body: WorkflowDebugStepRequest) => {
    const response = await api.post(`/workflows/debug-step/${uuid}`, body);
    return response.data as WorkflowDebugStepResult;
  },
};

export interface WorkflowDebugStepPlan {
  total_steps: number;
  steps: Array<{
    step_index: number;
    kind: string;
    node_uuid: string;
    node_name: string;
    node_type: number | null;
    node_config?: Record<string, unknown>;
    branch_label?: string | null;
    branch_index?: number | null;
    is_branch_entry?: boolean;
    is_branch_exit?: boolean;
  }>;
}

export interface WorkflowDebugStepRequest {
  step_index: number;
  current_payload?: unknown;
  fork_payload?: unknown;
  branch_outputs?: Record<string, unknown>;
  prior_run_succeeded?: boolean;
}

export interface WorkflowDebugStepResult {
  step_index: number;
  total_steps: number;
  is_last: boolean;
  kind: string;
  branch_label?: string | null;
  branch_index?: number | null;
  is_branch_entry?: boolean;
  is_branch_exit?: boolean;
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
  parallel_context?: {
    fork_uuid: string;
    join_uuid: string;
    branch_starts: string[];
    fork_payload: unknown;
  } | null;
  branch_update?: {
    branch_start_uuid: string;
    branch_output: unknown;
  } | null;
}
