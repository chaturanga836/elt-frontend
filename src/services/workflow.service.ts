import { WorkflowCreatePayload } from '@/types/workflow';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const getBaseUrl = () =>
  API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE}/api/v1`;

export const WorkflowService = {
  saveWorkflow: async (payload: WorkflowCreatePayload) => {
    const res = await fetch(`${getBaseUrl()}/workflows/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save workflow');
    return res.json();
  },

  updateWorkflow: async (id: number, payload: WorkflowCreatePayload) => {
    const res = await fetch(`${getBaseUrl()}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id }),
    });
    if (!res.ok) throw new Error('Failed to update workflow');
    return res.json();
  },

  getWorkflow: async (uuid: string) => {
    const res = await fetch(`${getBaseUrl()}/workflows/${uuid}`);
    if (!res.ok) throw new Error('Workflow not found');
    return res.json();
  },

  listWorkflows: async (page = 1, size = 20) => {
    const res = await fetch(`${getBaseUrl()}/workflows/?page=${page}&size=${size}`);
    if (!res.ok) throw new Error('Failed to list workflows');
    return res.json();
  },

  runWorkflow: async (uuid: string) => {
    const res = await fetch(`${getBaseUrl()}/workflows/run/${uuid}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start workflow run');
    return res.json();
  },

  getWorkflowRun: async (runId: number) => {
    const res = await fetch(`${getBaseUrl()}/workflows/runs/${runId}`);
    if (!res.ok) throw new Error('Failed to load run');
    return res.json();
  },

  listPipelines: async () => {
    const res = await fetch(`${getBaseUrl()}/pipelines/?page=1&size=100`);
    if (!res.ok) throw new Error('Failed to load pipelines');
    return res.json();
  },
};
