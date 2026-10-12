import { apiClient } from './api';
import {
  TaskItem,
  CreateTaskPayload,
  UpdateTaskPayload,
  CompleteTaskResult,
} from '../types';

export interface GetTasksFilter {
  date?: string;
  day?: string;
  from?: string;
  to?: string;
  month?: string;
  categoryId?: number;
  status?: string;
  kind?: string;
}

export const tasksService = {
  async getTasks(filter: GetTasksFilter = {}): Promise<TaskItem[]> {
    return apiClient.get<TaskItem[]>('/tasks', {
      date: filter.date,
      day: filter.day,
      from: filter.from,
      to: filter.to,
      month: filter.month,
      categoryId: filter.categoryId,
      status: filter.status,
      kind: filter.kind,
    });
  },

  async getById(id: number): Promise<TaskItem> {
    return apiClient.get<TaskItem>(`/tasks/${id}`);
  },

  async create(payload: CreateTaskPayload): Promise<TaskItem> {
    return apiClient.post<TaskItem>('/tasks', payload);
  },

  async update(id: number, payload: UpdateTaskPayload): Promise<TaskItem> {
    return apiClient.patch<TaskItem>(`/tasks/${id}`, payload);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/tasks/${id}`);
  },

  async start(id: number): Promise<TaskItem> {
    return apiClient.post<TaskItem>(`/tasks/${id}/start`);
  },

  async complete(id: number): Promise<CompleteTaskResult> {
    return apiClient.post<CompleteTaskResult>(`/tasks/${id}/complete`);
  },
};
