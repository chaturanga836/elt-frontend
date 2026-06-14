// src/services/task.service.ts
import api from './api';

function wsParams(workspaceId: number) {
  return { params: { workspace_id: workspaceId } };
}

export interface getTaskListParams {
  workspace_id: number;
  page?: number;
  limit?: number;
  query?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  signal?: AbortSignal;
}

export interface TaskResponse {
  id: number;
  name: string;
  description?: string;
  script: string;
  version?: number;
  created_at: string;
  updated_at: string;
}

export const TaskService = {
  createTask: async (workspaceId: number, payload: Record<string, unknown>) => {
    const response = await api.post('/tasks/', payload, wsParams(workspaceId));
    return response.data;
  },

  getTask: async (workspaceId: number, id: number) => {
    const response = await api.get<TaskResponse>(`/tasks/${id}`, wsParams(workspaceId));
    return response.data;
  },

  updateTask: async (workspaceId: number, id: number, payload: Record<string, unknown>) => {
    const response = await api.put(`/tasks/${id}`, payload, wsParams(workspaceId));
    return response.data;
  },

  getTaskList: async (payload: getTaskListParams) => {
    const { workspace_id, signal, ...params } = payload;
    const response = await api.get('/tasks/', {
      params: { workspace_id, ...params },
      signal,
    });
    return response.data;
  },
};
