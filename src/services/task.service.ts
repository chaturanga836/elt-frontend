// src/services/task.service.ts
import api from './api';

export interface getTaskListParams {
    page?: number;
    limit?: number;
    query?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
export interface TaskResponse {
    id: number;
    name: string;
    description: string;
    version: number;
    created_at: string;
    updated_at: string;
}
export const TaskService = {

    createTask: async (payload: any) => {
        const response = await api.post('/tasks/', payload);
        return response.data;
    },

    updateTask: async (id: number, payload: any) => {
        const response = await api.put(`/tasks/${id}`, payload);
        return response.data;
    },

    getTaskList: async(payload: getTaskListParams) => {
        const response = await api.get('/tasks/', { params: payload });
        return response.data;
    }
}