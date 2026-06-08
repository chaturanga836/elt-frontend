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
};
